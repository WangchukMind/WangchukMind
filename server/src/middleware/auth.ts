import type { Request, Response, NextFunction } from 'express';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const auth = req.header('authorization') || req.header('Authorization');
  if (!auth) return res.status(401).json({ error: 'Unauthorized' });
  const token = auth.replace(/^Bearer\s+/i, '').trim();
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  // For MVP stub, accept any non-empty token; attach user id as token
  (req as any).userId = token;
  next();
}
