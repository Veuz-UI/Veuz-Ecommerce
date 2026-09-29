import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import adminUserRoutes from './routes/adminUserRoutes.js';
import { apiRateLimiter } from './middleware/rateLimiter.js';
import { prisma } from './config/prisma.js';

// Load environment variables (.env.production if NODE_ENV=production, otherwise .env)
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
dotenv.config({ path: envFile });

const app = express();
const PORT = process.env.PORT || 5000;
const IS_PROD = process.env.NODE_ENV === 'production';

// ========================================================
// 1. REVERSE PROXY & TRUST SETTINGS (For Nginx/Cloudflare/AWS)
// ========================================================
if (process.env.TRUST_PROXY || IS_PROD) {
  // Trust first proxy hop (Cloudflare, Nginx, ALB) for accurate IP rate limiting
  app.set('trust proxy', 1);
}

// Disable Express fingerprinting
app.disable('x-powered-by');

// ========================================================
// 2. HTTP SECURITY HEADERS (Helmet Enterprise Protection)
// ========================================================
app.use(
  helmet({
    contentSecurityPolicy: IS_PROD ? undefined : false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    hsts: IS_PROD
      ? {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: true,
        }
      : false,
    frameguard: { action: 'deny' }, // Anti-clickjacking
    noSniff: true, // Anti-MIME sniffing
    xssFilter: true, // XSS filter
  })
);

// ========================================================
// 3. CORS WHITELIST (Dynamic from Environment)
// ========================================================
const parseAllowedOrigins = (): string[] => {
  const envOrigins = process.env.ALLOWED_ORIGINS || process.env.CLIENT_URL || 'http://localhost:3000';
  return envOrigins
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean);
};

const allowedOrigins = parseAllowedOrigins();

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) !== -1 || !IS_PROD) {
        callback(null, true);
      } else {
        callback(new Error(`CORS Error: Origin '${origin}' is not authorized.`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Set-Cookie'],
    maxAge: 86400, // 24 hours preflight cache
  })
);

// ========================================================
// 4. REQUEST PARSING & PAYLOAD LIMITS (Anti-DoS)
// ========================================================
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// ========================================================
// 5. GLOBAL RATE LIMITING
// ========================================================
app.use('/api/', apiRateLimiter);

// ========================================================
// 6. HEALTH & DATABASE CONNECTIVITY MONITORING
// ========================================================
app.get('/api/health', async (req: Request, res: Response) => {
  const startTime = Date.now();
  let dbStatus = 'disconnected';
  let dbLatencyMs: number | null = null;

  try {
    // Ping MySQL database (safety_db)
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
    dbLatencyMs = Date.now() - startTime;
  } catch (err: any) {
    dbStatus = `error: ${err.message || 'Unable to connect to database'}`;
  }

  const isHealthy = dbStatus === 'connected';

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: {
      name: 'safety_db',
      status: dbStatus,
      latencyMs: dbLatencyMs,
    },
  });
});

// ========================================================
// 7. API ROUTES
// ========================================================
app.use('/api/auth', authRoutes);
app.use('/api/admin/users', adminUserRoutes);

// ========================================================
// 8. 404 NOT FOUND HANDLER
// ========================================================
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `API Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ========================================================
// 9. PRODUCTION ERROR HANDLER (Zero Stack Leakage)
// ========================================================
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const statusCode = err.status || err.statusCode || 500;
  console.error(`[ERROR] [${new Date().toISOString()}] ${req.method} ${req.url}:`, err.message);

  res.status(statusCode).json({
    success: false,
    message: IS_PROD && statusCode === 500 ? 'Internal server error occurred.' : err.message || 'An error occurred.',
    ...(IS_PROD ? {} : { stack: err.stack }),
  });
});

// ========================================================
// 10. SERVER STARTUP & GRACEFUL SHUTDOWN
// ========================================================
const server = app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 Veuz Backend Server active in [${process.env.NODE_ENV || 'development'}] mode`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`🗄️  Database Target: safety_db (MySQL)`);
  console.log(`🛡️  Security: Helmet, Dynamic CORS, Rate Limiting, Trust-Proxy`);
  console.log(`====================================================`);
});

// Graceful Shutdown
const gracefulShutdown = async (signal: string) => {
  console.log(`\n⚠️  Received ${signal}. Starting graceful shutdown...`);
  
  server.close(async () => {
    console.log('🛑 Closed remaining active HTTP connections.');
    try {
      await prisma.$disconnect();
      console.log('🔌 Disconnected from MySQL database safely.');
      process.exit(0);
    } catch (e) {
      console.error('Error during database disconnect:', e);
      process.exit(1);
    }
  });

  // Force shutdown after 10 seconds if hanging
  setTimeout(() => {
    console.error('⏰ Forcing shutdown after timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason: any) => {
  console.error('💥 Unhandled Rejection at Promise:', reason);
});

process.on('uncaughtException', (error: Error) => {
  console.error('💥 Uncaught Exception thrown:', error);
  process.exit(1);
});

export default app;
