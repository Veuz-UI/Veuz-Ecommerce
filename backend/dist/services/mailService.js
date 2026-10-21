import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import { getWelcomeEmailHtml, getVerificationEmailHtml, getResetPasswordEmailHtml, getPasswordResetSuccessEmailHtml, getAdminInviteEmailHtml, } from './emailTemplates.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
class MailService {
    transporter = null;
    isConfigured = false;
    constructor() {
        this.initTransporter();
    }
    getLogoAttachment() {
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
    initTransporter() {
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
            }
            catch (err) {
                console.error('❌ [MailService] Error initializing Nodemailer transport:', err.message);
                this.isConfigured = false;
            }
        }
        else {
            console.warn('⚠️ [MailService] SMTP credentials not fully configured in environment. Emails will be logged to console in dev mode.');
            this.isConfigured = false;
        }
    }
    getFromAddress() {
        const fromName = process.env.SMTP_FROM_NAME || 'Veuz Safety E-Commerce';
        const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'no-reply@veuz-safety.com';
        return `"${fromName}" <${fromEmail}>`;
    }
    getClientUrl() {
        return (process.env.CLIENT_URL || 'http://localhost:3000').replace(/\/$/, '');
    }
    /**
     * Generic sender with graceful fallback
     */
    async sendMail(options) {
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
            const attachments = this.getLogoAttachment();
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
        }
        catch (error) {
            console.error(`❌ [MailService] Failed to deliver email to ${options.to}:`, error.message);
            return { success: false, error: error.message };
        }
    }
    /**
     * 1. Send Welcome Email (Post-Registration)
     */
    async sendWelcomeEmail(email, name) {
        const clientUrl = this.getClientUrl();
        const html = getWelcomeEmailHtml(name, clientUrl);
        return this.sendMail({
            to: email,
            subject: 'Account Created Successfully - Welcome to Veuz Safety! 🛡️',
            html,
            text: `Hello ${name},\n\nWelcome to Veuz Safety! Your account has been created successfully.\n\nPlease verify your email address in your profile:\n${clientUrl}/profile#basic-info\n\nVeuz Safety Team`,
        });
    }
    /**
     * 2. Send Email Verification Link & 6-Digit Code
     */
    async sendVerificationEmail(email, name, token, code) {
        const clientUrl = this.getClientUrl();
        const verificationLink = `${clientUrl}/api/auth/verify-email?token=${token}`;
        const displayCode = code || token;
        const html = getVerificationEmailHtml(name, verificationLink, clientUrl, displayCode);
        return this.sendMail({
            to: email,
            subject: `Your Verification Code: ${displayCode} - Veuz Safety`,
            html,
            text: `Hello ${name},\n\nYour 6-digit confirmation code is: ${displayCode}\n\nEnter this code on your profile, or verify directly by clicking this link:\n${verificationLink}\n\nThis verification link is valid for 24 hours.\n\nVeuz Safety Team`,
        });
    }
    /**
     * 3. Send Password Reset Link
     */
    async sendPasswordResetEmail(email, name, token) {
        const clientUrl = this.getClientUrl();
        const resetLink = `${clientUrl}/reset-password?token=${token}`;
        const html = getResetPasswordEmailHtml(name, resetLink, clientUrl);
        return this.sendMail({
            to: email,
            subject: 'Reset your password - Veuz',
            html,
            text: `Dear ${name || 'Customer'},\n\nAs per your request, a password reset was initiated for your account at veuz-safety.com.\n\nTo change your account password, please click on the button in the email or visit the link.\n\nPlease note that the link is only available for 24 hours.\n\nYours sincerely,\nVeuz Team`,
        });
    }
    /**
     * 4. Send Password Reset Success Confirmation
     */
    async sendPasswordResetSuccessEmail(email, name) {
        const clientUrl = this.getClientUrl();
        const html = getPasswordResetSuccessEmailHtml(name, clientUrl);
        return this.sendMail({
            to: email,
            subject: 'Your Password Was Changed Successfully - Veuz Safety ✅',
            html,
            text: `Hello ${name}, your Veuz account password was changed successfully. Log in at ${clientUrl}/login`,
        });
    }
    /**
     * 5. Send Admin / Team Invitation
     */
    async sendAdminInviteEmail(email, role, token) {
        const clientUrl = this.getClientUrl();
        const inviteLink = `${clientUrl}/admin/setup?token=${token}`;
        const html = getAdminInviteEmailHtml(email, role, inviteLink, clientUrl);
        return this.sendMail({
            to: email,
            subject: `You've been invited to join the Veuz Safety Team as ${role} 📋`,
            html,
            text: `Hello, you have been invited to join the Veuz Safety administration team as ${role}. Accept invitation: ${inviteLink}`,
        });
    }
}
export const mailService = new MailService();
export default mailService;
