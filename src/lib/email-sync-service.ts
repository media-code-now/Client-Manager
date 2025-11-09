import { google } from 'googleapis';
import { neon } from '@neondatabase/serverless';
import { decryptEmailCredentials, EmailCredentials } from './encryption';
import Imap from 'imap';
import { simpleParser } from 'mailparser';

const sql = neon(process.env.DATABASE_URL!);

/**
 * Email sync service for fetching emails from providers
 */
export class EmailSyncService {
  private integrationId: number;
  private credentials: EmailCredentials;
  private userId: number;

  constructor(integrationId: number, encryptedCredentials: string, userId: number) {
    this.integrationId = integrationId;
    this.credentials = decryptEmailCredentials(encryptedCredentials);
    this.userId = userId;
  }

  /**
   * Main sync function - fetches new emails
   */
  async syncEmails(): Promise<{ success: boolean; messagesSynced: number; error?: string }> {
    const startTime = Date.now();
    
    try {
      // Update sync status to 'syncing'
      await this.updateSyncStatus('syncing');

      let messagesSynced = 0;

      switch (this.credentials.provider) {
        case 'gmail':
          messagesSynced = await this.syncGmailEmails();
          break;
        case 'outlook':
          messagesSynced = await this.syncOutlookEmails();
          break;
        case 'yahoo':
        case 'smtp':
          messagesSynced = await this.syncImapEmails();
          break;
        default:
          throw new Error(`Unsupported provider: ${this.credentials.provider}`);
      }

      // Update sync state
      const duration = Date.now() - startTime;
      await this.updateSyncState(messagesSynced, duration);

      return { success: true, messagesSynced };

    } catch (error) {
      console.error('Email sync error:', error);
      await this.updateSyncStatus('error', error instanceof Error ? error.message : 'Unknown error');
      
      return {
        success: false,
        messagesSynced: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Sync Gmail emails using Gmail API
   */
  private async syncGmailEmails(): Promise<number> {
    const oauth2Client = new google.auth.OAuth2(
      this.credentials.clientId,
      this.credentials.clientSecret,
      'http://localhost:3000/api/integrations/email/oauth/callback'
    );

    oauth2Client.setCredentials({
      access_token: this.credentials.accessToken,
      refresh_token: this.credentials.refreshToken,
    });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Get last sync state
    const syncState = await this.getSyncState();
    
    let messagesSynced = 0;

    // Use history API for incremental sync if we have a history ID
    if (syncState?.last_history_id) {
      // Incremental sync using History API
      const history = await gmail.users.history.list({
        userId: 'me',
        startHistoryId: syncState.last_history_id,
        historyTypes: ['messageAdded'],
      });

      if (history.data.history) {
        for (const item of history.data.history) {
          if (item.messagesAdded) {
            for (const msgAdded of item.messagesAdded) {
              if (msgAdded.message?.id) {
                await this.fetchAndStoreGmailMessage(gmail, msgAdded.message.id);
                messagesSynced++;
              }
            }
          }
        }
      }

      // Update history ID
      if (history.data.historyId) {
        await this.updateHistoryId(history.data.historyId);
      }
    } else {
      // Full sync - fetch recent messages (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const afterTimestamp = Math.floor(sevenDaysAgo.getTime() / 1000);

      const messages = await gmail.users.messages.list({
        userId: 'me',
        maxResults: 100,
        q: `after:${afterTimestamp}`,
      });

      if (messages.data.messages) {
        for (const message of messages.data.messages) {
          await this.fetchAndStoreGmailMessage(gmail, message.id!);
          messagesSynced++;
        }
      }

      // Get current history ID for future incremental syncs
      const profile = await gmail.users.getProfile({ userId: 'me' });
      if (profile.data.historyId) {
        await this.updateHistoryId(profile.data.historyId);
      }
    }

    return messagesSynced;
  }

  /**
   * Fetch and store a single Gmail message
   */
  private async fetchAndStoreGmailMessage(gmail: any, messageId: string): Promise<void> {
    const message = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full',
    });

    const data = message.data;
    const headers = data.payload.headers;

    // Extract email data
    const fromHeader = headers.find((h: any) => h.name.toLowerCase() === 'from');
    const toHeader = headers.find((h: any) => h.name.toLowerCase() === 'to');
    const ccHeader = headers.find((h: any) => h.name.toLowerCase() === 'cc');
    const subjectHeader = headers.find((h: any) => h.name.toLowerCase() === 'subject');
    const dateHeader = headers.find((h: any) => h.name.toLowerCase() === 'date');
    const messageIdHeader = headers.find((h: any) => h.name.toLowerCase() === 'message-id');
    const inReplyToHeader = headers.find((h: any) => h.name.toLowerCase() === 'in-reply-to');
    const referencesHeader = headers.find((h: any) => h.name.toLowerCase() === 'references');

    const from = this.parseEmailAddress(fromHeader?.value || '');
    const to = this.parseEmailAddresses(toHeader?.value || '');
    const cc = this.parseEmailAddresses(ccHeader?.value || '');

    // Get email body
    const { text, html } = this.extractGmailBody(data.payload);
    const snippet = data.snippet || text?.substring(0, 200) || '';

    // Extract attachments
    const attachments = this.extractGmailAttachments(data.payload);

    // Check if contact exists or create new one
    const contactId = await this.findOrCreateContact(from.email, from.name);

    // Store email in database
    await sql`
      INSERT INTO emails (
        integration_id,
        contact_id,
        message_id,
        thread_id,
        in_reply_to,
        references,
        from_email,
        from_name,
        to_emails,
        cc_emails,
        subject,
        body_text,
        body_html,
        snippet,
        is_read,
        has_attachments,
        attachments,
        sent_at,
        received_at,
        labels,
        size_bytes
      ) VALUES (
        ${this.integrationId},
        ${contactId},
        ${messageIdHeader?.value || messageId},
        ${data.threadId},
        ${inReplyToHeader?.value || null},
        ${referencesHeader?.value || null},
        ${from.email},
        ${from.name},
        ${JSON.stringify(to)},
        ${cc.length > 0 ? JSON.stringify(cc) : null},
        ${subjectHeader?.value || '(No Subject)'},
        ${text},
        ${html},
        ${snippet},
        ${!data.labelIds?.includes('UNREAD')},
        ${attachments.length > 0},
        ${attachments.length > 0 ? JSON.stringify(attachments) : null},
        ${dateHeader?.value ? new Date(dateHeader.value) : new Date()},
        ${new Date()},
        ${JSON.stringify(data.labelIds || [])},
        ${data.sizeEstimate || 0}
      )
      ON CONFLICT (message_id) DO UPDATE SET
        is_read = EXCLUDED.is_read,
        labels = EXCLUDED.labels,
        updated_at = NOW()
    `;

    // Store attachments separately if any
    if (attachments.length > 0) {
      for (const attachment of attachments) {
        await sql`
          INSERT INTO email_attachments (
            email_id,
            filename,
            content_type,
            size_bytes,
            attachment_id,
            is_inline
          )
          SELECT 
            id,
            ${attachment.filename},
            ${attachment.contentType},
            ${attachment.size},
            ${attachment.attachmentId},
            ${attachment.isInline || false}
          FROM emails
          WHERE message_id = ${messageIdHeader?.value || messageId}
          ON CONFLICT DO NOTHING
        `;
      }
    }

    // Log sync activity
    await sql`
      INSERT INTO integration_logs (
        integration_id,
        event_type,
        status,
        data
      ) VALUES (
        ${this.integrationId},
        'email_synced',
        'success',
        ${JSON.stringify({ 
          messageId: messageIdHeader?.value || messageId,
          from: from.email,
          subject: subjectHeader?.value || '(No Subject)',
          timestamp: new Date().toISOString()
        })}::jsonb
      )
    `;
  }

  /**
   * Extract Gmail message body
   */
  private extractGmailBody(payload: any): { text: string | null; html: string | null } {
    let text: string | null = null;
    let html: string | null = null;

    if (payload.parts) {
      for (const part of payload.parts) {
        if (part.mimeType === 'text/plain' && part.body.data) {
          text = Buffer.from(part.body.data, 'base64').toString('utf-8');
        } else if (part.mimeType === 'text/html' && part.body.data) {
          html = Buffer.from(part.body.data, 'base64').toString('utf-8');
        } else if (part.parts) {
          const nested = this.extractGmailBody(part);
          text = text || nested.text;
          html = html || nested.html;
        }
      }
    } else if (payload.body.data) {
      const content = Buffer.from(payload.body.data, 'base64').toString('utf-8');
      if (payload.mimeType === 'text/plain') {
        text = content;
      } else if (payload.mimeType === 'text/html') {
        html = content;
      }
    }

    return { text, html };
  }

  /**
   * Extract Gmail attachments
   */
  private extractGmailAttachments(payload: any): any[] {
    const attachments: any[] = [];

    const extractFromPart = (part: any) => {
      if (part.filename && part.body.attachmentId) {
        attachments.push({
          filename: part.filename,
          contentType: part.mimeType,
          size: part.body.size,
          attachmentId: part.body.attachmentId,
          isInline: part.headers?.some((h: any) => 
            h.name.toLowerCase() === 'content-disposition' && 
            h.value.includes('inline')
          ),
        });
      }

      if (part.parts) {
        part.parts.forEach(extractFromPart);
      }
    };

    extractFromPart(payload);
    return attachments;
  }

  /**
   * Sync Outlook emails using Microsoft Graph API
   */
  private async syncOutlookEmails(): Promise<number> {
    // Get last sync state
    const syncState = await this.getSyncState();
    
    let url = 'https://graph.microsoft.com/v1.0/me/messages';
    const params = new URLSearchParams({
      $top: '100',
      $orderby: 'receivedDateTime DESC',
      $select: 'id,subject,from,toRecipients,ccRecipients,receivedDateTime,sentDateTime,bodyPreview,body,hasAttachments,isRead,internetMessageId,conversationId',
    });

    // Use delta sync if we have a sync token
    if (syncState?.sync_token) {
      url = syncState.sync_token;
    } else {
      url += '?' + params.toString();
    }

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.credentials.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Outlook API error: ${response.statusText}`);
    }

    const data = await response.json();
    let messagesSynced = 0;

    if (data.value) {
      for (const message of data.value) {
        await this.storeOutlookMessage(message);
        messagesSynced++;
      }
    }

    // Save delta link for next sync
    if (data['@odata.deltaLink']) {
      await this.updateSyncToken(data['@odata.deltaLink']);
    }

    return messagesSynced;
  }

  /**
   * Store Outlook message
   */
  private async storeOutlookMessage(message: any): Promise<void> {
    const from = message.from?.emailAddress;
    const to = message.toRecipients?.map((r: any) => ({
      email: r.emailAddress.address,
      name: r.emailAddress.name,
    })) || [];
    const cc = message.ccRecipients?.map((r: any) => ({
      email: r.emailAddress.address,
      name: r.emailAddress.name,
    })) || [];

    // Find or create contact
    const contactId = await this.findOrCreateContact(
      from?.address || '',
      from?.name || ''
    );

    // Store email
    await sql`
      INSERT INTO emails (
        integration_id,
        contact_id,
        message_id,
        thread_id,
        from_email,
        from_name,
        to_emails,
        cc_emails,
        subject,
        body_text,
        body_html,
        snippet,
        is_read,
        has_attachments,
        sent_at,
        received_at
      ) VALUES (
        ${this.integrationId},
        ${contactId},
        ${message.internetMessageId || message.id},
        ${message.conversationId},
        ${from?.address || ''},
        ${from?.name || ''},
        ${JSON.stringify(to)},
        ${cc.length > 0 ? JSON.stringify(cc) : null},
        ${message.subject || '(No Subject)'},
        ${message.body?.contentType === 'text' ? message.body.content : null},
        ${message.body?.contentType === 'html' ? message.body.content : null},
        ${message.bodyPreview || ''},
        ${message.isRead},
        ${message.hasAttachments},
        ${message.sentDateTime},
        ${message.receivedDateTime}
      )
      ON CONFLICT (message_id) DO UPDATE SET
        is_read = EXCLUDED.is_read,
        updated_at = NOW()
    `;
  }

  /**
   * Sync IMAP emails (Yahoo, custom SMTP)
   */
  private async syncImapEmails(): Promise<number> {
    return new Promise((resolve, reject) => {
      if (!this.credentials.imapHost || !this.credentials.username || !this.credentials.password) {
        reject(new Error('IMAP configuration incomplete'));
        return;
      }

      const imap = new Imap({
        user: this.credentials.username,
        password: this.credentials.password,
        host: this.credentials.imapHost,
        port: this.credentials.imapPort || 993,
        tls: this.credentials.imapSecure !== false,
        tlsOptions: { rejectUnauthorized: false },
      });

      let messagesSynced = 0;

      imap.once('ready', () => {
        imap.openBox('INBOX', false, async (err, box) => {
          if (err) {
            reject(err);
            return;
          }

          // Fetch recent messages (last 7 days)
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

          const searchCriteria = [['SINCE', sevenDaysAgo]];
          
          imap.search(searchCriteria, (err, results) => {
            if (err) {
              reject(err);
              return;
            }

            if (!results || results.length === 0) {
              imap.end();
              resolve(0);
              return;
            }

            const fetch = imap.fetch(results, { bodies: '', markSeen: false });

            fetch.on('message', (msg, seqno) => {
              msg.on('body', (stream, info) => {
                simpleParser(stream as any, async (err: any, parsed: any) => {
                  if (err) {
                    console.error('Parse error:', err);
                    return;
                  }

                  try {
                    await this.storeImapMessage(parsed);
                    messagesSynced++;
                  } catch (error) {
                    console.error('Store error:', error);
                  }
                });
              });
            });

            fetch.once('end', () => {
              imap.end();
              resolve(messagesSynced);
            });

            fetch.once('error', (err) => {
              reject(err);
            });
          });
        });
      });

      imap.once('error', (err: any) => {
        reject(err);
      });

      imap.connect();
    });
  }

  /**
   * Store IMAP message
   */
  private async storeImapMessage(parsed: any): Promise<void> {
    const from = parsed.from?.value?.[0];
    const to = parsed.to?.value || [];
    const cc = parsed.cc?.value || [];

    if (!from) return;

    const contactId = await this.findOrCreateContact(
      from.address,
      from.name || ''
    );

    await sql`
      INSERT INTO emails (
        integration_id,
        contact_id,
        message_id,
        in_reply_to,
        references,
        from_email,
        from_name,
        to_emails,
        cc_emails,
        subject,
        body_text,
        body_html,
        snippet,
        has_attachments,
        attachments,
        sent_at,
        received_at
      ) VALUES (
        ${this.integrationId},
        ${contactId},
        ${parsed.messageId},
        ${parsed.inReplyTo || null},
        ${parsed.references?.join(' ') || null},
        ${from.address},
        ${from.name || ''},
        ${JSON.stringify(to.map((t: any) => ({ email: t.address, name: t.name || '' })))},
        ${cc.length > 0 ? JSON.stringify(cc.map((c: any) => ({ email: c.address, name: c.name || '' }))) : null},
        ${parsed.subject || '(No Subject)'},
        ${parsed.text || null},
        ${parsed.html || null},
        ${(parsed.text || parsed.html || '').substring(0, 200)},
        ${parsed.attachments?.length > 0},
        ${parsed.attachments?.length > 0 ? JSON.stringify(parsed.attachments.map((a: any) => ({
          filename: a.filename,
          contentType: a.contentType,
          size: a.size,
        }))) : null},
        ${parsed.date},
        ${new Date()}
      )
      ON CONFLICT (message_id) DO NOTHING
    `;
  }

  /**
   * Find existing contact by email or create new one
   */
  private async findOrCreateContact(email: string, name: string): Promise<number | null> {
    if (!email) return null;

    // Try to find existing contact
    const existing = await sql`
      SELECT id FROM clients 
      WHERE user_id = ${this.userId} 
      AND LOWER(email) = LOWER(${email})
      LIMIT 1
    `;

    if (existing.length > 0) {
      return existing[0].id;
    }

    // Create new contact
    const [firstName, ...lastNameParts] = (name || email.split('@')[0]).split(' ');
    const lastName = lastNameParts.join(' ') || '';

    const newContact = await sql`
      INSERT INTO clients (
        user_id,
        first_name,
        last_name,
        email,
        status,
        source
      ) VALUES (
        ${this.userId},
        ${firstName},
        ${lastName},
        ${email},
        'lead',
        'email_sync'
      )
      RETURNING id
    `;

    // Log contact creation
    await sql`
      INSERT INTO integration_logs (
        integration_id,
        event_type,
        status,
        data
      ) VALUES (
        ${this.integrationId},
        'contact_created',
        'success',
        ${JSON.stringify({ 
          email,
          name,
          contactId: newContact[0].id,
          timestamp: new Date().toISOString()
        })}::jsonb
      )
    `;

    return newContact[0].id;
  }

  /**
   * Parse single email address
   */
  private parseEmailAddress(value: string): { email: string; name: string } {
    const match = value.match(/^"?([^"<]*)"?\s*<?([^>]+)>?$/);
    if (match) {
      return { name: match[1].trim(), email: match[2].trim() };
    }
    return { name: '', email: value.trim() };
  }

  /**
   * Parse multiple email addresses
   */
  private parseEmailAddresses(value: string): Array<{ email: string; name: string }> {
    if (!value) return [];
    return value.split(',').map(addr => this.parseEmailAddress(addr.trim()));
  }

  /**
   * Get sync state
   */
  private async getSyncState(): Promise<any> {
    const result = await sql`
      SELECT * FROM email_sync_state
      WHERE integration_id = ${this.integrationId}
      LIMIT 1
    `;
    return result[0] || null;
  }

  /**
   * Update sync status
   */
  private async updateSyncStatus(status: string, error?: string): Promise<void> {
    await sql`
      INSERT INTO email_sync_state (integration_id, sync_status, sync_error)
      VALUES (${this.integrationId}, ${status}, ${error || null})
      ON CONFLICT (integration_id) DO UPDATE SET
        sync_status = EXCLUDED.sync_status,
        sync_error = EXCLUDED.sync_error,
        updated_at = NOW()
    `;
  }

  /**
   * Update sync state after successful sync
   */
  private async updateSyncState(messagesSynced: number, durationMs: number): Promise<void> {
    await sql`
      INSERT INTO email_sync_state (
        integration_id,
        last_sync_at,
        sync_status,
        sync_error,
        messages_synced,
        last_sync_duration_ms
      ) VALUES (
        ${this.integrationId},
        NOW(),
        'idle',
        NULL,
        ${messagesSynced},
        ${durationMs}
      )
      ON CONFLICT (integration_id) DO UPDATE SET
        last_sync_at = NOW(),
        sync_status = 'idle',
        sync_error = NULL,
        messages_synced = email_sync_state.messages_synced + ${messagesSynced},
        last_sync_duration_ms = ${durationMs},
        updated_at = NOW()
    `;
  }

  /**
   * Update Gmail history ID
   */
  private async updateHistoryId(historyId: string): Promise<void> {
    await sql`
      UPDATE email_sync_state
      SET last_history_id = ${historyId}
      WHERE integration_id = ${this.integrationId}
    `;
  }

  /**
   * Update Outlook sync token
   */
  private async updateSyncToken(token: string): Promise<void> {
    await sql`
      UPDATE email_sync_state
      SET sync_token = ${token}
      WHERE integration_id = ${this.integrationId}
    `;
  }
}

/**
 * Sync all active email integrations
 */
export async function syncAllEmailIntegrations(): Promise<{
  total: number;
  successful: number;
  failed: number;
  totalMessages: number;
}> {
  const integrations = await sql`
    SELECT id, user_id, credentials
    FROM integrations
    WHERE type = 'email' AND status = 'active'
  `;

  let successful = 0;
  let failed = 0;
  let totalMessages = 0;

  for (const integration of integrations) {
    try {
      const syncService = new EmailSyncService(
        integration.id,
        integration.credentials,
        integration.user_id
      );
      
      const result = await syncService.syncEmails();
      
      if (result.success) {
        successful++;
        totalMessages += result.messagesSynced;
      } else {
        failed++;
      }
    } catch (error) {
      console.error(`Failed to sync integration ${integration.id}:`, error);
      failed++;
    }
  }

  return {
    total: integrations.length,
    successful,
    failed,
    totalMessages,
  };
}
