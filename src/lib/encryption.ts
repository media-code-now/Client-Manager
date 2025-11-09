import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

/**
 * Encryption utility for securing sensitive data like email credentials
 */
export class EncryptionService {
  private static getEncryptionKey(): Buffer {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
      throw new Error('ENCRYPTION_KEY environment variable is required');
    }
    
    // If key is hex encoded, decode it
    if (key.length === 64) {
      return Buffer.from(key, 'hex');
    }
    
    // Otherwise, hash the key to get consistent 32 bytes
    return crypto.createHash('sha256').update(key).digest();
  }

  /**
   * Encrypt sensitive data (like email credentials)
   */
  static encrypt(plaintext: string): string {
    try {
      const key = this.getEncryptionKey();
      const iv = crypto.randomBytes(IV_LENGTH);
      
      const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
      cipher.setAAD(Buffer.from('email-credentials'));
      
      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const tag = cipher.getAuthTag();
      
      // Combine iv + tag + encrypted data
      const combined = iv.toString('hex') + tag.toString('hex') + encrypted;
      return combined;
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt sensitive data
   */
  static decrypt(encryptedData: string): string {
    try {
      const key = this.getEncryptionKey();
      
      // Extract iv, tag, and encrypted data
      const iv = Buffer.from(encryptedData.slice(0, IV_LENGTH * 2), 'hex');
      const tag = Buffer.from(encryptedData.slice(IV_LENGTH * 2, (IV_LENGTH + TAG_LENGTH) * 2), 'hex');
      const encrypted = encryptedData.slice((IV_LENGTH + TAG_LENGTH) * 2);
      
      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
      decipher.setAAD(Buffer.from('email-credentials'));
      decipher.setAuthTag(tag);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Generate a secure encryption key (for setup)
   */
  static generateEncryptionKey(): string {
    return crypto.randomBytes(KEY_LENGTH).toString('hex');
  }

  /**
   * Validate encryption key format
   */
  static validateEncryptionKey(key: string): boolean {
    if (!key) return false;
    
    // Accept hex keys (64 chars) or any string (will be hashed)
    return key.length >= 32;
  }
}

/**
 * Email credential types
 */
export interface EmailCredentials {
  provider: 'gmail' | 'outlook' | 'yahoo' | 'smtp';
  
  // OAuth credentials (Gmail, Outlook)
  accessToken?: string;
  refreshToken?: string;
  clientId?: string;
  clientSecret?: string;
  
  // SMTP/IMAP credentials
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure?: boolean; // TLS
  imapHost?: string;
  imapPort?: number;
  imapSecure?: boolean; // TLS
  username?: string;
  password?: string;
  
  // Common settings
  email: string;
  displayName?: string;
}

/**
 * Encrypt email credentials for database storage
 */
export function encryptEmailCredentials(credentials: EmailCredentials): string {
  const jsonString = JSON.stringify(credentials);
  return EncryptionService.encrypt(jsonString);
}

/**
 * Decrypt email credentials from database
 */
export function decryptEmailCredentials(encryptedCredentials: string): EmailCredentials {
  const jsonString = EncryptionService.decrypt(encryptedCredentials);
  return JSON.parse(jsonString);
}

/**
 * Mask sensitive fields for logging
 */
export function maskEmailCredentials(credentials: EmailCredentials): Partial<EmailCredentials> {
  return {
    provider: credentials.provider,
    email: credentials.email,
    displayName: credentials.displayName,
    smtpHost: credentials.smtpHost,
    smtpPort: credentials.smtpPort,
    smtpSecure: credentials.smtpSecure,
    imapHost: credentials.imapHost,
    imapPort: credentials.imapPort,
    imapSecure: credentials.imapSecure,
    username: credentials.username ? credentials.username.replace(/(.{2}).*(@.*)/, '$1***$2') : undefined,
    // Sensitive fields omitted: accessToken, refreshToken, clientSecret, password
  };
}
