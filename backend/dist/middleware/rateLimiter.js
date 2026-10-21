import rateLimit from 'express-rate-limit';
const IS_PROD = process.env.NODE_ENV === 'production';
// Strict rate limiter for Login and Register (Max 10 in production, disabled/relaxed in development)
export const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: IS_PROD ? 10 : 10000,
    skip: () => !IS_PROD, // Do not lock out during local development / testing
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.',
    },
});
// General API rate limiter
export const apiRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: IS_PROD ? 200 : 20000,
    skip: () => !IS_PROD,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many requests. Please slow down.',
    },
});
