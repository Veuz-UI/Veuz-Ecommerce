import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

// Schemas
const createUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(60),
  email: z.string().email('Invalid email address').max(100),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100)
    .regex(/^(?=.*[A-Za-z])(?=.*\d)/, 'Password must contain at least one letter and one number'),
  role: z.enum(['CUSTOMER', 'ADMIN', 'SUPER_ADMIN']).default('CUSTOMER'),
  phone: z.string().optional().nullable(),
  alternatePhone: z.string().optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
});

const resetPasswordSchema = z.object({
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100)
    .regex(/^(?=.*[A-Za-z])(?=.*\d)/, 'Password must contain at least one letter and one number'),
});

// ========================================================
// 1. GET ALL USERS (with filtering by role, status, search)
// ========================================================
export const getUsers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { role, status, search } = req.query;

    const whereClause: any = {};

    // Filter by role
    if (role && role !== 'ALL') {
      if (role === 'STAFF') {
        // Staff includes ADMIN and SUPER_ADMIN
        whereClause.role = { in: ['ADMIN', 'SUPER_ADMIN'] };
      } else {
        whereClause.role = role;
      }
    }

    // Filter by status (active or blocked)
    if (status && status !== 'ALL') {
      if (status === 'BLOCKED') {
        whereClause.isBlocked = true;
      } else if (status === 'ACTIVE') {
        whereClause.isBlocked = false;
      }
    }

    // Search query
    if (search && typeof search === 'string' && search.trim() !== '') {
      const q = search.trim();
      whereClause.OR = [
        { name: { contains: q } },
        { email: { contains: q } },
        { phone: { contains: q } },
      ];
    }

    const [users, totalCount, superAdminCount, adminCount, customerCount, blockedCount] = await Promise.all([
      (prisma.user as any).findMany({
        where: whereClause,
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
          isEmailVerified: true,
          isBlocked: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: { orders: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      (prisma.user as any).count(),
      (prisma.user as any).count({ where: { role: 'SUPER_ADMIN' } }),
      (prisma.user as any).count({ where: { role: 'ADMIN' } }),
      (prisma.user as any).count({ where: { role: 'CUSTOMER' } }),
      (prisma.user as any).count({ where: { isBlocked: true } }),
    ]);

    res.status(200).json({
      success: true,
      users,
      counts: {
        total: totalCount,
        superAdmins: superAdminCount,
        admins: adminCount,
        customers: customerCount,
        blocked: blockedCount,
        active: totalCount - blockedCount,
      },
    });
  } catch (error: any) {
    console.error('getUsers error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch users: ' + error.message });
  }
};

// ========================================================
// 2. TOGGLE OR SET BLOCK STATUS
// ========================================================
export const toggleBlockUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const caller = req.user;
    if (!caller) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const userId = parseInt(req.params.id as string, 10);
    if (isNaN(userId)) {
      res.status(400).json({ success: false, message: 'Invalid user ID' });
      return;
    }

    if (caller.userId === userId) {
      res.status(400).json({ success: false, message: 'You cannot block your own account.' });
      return;
    }

    const targetUser = await (prisma.user as any).findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    // Role safety restrictions:
    // Only a SUPER_ADMIN can block another ADMIN or SUPER_ADMIN
    if ((targetUser.role === 'ADMIN' || targetUser.role === 'SUPER_ADMIN') && caller.role !== 'SUPER_ADMIN') {
      res.status(403).json({
        success: false,
        message: 'Only Super Administrators have permission to block administrative accounts.',
      });
      return;
    }

    // Determine new blocked status
    const newStatus = typeof req.body.isBlocked === 'boolean' ? req.body.isBlocked : !targetUser.isBlocked;

    const updated = await (prisma.user as any).update({
      where: { id: userId },
      data: { isBlocked: newStatus },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isBlocked: true,
      },
    });

    res.status(200).json({
      success: true,
      message: newStatus ? `Account for ${targetUser.name} has been suspended.` : `Account for ${targetUser.name} has been activated.`,
      user: updated,
    });
  } catch (error: any) {
    console.error('toggleBlockUser error:', error);
    res.status(500).json({ success: false, message: 'Failed to update user status: ' + error.message });
  }
};

