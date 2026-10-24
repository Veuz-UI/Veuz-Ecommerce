import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import nodemailer, { Transporter } from 'nodemailer';
import {
  getWelcomeEmailHtml,
  getVerificationEmailHtml,
  getResetPasswordEmailHtml,
  getPasswordResetSuccessEmailHtml,
  getAdminInviteEmailHtml,
} from './emailTemplates.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface SendMailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

class MailService {
  private transporter: Transporter | null = null;
  private isConfigured: boolean = false;

  constructor() {
    this.initTransporter();
  }

  private getLogoAttachment(): Array<{ filename: string; path: string; cid: string }> {
    const candidatePaths = [
      path.resolve(process.cwd(), '../public/assets/imgs/theme/logo.jpg'),
      path.resolve(process.cwd(), 'public/assets/imgs/theme/logo.jpg'),
      path.resolve(__dirname, '../../../public/assets/imgs/theme/logo.jpg'),
    ];

    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        return [
          {
            filename: 'logo.jpg',
            path: p,
            cid: 'veuz-logo',
          },
        ];
      }
    }
    return [];
  }

  private getEmailIconAttachment(iconName: string, cid: string): Array<{ filename: string; path: string; cid: string }> {
    const candidatePaths = [
      path.resolve(process.cwd(), `../public/assets/imgs/email/${iconName}`),
      path.resolve(process.cwd(), `public/assets/imgs/email/${iconName}`),
      path.resolve(__dirname, `../../../public/assets/imgs/email/${iconName}`),
      path.resolve(__dirname, `../../public/assets/imgs/email/${iconName}`),
    ];

    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        return [
          {
            filename: iconName,
            path: p,
            cid,
          },
        ];
      }
    }
    return [];
  }

  private initTransporter(): void {
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = parseInt(process.env.SMTP_PORT || '465', 10);
    const secure = process.env.SMTP_SECURE !== 'false' && port === 465;

    if (user && pass && pass.trim() !== '' && !pass.includes('your-16-char')) {
      try {
        this.transporter = nodemailer.createTransport({
          host,
          port,
          secure, // true for 465, false for 587
          auth: {
            user,
            pass: pass.replace(/\s+/g, ''), // Strip spaces in 16-char Gmail app password
          },
          tls: {
            rejectUnauthorized: process.env.NODE_ENV === 'production',
          },
        });
        this.isConfigured = true;
        console.log(`📧 [MailService] SMTP initialized successfully with ${user} via ${host}:${port}`);
      } catch (err: any) {
        console.error('❌ [MailService] Error initializing Nodemailer transport:', err.message);
        this.isConfigured = false;
      }
    } else {
      console.warn('⚠️ [MailService] SMTP credentials not fully configured in environment. Emails will be logged to console in dev mode.');
      this.isConfigured = false;
    }
  }

  private getFromAddress(): string {
    const fromName = process.env.SMTP_FROM_NAME || 'Veuz Safety E-Commerce';
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'no-reply@veuz-safety.com';
    return `"${fromName}" <${fromEmail}>`;
  }

  private getClientUrl(): string {
    return (process.env.CLIENT_URL || 'http://localhost:3000').replace(/\/$/, '');
  }

  /**
   * Generic sender with graceful fallback
   */
  public async sendMail(options: {
    to: string;
    subject: string;
    html: string;
    text?: string;
    attachments?: Array<{ filename: string; path: string; cid: string }>;
  }): Promise<SendMailResult> {
    // Re-verify configuration if transporter is missing but env vars exist
    if (!this.transporter && process.env.SMTP_USER && process.env.SMTP_PASS) {
      this.initTransporter();
    }

    if (!this.isConfigured || !this.transporter) {
      console.log(`\n======================================================`);
      console.log(`📨 [SIMULATED EMAIL DISPATCH - NO SMTP CREDENTIALS]`);
      console.log(`To: ${options.to}`);
      console.log(`Subject: ${options.subject}`);
      console.log(`======================================================\n`);
      return { success: true, messageId: 'simulated-local-dispatch' };
    }

    try {
      const defaultAttachments = this.getLogoAttachment();
      const extraAttachments = options.attachments || [];
      const attachments = [...defaultAttachments, ...extraAttachments];

      const info = await this.transporter.sendMail({
        from: this.getFromAddress(),
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        attachments: attachments.length > 0 ? attachments : undefined,
      });

      console.log(`✅ [MailService] Email delivered to ${options.to} (Message ID: ${info.messageId})`);
      return { success: true, messageId: info.messageId };
    } catch (error: any) {
      console.error(`❌ [MailService] Failed to deliver email to ${options.to}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * 1. Send Welcome Email (Post-Registration)
   */
  public async sendWelcomeEmail(email: string, name: string): Promise<SendMailResult> {
    const clientUrl = this.getClientUrl();
    const html = getWelcomeEmailHtml(name, clientUrl);
    const attachments = this.getEmailIconAttachment('check.png', 'email-icon-check');

    return this.sendMail({
      to: email,
      subject: 'Account Created Successfully - Welcome to Veuz Safety! 🛡️',
      html,
      text: `Hello ${name},\n\nWelcome to Veuz Safety! Your account has been created successfully.\n\nPlease verify your email address in your profile:\n${clientUrl}/profile#basic-info\n\nVeuz Safety Team`,
      attachments,
    });
  }

  /**
   * 2. Send Email Verification Link & 6-Digit Code
   */
  public async sendVerificationEmail(email: string, name: string, token: string, code?: string): Promise<SendMailResult> {
    const clientUrl = this.getClientUrl();
    const verificationLink = `${clientUrl}/api/auth/verify-email?token=${token}`;
    const displayCode = code || token;
    const html = getVerificationEmailHtml(name, verificationLink, clientUrl, displayCode);
    const attachments = this.getEmailIconAttachment('envelope.png', 'email-icon-envelope');

    return this.sendMail({
      to: email,
      subject: `Your Verification Code: ${displayCode} - Veuz Safety`,
      html,
      text: `Hello ${name},\n\nYour 6-digit confirmation code is: ${displayCode}\n\nEnter this code on your profile, or verify directly by clicking this link:\n${verificationLink}\n\nThis verification link is valid for 24 hours.\n\nVeuz Safety Team`,
      attachments,
    });
  }

  /**
   * 3. Send Password Reset Link with 6-Digit OTP
   */
  public async sendPasswordResetEmail(email: string, name: string, token: string, otp?: string): Promise<SendMailResult> {
    const clientUrl = this.getClientUrl();
    const displayOtp = otp || token;
    const resetLink = `${clientUrl}/reset-password?email=${encodeURIComponent(email)}&otp=${displayOtp}`;
    const html = getResetPasswordEmailHtml(name, resetLink, clientUrl, displayOtp);
    const attachments = this.getEmailIconAttachment('lock.png', 'email-icon-lock');

    return this.sendMail({
      to: email,
      subject: `Your Password Reset OTP: ${displayOtp} - Veuz Safety`,
      html,
      text: `Dear ${name || 'Customer'},\n\nYour 6-digit password reset OTP is: ${displayOtp}\n\nConfirm this OTP on the reset password screen, or use this direct link:\n${resetLink}\n\nThis OTP is valid for 15 minutes.\n\nYours sincerely,\nVeuz Safety Team`,
      attachments,
    });
  }

  /**
   * 4. Send Password Reset Success Confirmation
   */
  public async sendPasswordResetSuccessEmail(email: string, name: string): Promise<SendMailResult> {
    const clientUrl = this.getClientUrl();
    const html = getPasswordResetSuccessEmailHtml(name, clientUrl);
    const attachments = this.getEmailIconAttachment('check.png', 'email-icon-check');

    return this.sendMail({
      to: email,
      subject: 'Your Password Was Changed Successfully - Veuz Safety ✅',
      html,
      text: `Hello ${name}, your Veuz account password was changed successfully. Log in at ${clientUrl}/login`,
      attachments,
    });
  }

  /**
   * 5. Send Admin / Team Invitation
   */
  public async sendAdminInviteEmail(email: string, role: string, token: string): Promise<SendMailResult> {
    const clientUrl = this.getClientUrl();
    const inviteLink = `${clientUrl}/admin/setup?token=${token}`;
    const html = getAdminInviteEmailHtml(email, role, inviteLink, clientUrl);
    const attachments = this.getEmailIconAttachment('team.png', 'email-icon-team');

    return this.sendMail({
      to: email,
      subject: `You've been invited to join the Veuz Safety Team as ${role} 📋`,
      html,
      text: `Hello, you have been invited to join the Veuz Safety administration team as ${role}. Accept invitation: ${inviteLink}`,
      attachments,
    });
  }
}

export const mailService = new MailService();
export default mailService;
