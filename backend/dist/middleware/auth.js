import jwt from 'jsonwebtoken';
export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ')
        ? authHeader.split(' ')[1]
        : req.cookies?.token;
    if (!token) {
        res.status(401).json({
            success: false,
            message: 'Access denied. No authentication token provided.',
        });
        return;
    }
    try {
        const secret = process.env.JWT_SECRET || 'veuz_super_secure_jwt_secret_key_2026';
        const decoded = jwt.verify(token, secret);
        req.user = decoded;
        next();
    }
    catch (error) {
        res.status(401).json({
            success: false,
            message: 'Invalid or expired token. Please log in again.',
        });
    }
};
export const requireAdmin = (req, res, next) => {
    if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
    }
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
        res.status(403).json({
            success: false,
            message: 'Access denied: Administrator privileges required.',
        });
        return;
    }
    next();
};
export const requireSuperAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'SUPER_ADMIN') {
        res.status(403).json({
            success: false,
            message: 'Access denied: Super Administrator privileges required.',
        });
        return;
    }
    next();
};
