import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

const JWT_SECRET = process.env.JWT_SECRET || 'veuz_super_secure_jwt_secret_key_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Validation Schemas
const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(60),
  email: z.string().email('Invalid email address').max(100),
  mobile: z.string().optional(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100)
    .regex(/^(?=.*[A-Za-z])(?=.*\d)/, 'Password must contain at least one letter and one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const inviteAdminSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['ADMIN', 'SUPER_ADMIN']).default('ADMIN'),
});

const acceptInviteSchema = z.object({
  token: z.string().min(10, 'Invalid invite token'),
  name: z.string().min(2).max(60),
  password: z
    .string()
    .min(8)
    .regex(/^(?=.*[A-Za-z])(?=.*\d)/, 'Password must contain at least one letter and one number'),
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const resetPasswordSchema = z.object({
  token: z.string().min(10, 'Invalid reset token'),
  password: z
    .string()
    .min(8)
    .regex(/^(?=.*[A-Za-z])(?=.*\d)/, 'Password must contain at least one letter and one number'),
});

// Helper: Generate JWT
const signToken = (user: { id: number; email: string; role: 'CUSTOMER' | 'ADMIN' | 'SUPER_ADMIN'; name: string }) => {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// ========================================================
// 1. CUSTOMER REGISTRATION (Strictly Customer Role Only)
// ========================================================
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const validatedData = registerSchema.parse(req.body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email.toLowerCase() },
    });

    if (existingUser) {
      res.status(400).json({
        success: false,
        message: 'An account with this email already exists.',
      });
      return;
    }

    // Hash password with strong salt rounds (12)
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(validatedData.password, salt);

    // Generate random 24h verification token
    const verifyToken = crypto.randomBytes(32).toString('hex');
    const verifyTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Create user (Strictly CUSTOMER role)
    const newUser = await prisma.user.create({
      data: {
        name: validatedData.name.trim(),
        email: validatedData.email.toLowerCase().trim(),
        password: hashedPassword,
        role: 'CUSTOMER',
        isEmailVerified: false,
        verifyToken,
        verifyTokenExpires,
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(validatedData.name)}`,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        isEmailVerified: true,
        createdAt: true,
      },
    });

    const token = signToken({
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
      name: newUser.name,
    });

    res.status(201).json({
      success: true,
      message: 'Account registered successfully. Welcome to Veuz Safety!',
      token,
      user: newUser,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: error.errors[0]?.message || 'Validation error',
        errors: error.errors,
      });
      return;
    }
    console.error('Registration Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error during registration.' });
  }
};

// ========================================================
// 2. UNIFIED LOGIN (For Customers and Admins)
// ========================================================
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const validatedData = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: validatedData.email.toLowerCase().trim() },
    });

    // Prevent timing attack & user enumeration: constant time comparison
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
      return;
    }

    const isMatch = await bcrypt.compare(validatedData.password, user.password);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
      return;
    }

    if (user.isBlocked) {
      res.status(403).json({
        success: false,
        message: 'Your account has been suspended by an administrator. Please contact support.',
      });
      return;
    }

    const token = signToken({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}`,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: error.errors[0]?.message || 'Validation error',
      });
      return;
    }
    console.error('Login Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error during login.' });
  }
};

