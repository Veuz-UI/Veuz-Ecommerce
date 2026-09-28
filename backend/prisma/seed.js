"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Starting database seed...');
    // 1. Seed Super Admin
    const adminSalt = await bcryptjs_1.default.genSalt(12);
    const adminPassword = await bcryptjs_1.default.hash('Admin@123456', adminSalt);
    const superAdmin = await prisma.user.upsert({
        where: { email: 'admin@veuz.in' },
        update: {},
        create: {
            name: 'Nabeel Admin',
            email: 'admin@veuz.in',
            password: adminPassword,
            role: 'SUPER_ADMIN',
            isEmailVerified: true,
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        },
    });
    console.log(`✅ Super Admin created: ${superAdmin.email} (Password: Admin@123456)`);
    // 2. Seed Demo Customer
    const customerSalt = await bcryptjs_1.default.genSalt(12);
    const customerPassword = await bcryptjs_1.default.hash('Customer@123456', customerSalt);
    const customer = await prisma.user.upsert({
        where: { email: 'customer@veuz.in' },
        update: {},
        create: {
            name: 'John Customer',
            email: 'customer@veuz.in',
            password: customerPassword,
            role: 'CUSTOMER',
            isEmailVerified: true,
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        },
    });
    console.log(`✅ Demo Customer created: ${customer.email} (Password: Customer@123456)`);
    console.log('🎉 Seeding completed successfully!');
}
main()
    .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