// ========================================================
// 3. RESET ADMIN OR USER PASSWORD
// ========================================================
export const resetUserPassword = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const caller = req.user;
    if (!caller) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const userId = parseInt(req.params.id as string, 10);
    if (isNaN(userId)) {
      res.status(400).json({ success: false, message: 'Invalid user ID' });
      return;
    }

    const validated = resetPasswordSchema.parse(req.body);

    const targetUser = await (prisma.user as any).findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    // If target is SUPER_ADMIN, only another SUPER_ADMIN can reset their password
    if (targetUser.role === 'SUPER_ADMIN' && caller.role !== 'SUPER_ADMIN') {
      res.status(403).json({
        success: false,
        message: 'Only Super Administrators can reset Super Administrator passwords.',
      });
      return;
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(validated.newPassword, salt);

    await (prisma.user as any).update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    res.status(200).json({
      success: true,
      message: `Password for ${targetUser.name} has been successfully reset!`,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: error.errors[0]?.message || 'Validation error' });
      return;
    }
    console.error('resetUserPassword error:', error);
    res.status(500).json({ success: false, message: 'Failed to reset password: ' + error.message });
  }
};

// ========================================================
// 4. DELETE USER / ADMIN
// ========================================================
export const deleteUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const caller = req.user;
    if (!caller) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const userId = parseInt(req.params.id as string, 10);
    if (isNaN(userId)) {
      res.status(400).json({ success: false, message: 'Invalid user ID' });
      return;
    }

    if (caller.userId === userId) {
      res.status(400).json({ success: false, message: 'You cannot delete your own account.' });
      return;
    }

    const targetUser = await (prisma.user as any).findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    // Restrict deletion of SUPER_ADMIN
    if (targetUser.role === 'SUPER_ADMIN') {
      if (caller.role !== 'SUPER_ADMIN') {
        res.status(403).json({
          success: false,
          message: 'Only Super Administrators can delete a Super Administrator account.',
        });
        return;
      }

      // Check count: cannot delete the last Super Admin
      const superAdminCount = await (prisma.user as any).count({ where: { role: 'SUPER_ADMIN' } });
      if (superAdminCount <= 1) {
        res.status(400).json({
          success: false,
          message: 'Cannot delete the only remaining Super Administrator.',
        });
        return;
      }
    }

    // If caller is ADMIN (not SUPER_ADMIN), they cannot delete other ADMINs
    if (targetUser.role === 'ADMIN' && caller.role !== 'SUPER_ADMIN') {
      res.status(403).json({
        success: false,
        message: 'Only Super Administrators can delete administrator accounts.',
      });
      return;
    }

    // Delete user
    await (prisma.user as any).delete({
      where: { id: userId },
    });

    res.status(200).json({
      success: true,
      message: `Account for ${targetUser.name} (${targetUser.email}) has been permanently deleted.`,
    });
  } catch (error: any) {
    console.error('deleteUser error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete user: ' + error.message });
  }
};

// ========================================================
// 5. CREATE USER / ADMIN (Dashboard Direct Creation)
// ========================================================
export const createUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const caller = req.user;
    if (!caller) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const validated = createUserSchema.parse(req.body);

    // Only SUPER_ADMIN can create a SUPER_ADMIN
    if (validated.role === 'SUPER_ADMIN' && caller.role !== 'SUPER_ADMIN') {
      res.status(403).json({
        success: false,
        message: 'Only Super Administrators can create other Super Administrators.',
      });
      return;
    }

    // Check duplicate email
    const existing = await (prisma.user as any).findUnique({
      where: { email: validated.email.toLowerCase().trim() },
    });

    if (existing) {
      res.status(400).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
      return;
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(validated.password, salt);

    const newUser = await (prisma.user as any).create({
      data: {
        name: validated.name.trim(),
        email: validated.email.toLowerCase().trim(),
        password: hashedPassword,
        role: validated.role,
        phone: validated.phone?.trim() || null,
        alternatePhone: validated.alternatePhone?.trim() || null,
        dateOfBirth: validated.dateOfBirth?.trim() || null,
        gender: validated.gender?.trim() || null,
        isEmailVerified: true, // Created by admin
        isBlocked: false,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        dateOfBirth: true,
        gender: true,
        isEmailVerified: true,
        isBlocked: true,
        createdAt: true,
      },
    });

    res.status(201).json({
      success: true,
      message: `${validated.role === 'CUSTOMER' ? 'Customer' : 'Administrator'} account successfully created!`,
      user: newUser,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: error.errors[0]?.message || 'Validation error' });
      return;
    }
    console.error('createUser error:', error);
    res.status(500).json({ success: false, message: 'Failed to create user: ' + error.message });
  }
};