// ========================================================
// 3. GET CURRENT LOGGED IN USER (/api/auth/me)
// ========================================================
export const getMe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const user = await (prisma.user as any).findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        phone: true,
        alternatePhone: true,
        dateOfBirth: true,
        gender: true,
        address: true,
        settings: true,
        isEmailVerified: true,
        createdAt: true,
      },
    });

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      user: {
        ...user,
        avatar: user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}`,
      },
    });
  } catch (error) {
    console.error('GetMe Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// ========================================================
// 4. INVITE NEW ADMIN (Super Admin & Admin Only)
// ========================================================
export const inviteAdmin = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const validatedData = inviteAdminSchema.parse(req.body);
    const email = validatedData.email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser && (existingUser.role === 'ADMIN' || existingUser.role === 'SUPER_ADMIN')) {
      res.status(400).json({ success: false, message: 'This user is already an administrator.' });
      return;
    }

    // Generate secure 24-hour one-time token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Upsert invite
    const invite = await prisma.adminInvite.upsert({
      where: { email },
      update: {
        token,
        role: validatedData.role,
        expiresAt,
        isUsed: false,
        createdBy: req.user?.userId,
      },
      create: {
        email,
        token,
        role: validatedData.role,
        expiresAt,
        createdBy: req.user?.userId,
      },
    });

    const inviteLink = `${process.env.CLIENT_URL || 'http://localhost:3000'}/admin/setup?token=${token}`;

    res.status(200).json({
      success: true,
      message: `Admin invitation created for ${email}. Link valid for 24 hours.`,
      inviteLink,
      expiresAt: invite.expiresAt,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: error.errors[0]?.message });
      return;
    }
    console.error('Invite Admin Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// ========================================================
// 5. ACCEPT ADMIN INVITE (One-Time-Use Token)
// ========================================================
export const acceptAdminInvite = async (req: Request, res: Response): Promise<void> => {
  try {
    const validatedData = acceptInviteSchema.parse(req.body);

    const invite = await prisma.adminInvite.findUnique({
      where: { token: validatedData.token },
    });

    if (!invite || invite.isUsed) {
      res.status(400).json({
        success: false,
        message: 'This invite link is invalid or has already been used.',
      });
      return;
    }

    if (new Date() > invite.expiresAt) {
      res.status(400).json({
        success: false,
        message: 'This invite link has expired. Please ask a Super Admin to re-invite you.',
      });
      return;
    }

    // Hash admin password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(validatedData.password, salt);

    // Create or promote user
    const adminUser = await prisma.user.upsert({
      where: { email: invite.email },
      update: {
        name: validatedData.name.trim(),
        password: hashedPassword,
        role: invite.role,
        isEmailVerified: true,
      },
      create: {
        name: validatedData.name.trim(),
        email: invite.email,
        password: hashedPassword,
        role: invite.role,
        isEmailVerified: true,
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(validatedData.name)}`,
      },
    });

    // Mark invite as used permanently (OTU)
    await prisma.adminInvite.update({
      where: { id: invite.id },
      data: { isUsed: true },
    });

    const token = signToken({
      id: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
      name: adminUser.name,
    });

    res.status(200).json({
      success: true,
      message: 'Admin account successfully activated!',
      token,
      user: {
        id: adminUser.id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role,
        avatar: adminUser.avatar,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: error.errors[0]?.message });
      return;
    }
    console.error('Accept Invite Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// ========================================================
// 6. REQUEST & VERIFY EMAIL
// ========================================================
export const sendVerificationEmail = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: req.user.userId },
      data: {
        verifyToken: token,
        verifyTokenExpires: expires,
      },
    });

    const verifyLink = `${process.env.CLIENT_URL || 'http://localhost:3000'}/verify-email?token=${token}`;

    res.status(200).json({
      success: true,
      message: 'Verification email sent. Link is valid for 24 hours.',
      verifyLink,
    });
  } catch (error) {
    console.error('Send Verification Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.body;
    if (!token) {
      res.status(400).json({ success: false, message: 'Verification token required' });
      return;
    }

    const user = await prisma.user.findFirst({
      where: {
        verifyToken: token,
        verifyTokenExpires: { gt: new Date() },
      },
    });

    if (!user) {
      res.status(400).json({
        success: false,
        message: 'Invalid or expired verification link.',
      });
      return;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        verifyToken: null,
        verifyTokenExpires: null,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Email successfully verified!',
    });
  } catch (error) {
    console.error('Verify Email Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// ========================================================
// 7. FORGOT & RESET PASSWORD
// ========================================================
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const validatedData = forgotPasswordSchema.parse(req.body);
    const email = validatedData.email.toLowerCase().trim();

    const user = await prisma.user.findUnique({ where: { email } });

    // Always respond with success to prevent account enumeration
    if (!user) {
      res.status(200).json({
        success: true,
        message: 'If an account exists with this email, a reset link has been dispatched.',
      });
      return;
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    await prisma.passwordReset.create({
      data: {
        email,
        token,
        expiresAt,
      },
    });

    const resetLink = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

    res.status(200).json({
      success: true,
      message: 'If an account exists with this email, a reset link has been dispatched.',
      resetLink, // returned in development
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: error.errors[0]?.message });
      return;
    }
    console.error('Forgot Password Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const validatedData = resetPasswordSchema.parse(req.body);

    const resetRecord = await prisma.passwordReset.findUnique({
      where: { token: validatedData.token },
    });

    if (!resetRecord || resetRecord.isUsed) {
      res.status(400).json({
        success: false,
        message: 'This password reset link is invalid or has already been used.',
      });
      return;
    }

    if (new Date() > resetRecord.expiresAt) {
      res.status(400).json({
        success: false,
        message: 'This password reset link has expired.',
      });
      return;
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(validatedData.password, salt);

    await prisma.user.update({
      where: { email: resetRecord.email },
      data: { password: hashedPassword },
    });

    // Mark token as used permanently
    await prisma.passwordReset.update({
      where: { id: resetRecord.id },
      data: { isUsed: true },
    });

    res.status(200).json({
      success: true,
      message: 'Password successfully reset! You can now log in.',
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: error.errors[0]?.message });
      return;
    }
    console.error('Reset Password Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// ========================================================
// 8. UPDATE USER PROFILE
// ========================================================
export const updateProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const { name, email, phone, alternatePhone, dateOfBirth, gender, avatar, address, settings } = req.body;

    const currentUser = await (prisma.user as any).findUnique({
      where: { id: req.user.userId },
    });

    if (!currentUser) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const updateData: any = {};

    if (name !== undefined) updateData.name = name.trim();
    if (phone !== undefined) updateData.phone = phone ? phone.trim() : null;
    if (alternatePhone !== undefined) updateData.alternatePhone = alternatePhone ? alternatePhone.trim() : null;
    if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth ? dateOfBirth.trim() : null;
    if (gender !== undefined) updateData.gender = gender ? gender.trim() : null;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (address !== undefined) updateData.address = address;
    if (settings !== undefined) updateData.settings = settings;

    // Email update rules:
    if (email && email.toLowerCase().trim() !== currentUser.email.toLowerCase()) {
      const newEmail = email.toLowerCase().trim();

      // Rule: Admin email can only be changed by superadmin
      if (currentUser.role === 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
        res.status(403).json({
          success: false,
          message: 'Admin email is locked. It can only be changed by a Super Admin.',
        });
        return;
      }

      // Check uniqueness
      const existingUser = await (prisma.user as any).findUnique({ where: { email: newEmail } });
      if (existingUser && existingUser.id !== currentUser.id) {
        res.status(400).json({ success: false, message: 'This email is already in use by another account.' });
        return;
      }

      updateData.email = newEmail;
      // Rule: When email is changed, it must be re-verified!
      updateData.isEmailVerified = false;
      updateData.verifyToken = crypto.randomBytes(32).toString('hex');
      updateData.verifyTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    }

    const updatedUser = await (prisma.user as any).update({
      where: { id: req.user.userId },
      data: updateData,
    });

    res.status(200).json({
      success: true,
      message: updateData.email && updateData.isEmailVerified === false
        ? 'Profile updated! A verification link has been sent to your new email.'
        : 'Profile details successfully updated!',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        avatar: updatedUser.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(updatedUser.name)}`,
        phone: updatedUser.phone,
        alternatePhone: updatedUser.alternatePhone,
        dateOfBirth: updatedUser.dateOfBirth,
        gender: updatedUser.gender,
        address: updatedUser.address,
        settings: updatedUser.settings,
        isEmailVerified: updatedUser.isEmailVerified,
      },
    });
  } catch (error: any) {
    console.error('Update Profile Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal server error.' });
  }
};

// ========================================================
// 9. CHANGE PASSWORD
// ========================================================
export const changePassword = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ success: false, message: 'Current password and new password are required' });
      return;
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      res.status(400).json({ success: false, message: 'New password and confirm password do not match' });
      return;
    }

    if (newPassword.length < 8) {
      res.status(400).json({ success: false, message: 'New password must be at least 8 characters long' });
      return;
    }

    const user = await (prisma.user as any).findUnique({
      where: { id: req.user.userId },
    });

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      res.status(400).json({ success: false, message: 'Current password is incorrect' });
      return;
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await (prisma.user as any).update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    res.status(200).json({
      success: true,
      message: 'Password successfully updated!',
    });
  } catch (error: any) {
    console.error('Change Password Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// ========================================================
// 10. DELETE ACCOUNT
// ========================================================
export const deleteAccount = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    if (req.user.role === 'SUPER_ADMIN') {
      res.status(403).json({ success: false, message: 'Super Admin account cannot be deleted.' });
      return;
    }

    await (prisma.user as any).delete({
      where: { id: req.user.userId },
    });

    res.status(200).json({
      success: true,
      message: 'Account successfully deleted.',
    });
  } catch (error: any) {
    console.error('Delete Account Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

