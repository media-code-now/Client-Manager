import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import jwt from 'jsonwebtoken';
import { EmailService } from '@/lib/email-service';
import { EmailTrackingService } from '@/lib/email-tracking-service';

const sql = neon(process.env.DATABASE_URL!);

/**
 * Verify JWT token and get user ID
 */
function verifyToken(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No valid authorization token provided');
  }

  const token = authHeader.substring(7);
  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number };
  return decoded.userId;
}

/**
 * POST /api/integrations/email/send
 * Send email using connected email integration
 * Supports multipart/form-data for file attachments
 */
export async function POST(request: NextRequest) {
  try {
    const userId = verifyToken(request);
    
    // Parse multipart form data
    const formData = await request.formData();
    
    const integrationId = formData.get('integrationId') as string;
    const to = formData.get('to') as string;
    const cc = formData.get('cc') as string | null;
    const bcc = formData.get('bcc') as string | null;
    const subject = formData.get('subject') as string;
    const text = formData.get('body') as string | null;
    const html = formData.get('html') as string | null;
    const contactId = formData.get('contactId') ? parseInt(formData.get('contactId') as string) : null;
    const inReplyTo = formData.get('inReplyTo') as string | null;
    const threadId = formData.get('threadId') as string | null;
    const enableTracking = formData.get('enableTracking') !== 'false'; // Default to true

    if (!integrationId || !to || !subject) {
      return NextResponse.json(
        { error: 'Integration ID, recipient, and subject are required' },
        { status: 400 }
      );
    }

    // Get integration credentials and user email
    const integration = await sql`
      SELECT id, name, credentials, status, config
      FROM integrations 
      WHERE id = ${integrationId} AND user_id = ${userId} AND type = 'email'
    `;

    if (integration.length === 0) {
      return NextResponse.json(
        { error: 'Email integration not found' },
        { status: 404 }
      );
    }

    if (integration[0].status !== 'active') {
      return NextResponse.json(
        { error: 'Email integration is not active' },
        { status: 400 }
      );
    }

    // Process file attachments
    const attachments: Array<{ filename: string; content: Buffer; contentType: string }> = [];
    const attachmentFiles = formData.getAll('attachments') as File[];
    
    for (const file of attachmentFiles) {
      if (file && file.size > 0) {
        const buffer = Buffer.from(await file.arrayBuffer());
        attachments.push({
          filename: file.name,
          content: buffer,
          contentType: file.type || 'application/octet-stream',
        });
      }
    }

    // Store sent email in emails table for history tracking (before sending to get email ID for tracking)
    const userEmail = integration[0].config?.email || 'unknown';
    const attachmentsJson = attachments.map(att => ({
      filename: att.filename,
      contentType: att.contentType,
      size: att.content.length,
    }));

    const sentEmail = await sql`
      INSERT INTO emails (
        integration_id,
        contact_id,
        message_id,
        thread_id,
        in_reply_to,
        from_email,
        from_name,
        to_emails,
        cc_emails,
        bcc_emails,
        subject,
        body_text,
        body_html,
        snippet,
        is_read,
        is_sent,
        has_attachments,
        attachments,
        tracking_enabled,
        sent_at,
        synced_at
      ) VALUES (
        ${integrationId},
        ${contactId},
        ${`pending-${Date.now()}`},
        ${threadId || `thread-${Date.now()}`},
        ${inReplyTo},
        ${userEmail},
        ${integration[0].name},
        ${to},
        ${cc},
        ${bcc},
        ${subject},
        ${text},
        ${html},
        ${text ? text.substring(0, 150) : (html ? html.replace(/<[^>]*>/g, '').substring(0, 150) : '')},
        true,
        true,
        ${attachments.length > 0},
        ${JSON.stringify(attachmentsJson)}::jsonb,
        ${enableTracking},
        NOW(),
        NOW()
      )
      RETURNING id
    `;

    const emailId = sentEmail[0].id;

    // Inject tracking if enabled and HTML body exists
    let finalHtml = html;
    if (enableTracking && html) {
      try {
        const trackingService = new EmailTrackingService();
        const utmParams = {
          source: 'crm',
          medium: 'email',
          campaign: contactId ? `contact-${contactId}` : 'direct',
        };
        
        finalHtml = await trackingService.injectTracking(emailId, html, utmParams);
        console.log('Email tracking injected successfully');
      } catch (trackingError) {
        console.error('Error injecting tracking:', trackingError);
        // Continue sending without tracking if tracking fails
      }
    }

    // Create email service
    const emailService = new EmailService(integration[0].credentials);

    // Prepare email options with tracked HTML
    const emailOptions: any = {
      to,
      subject,
      text: text || undefined,
      html: finalHtml || undefined,
    };

    if (cc) emailOptions.cc = cc;
    if (bcc) emailOptions.bcc = bcc;
    if (attachments.length > 0) emailOptions.attachments = attachments;
    if (inReplyTo) emailOptions.inReplyTo = inReplyTo;

    // Send email
    const result = await emailService.sendEmail(emailOptions);

    if (!result.success) {
      // Delete the email record if send failed
      await sql`DELETE FROM emails WHERE id = ${emailId}`;

      // Log failed send
      await sql`
        INSERT INTO integration_logs (
          integration_id,
          event_type,
          status,
          data
        ) VALUES (
          ${integrationId},
          'email_send_failed',
          'error',
          ${JSON.stringify({ 
            error: result.error,
            recipient: to,
            subject,
            timestamp: new Date().toISOString()
          })}::jsonb
        )
      `;

      return NextResponse.json(
        { error: 'Failed to send email', details: result.error },
        { status: 500 }
      );
    }

    // Update email record with actual message ID
    await sql`
      UPDATE emails
      SET message_id = ${result.messageId || `sent-${Date.now()}`}
      WHERE id = ${emailId}
    `;

    // Store attachment details if any
    if (attachments.length > 0) {
      for (const attachment of attachments) {
        await sql`
          INSERT INTO email_attachments (
            email_id,
            filename,
            content_type,
            size_bytes
          ) VALUES (
            ${sentEmail[0].id},
            ${attachment.filename},
            ${attachment.contentType},
            ${attachment.content.length}
          )
        `;
      }
    }

    // Log successful send
    await sql`
      INSERT INTO integration_logs (
        integration_id,
        event_type,
        status,
        data
      ) VALUES (
        ${integrationId},
        'email_sent',
        'success',
        ${JSON.stringify({ 
          messageId: result.messageId,
          recipient: to,
          subject,
          attachmentCount: attachments.length,
          timestamp: new Date().toISOString()
        })}::jsonb
      )
    `;

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      emailId: sentEmail[0].id,
      message: 'Email sent successfully',
    });
  } catch (error: any) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}