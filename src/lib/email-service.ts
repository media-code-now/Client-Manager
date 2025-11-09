import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import { EmailCredentials, decryptEmailCredentials } from './encryption';

/**
 * Email message structure
 */
export interface EmailMessage {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

/**
 * Email connection test result
 */
export interface EmailTestResult {
  success: boolean;
  error?: string;
  details?: {
    smtpConnected?: boolean;
    imapConnected?: boolean;
    authValid?: boolean;
  };
}

/**
 * Received email structure
 */
export interface ReceivedEmail {
  id: string;
  messageId: string;
  from: string;
  to: string[];
  cc?: string[];
  subject: string;
  date: Date;
  text?: string;
  html?: string;
  read: boolean;
  attachments?: Array<{
    filename: string;
    size: number;
    contentType: string;
  }>;
}

/**
 * Reusable email service for different providers
 */
export class EmailService {
  private credentials: EmailCredentials;
  private transporter?: nodemailer.Transporter;

  constructor(encryptedCredentials: string) {
    this.credentials = decryptEmailCredentials(encryptedCredentials);
  }

  /**
   * Initialize the email service and create transporter
   */
  async initialize(): Promise<void> {
    try {
      switch (this.credentials.provider) {
        case 'gmail':
          await this.initializeGmail();
          break;
        case 'outlook':
          await this.initializeOutlook();
          break;
        case 'yahoo':
          await this.initializeYahoo();
          break;
        case 'smtp':
          await this.initializeSMTP();
          break;
        default:
          throw new Error(`Unsupported email provider: ${this.credentials.provider}`);
      }
    } catch (error) {
      console.error('Email service initialization failed:', error);
      throw error;
    }
  }

