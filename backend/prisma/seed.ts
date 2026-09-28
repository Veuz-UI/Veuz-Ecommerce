import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed for main accounts...');

  const passwordHash = await bcrypt.hash('nbk@123456', 12);

  // 1. Super Admin: super@gmail.com
  const superAdmin = await prisma.user.upsert({
    where: { email: 'super@gmail.com' },
    update: {
      password: passwordHash,
      role: 'SUPER_ADMIN',
      isEmailVerified: true,
      name: 'Super Admin',
    },
    create: {
      name: 'Super Admin',
      email: 'super@gmail.com',
      password: passwordHash,
      role: 'SUPER_ADMIN',
      isEmailVerified: true,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    },
  });
  console.log(`✅ Super Admin created/updated: ${superAdmin.email} (Password: nbk@123456)`);

  // 2. Admin: admin@gmail.com
  const admin = await prisma.user.upsert({
    where: { email: 'admin@gmail.com' },
    update: {
      password: passwordHash,
      role: 'ADMIN',
      isEmailVerified: true,
      name: 'Admin User',
    },
    create: {
      name: 'Admin User',
      email: 'admin@gmail.com',
      password: passwordHash,
      role: 'ADMIN',
      isEmailVerified: true,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    },
  });
  console.log(`✅ Admin created/updated: ${admin.email} (Password: nbk@123456)`);

  // 3. User / Customer: customer@gmail.com
  const customer = await prisma.user.upsert({
    where: { email: 'customer@gmail.com' },
    update: {
      password: passwordHash,
      role: 'CUSTOMER',
      isEmailVerified: true,
      name: 'Customer User',
    },
    create: {
      name: 'Customer User',
      email: 'customer@gmail.com',
      password: passwordHash,
      role: 'CUSTOMER',
      isEmailVerified: true,
      avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Customer%20User',
    },
  });
  console.log(`✅ Customer User created/updated: ${customer.email} (Password: nbk@123456)`);

  console.log('🎉 Main user accounts created successfully in database!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
