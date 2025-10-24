export function requireAuth(req, res, next) {
    const auth = req.header('authorization') || req.header('Authorization');
    if (!auth)
        return res.status(401).json({ error: 'Unauthorized' });
    const token = auth.replace(/^Bearer\s+/i, '').trim();
    if (!token)
        return res.status(401).json({ error: 'Unauthorized' });
    // For MVP stub, accept any non-empty token; attach user id as token
    req.userId = token;
    next();
}
