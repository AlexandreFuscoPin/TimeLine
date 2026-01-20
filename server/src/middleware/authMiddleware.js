const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    // 1. Get token from header
    const bearerHeader = req.headers['authorization'];
    if (!bearerHeader) {
        return res.status(403).json({ error: 'Access denied. No token provided.' });
    }

    const token = bearerHeader.split(' ')[1];

    if (!token) {
        return res.status(403).json({ error: 'Access denied. Malformed token.' });
    }

    // 2. Verify
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_dev_only');
        req.user = decoded; // { id, email }
        next();
    } catch (err) {
        res.status(401).json({ error: 'Invalid token.' });
    }
};

module.exports = verifyToken;