  /**
   * Initialize Gmail with OAuth2
   */
  private async initializeGmail(): Promise<void> {
    if (!this.credentials.accessToken || !this.credentials.refreshToken) {
      throw new Error('Gmail OAuth tokens are required');
    }

    const oauth2Client = new google.auth.OAuth2(
      this.credentials.clientId,
      this.credentials.clientSecret,
      'http://localhost:3000/api/integrations/email/oauth/callback'
    );

    oauth2Client.setCredentials({
      access_token: this.credentials.accessToken,
      refresh_token: this.credentials.refreshToken,
    });

    this.transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: this.credentials.email,
        clientId: this.credentials.clientId,
        clientSecret: this.credentials.clientSecret,
        refreshToken: this.credentials.refreshToken,
        accessToken: this.credentials.accessToken,
      },
    });
  }

  /**
   * Initialize Outlook with OAuth2
   */
  private async initializeOutlook(): Promise<void> {
    if (!this.credentials.accessToken || !this.credentials.refreshToken) {
      throw new Error('Outlook OAuth tokens are required');
    }

    this.transporter = nodemailer.createTransporter({
      host: 'smtp-mail.outlook.com',
      port: 587,
      secure: false,
      auth: {
        type: 'OAuth2',
        user: this.credentials.email,
        clientId: this.credentials.clientId,
        clientSecret: this.credentials.clientSecret,
        refreshToken: this.credentials.refreshToken,
        accessToken: this.credentials.accessToken,
      },
    });
  }

  /**
   * Initialize Yahoo with app password
   */
  private async initializeYahoo(): Promise<void> {
    if (!this.credentials.password) {
      throw new Error('Yahoo app password is required');
    }

    this.transporter = nodemailer.createTransporter({
      service: 'yahoo',
      auth: {
        user: this.credentials.email,
        pass: this.credentials.password,
      },
    });
  }

  /**
   * Initialize custom SMTP
   */
  private async initializeSMTP(): Promise<void> {
    if (!this.credentials.smtpHost || !this.credentials.username || !this.credentials.password) {
      throw new Error('SMTP configuration is incomplete');
    }

    this.transporter = nodemailer.createTransporter({
      host: this.credentials.smtpHost,
      port: this.credentials.smtpPort || 587,
      secure: this.credentials.smtpSecure || false,
      auth: {
        user: this.credentials.username,
        pass: this.credentials.password,
      },
    });
  }

  /**
   * Test email connection
   */
  async testConnection(): Promise<EmailTestResult> {
    try {
      if (!this.transporter) {
        await this.initialize();
      }

      if (!this.transporter) {
        return {
          success: false,
          error: 'Failed to initialize email transporter',
        };
      }

      // Test SMTP connection
      const verified = await this.transporter.verify();
      
      return {
        success: verified,
        details: {
          smtpConnected: verified,
          authValid: verified,
        },
      };
    } catch (error) {
      console.error('Email connection test failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        details: {
          smtpConnected: false,
          authValid: false,
        },
      };
    }
  }

  /**
   * Send an email
   */
  async sendEmail(message: EmailMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      if (!this.transporter) {
        await this.initialize();
      }

      if (!this.transporter) {
        throw new Error('Email transporter not initialized');
      }

      const mailOptions = {
        from: `${this.credentials.displayName || this.credentials.email} <${this.credentials.email}>`,
        to: Array.isArray(message.to) ? message.to.join(', ') : message.to,
        cc: message.cc ? (Array.isArray(message.cc) ? message.cc.join(', ') : message.cc) : undefined,
        bcc: message.bcc ? (Array.isArray(message.bcc) ? message.bcc.join(', ') : message.bcc) : undefined,
        subject: message.subject,
        text: message.text,
        html: message.html,
        attachments: message.attachments,
      };

      const result = await this.transporter.sendMail(mailOptions);

      return {
        success: true,
        messageId: result.messageId,
      };
    } catch (error) {
      console.error('Failed to send email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Fetch recent emails (implementation depends on provider)
   */
  async fetchEmails(options: {
    limit?: number;
    unreadOnly?: boolean;
    since?: Date;
  } = {}): Promise<ReceivedEmail[]> {
    // This is a placeholder - full implementation would require IMAP client
    // For MVP, we'll focus on sending emails
    console.log('Fetch emails called with options:', options);
    
    try {
      // TODO: Implement IMAP connection for fetching emails
      // Different implementation for each provider:
      // - Gmail: Use Gmail API
      // - Outlook: Use Graph API or IMAP
      // - Others: Use IMAP
      
      return [];
    } catch (error) {
      console.error('Failed to fetch emails:', error);
      return [];
    }
  }

  /**
   * Get email provider configuration
   */
  static getProviderConfig(provider: string) {
    const configs = {
      gmail: {
        name: 'Gmail',
        oauth: true,
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        scopes: ['https://www.googleapis.com/auth/gmail.send', 'https://www.googleapis.com/auth/gmail.readonly'],
        smtp: { host: 'smtp.gmail.com', port: 587, secure: false },
        imap: { host: 'imap.gmail.com', port: 993, secure: true },
      },
      outlook: {
        name: 'Microsoft Outlook',
        oauth: true,
        authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
        tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
        scopes: ['https://graph.microsoft.com/Mail.Send', 'https://graph.microsoft.com/Mail.Read'],
        smtp: { host: 'smtp-mail.outlook.com', port: 587, secure: false },
        imap: { host: 'outlook.office365.com', port: 993, secure: true },
      },
      yahoo: {
        name: 'Yahoo Mail',
        oauth: false,
        appPasswordRequired: true,
        smtp: { host: 'smtp.mail.yahoo.com', port: 587, secure: false },
        imap: { host: 'imap.mail.yahoo.com', port: 993, secure: true },
      },
      smtp: {
        name: 'Custom SMTP',
        oauth: false,
        customConfig: true,
      },
    };

    return configs[provider as keyof typeof configs];
  }

  /**
   * Generate OAuth URL for Gmail/Outlook
   */
  static generateOAuthURL(provider: 'gmail' | 'outlook', clientId: string, state: string): string {
    const config = this.getProviderConfig(provider);
    if (!config || !config.oauth) {
      throw new Error(`OAuth not supported for ${provider}`);
    }

    // Type guard to ensure we have OAuth config
    if (!('authUrl' in config) || !('scopes' in config)) {
      throw new Error(`Invalid OAuth configuration for ${provider}`);
    }

    const params = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      scope: config.scopes.join(' '),
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/email/oauth/callback`,
      state: state,
      access_type: 'offline', // For refresh tokens
      prompt: 'consent', // Force consent screen
    });

    return `${config.authUrl}?${params.toString()}`;
  }
}

/**
 * Email integration factory
 */
export class EmailIntegrationFactory {
  /**
   * Create email service instance from integration ID
   */
  static async createFromIntegration(integrationId: number): Promise<EmailService> {
    // This would fetch the integration from database
    // For now, it's a placeholder
    throw new Error('Integration lookup not implemented yet');
  }

  /**
   * Validate email credentials before storing
   */
  static validateCredentials(credentials: EmailCredentials): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!credentials.email) {
      errors.push('Email address is required');
    }

    if (!credentials.provider) {
      errors.push('Email provider is required');
    }

    // OAuth validation
    if (credentials.provider === 'gmail' || credentials.provider === 'outlook') {
      if (!credentials.clientId) {
        errors.push('Client ID is required for OAuth');
      }
      if (!credentials.clientSecret) {
        errors.push('Client Secret is required for OAuth');
      }
    }

    // SMTP validation
    if (credentials.provider === 'smtp') {
      if (!credentials.smtpHost) {
        errors.push('SMTP host is required');
      }
      if (!credentials.username) {
        errors.push('Username is required for SMTP');
      }
      if (!credentials.password) {
        errors.push('Password is required for SMTP');
      }
    }

    // Yahoo validation
    if (credentials.provider === 'yahoo') {
      if (!credentials.password) {
        errors.push('App password is required for Yahoo');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}