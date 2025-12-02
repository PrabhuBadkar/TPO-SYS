/**
 * Security Service
 * Security utilities for input validation, sanitization, and protection
 */

import crypto from 'crypto';

/**
 * Security Service
 */
export class SecurityService {
  /**
   * Sanitize input to prevent XSS
   */
  sanitizeInput(input: string): string {
    if (!input) return '';

    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  /**
   * Validate email format
   */
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate phone number
   */
  validatePhone(phone: string): boolean {
    const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
    return phoneRegex.test(phone);
  }

  /**
   * Validate password strength
   */
  validatePassword(password: string): { valid: boolean; message?: string } {
    if (password.length < 8) {
      return { valid: false, message: 'Password must be at least 8 characters' };
    }

    if (!/[A-Z]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one uppercase letter' };
    }

    if (!/[a-z]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one lowercase letter' };
    }

    if (!/[0-9]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one number' };
    }

    if (!/[!@#$%^&*]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one special character' };
    }

    return { valid: true };
  }

  /**
   * Hash password
   */
  hashPassword(password: string, salt?: string): { hash: string; salt: string } {
    const passwordSalt = salt || crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, passwordSalt, 10000, 64, 'sha512').toString('hex');

    return { hash, salt: passwordSalt };
  }

  /**
   * Verify password
   */
  verifyPassword(password: string, hash: string, salt: string): boolean {
    const verifyHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return hash === verifyHash;
  }

  /**
   * Generate secure token
   */
  generateToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Encrypt data
   */
  encrypt(data: string, key: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key.padEnd(32, '0').slice(0, 32)), iv);
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * Decrypt data
   */
  decrypt(encryptedData: string, key: string): string {
    const parts = encryptedData.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];

    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key.padEnd(32, '0').slice(0, 32)), iv);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Validate SQL injection
   */
  detectSQLInjection(input: string): boolean {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
      /(--|\;|\/\*|\*\/)/,
      /(\bOR\b.*=.*)/i,
      /(\bAND\b.*=.*)/i,
    ];

    return sqlPatterns.some(pattern => pattern.test(input));
  }

  /**
   * Rate limiting check
   */
  private rateLimitStore: Map<string, { count: number; resetTime: number }> = new Map();

  checkRateLimit(identifier: string, limit: number = 100, windowMs: number = 60000): boolean {
    const now = Date.now();
    const record = this.rateLimitStore.get(identifier);

    if (!record || now > record.resetTime) {
      this.rateLimitStore.set(identifier, {
        count: 1,
        resetTime: now + windowMs,
      });
      return true;
    }

    if (record.count >= limit) {
      return false;
    }

    record.count++;
    return true;
  }

  /**
   * Generate CSRF token
   */
  generateCSRFToken(): string {
    return this.generateToken(32);
  }

  /**
   * Validate CSRF token
   */
  validateCSRFToken(token: string, sessionToken: string): boolean {
    return token === sessionToken;
  }

  /**
   * Get security headers
   */
  getSecurityHeaders(): Record<string, string> {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    };
  }

  /**
   * Validate file upload
   */
  validateFileUpload(filename: string, allowedExtensions: string[], maxSize: number): { valid: boolean; message?: string } {
    const ext = filename.split('.').pop()?.toLowerCase();

    if (!ext || !allowedExtensions.includes(ext)) {
      return { valid: false, message: 'File type not allowed' };
    }

    // Additional checks would be done on actual file size
    return { valid: true };
  }

  /**
   * Sanitize filename
   */
  sanitizeFilename(filename: string): string {
    return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  }

  /**
   * Check for common vulnerabilities
   */
  securityAudit(data: Record<string, any>): { safe: boolean; issues: string[] } {
    const issues: string[] = [];

    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        // Check for SQL injection
        if (this.detectSQLInjection(value)) {
          issues.push(`Potential SQL injection in field: ${key}`);
        }

        // Check for XSS
        if (/<script|javascript:|onerror=/i.test(value)) {
          issues.push(`Potential XSS in field: ${key}`);
        }

        // Check for path traversal
        if (/\.\.\/|\.\.\\/.test(value)) {
          issues.push(`Potential path traversal in field: ${key}`);
        }
      }
    }

    return {
      safe: issues.length === 0,
      issues,
    };
  }
}

// Export singleton instance
export const securityService = new SecurityService();
