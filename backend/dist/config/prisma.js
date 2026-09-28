import { PrismaClient } from '@prisma/client';
// Helper to construct database URL from separate DB_HOST, DB_USER, DB_PASSWORD, DB_NAME
export const resolveDatabaseUrl = () => {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('${')) {
        return process.env.DATABASE_URL;
    }
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || '3306';
    const name = process.env.DB_NAME || 'safety_db';
    const user = process.env.DB_USER || 'root';
    const password = process.env.DB_PASSWORD ?? '';
    const auth = password ? `${encodeURIComponent(user)}:${encodeURIComponent(password)}` : encodeURIComponent(user);
    const url = `mysql://${auth}@${host}:${port}/${name}`;
    // Keep process.env.DATABASE_URL in sync for any internal Prisma consumers
    process.env.DATABASE_URL = url;
    return url;
};
const dbUrl = resolveDatabaseUrl();
const globalForPrisma = global;
export const prisma = globalForPrisma.prisma ||
    new PrismaClient({
        datasources: {
            db: {
                url: dbUrl,
            },
        },
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
if (process.env.NODE_ENV !== 'production')
    globalForPrisma.prisma = prisma;
