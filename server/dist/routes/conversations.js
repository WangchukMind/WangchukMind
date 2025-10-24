import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { requireAuth } from '../middleware/auth.js';
export const conversationsRouter = Router();
const conversations = new Map();
function getList(userId) {
    if (!conversations.has(userId))
        conversations.set(userId, []);
    return conversations.get(userId);
}
conversationsRouter.get('/v1/conversations', requireAuth, (req, res) => {
    const userId = req.userId;
    const items = getList(userId).sort((a, b) => b.updatedAt - a.updatedAt);
    res.json({ items });
});
conversationsRouter.delete('/v1/conversations/:id', requireAuth, (req, res) => {
    const userId = req.userId;
    const id = req.params.id;
    const list = getList(userId);
    const idx = list.findIndex((c) => c.id === id);
    if (idx >= 0)
        list.splice(idx, 1);
    res.json({ ok: true });
});
conversationsRouter.post('/v1/conversations/:id/name', requireAuth, (req, res) => {
    const userId = req.userId;
    const id = req.params.id;
    const { name } = req.body || {};
    const list = getList(userId);
    const item = list.find((c) => c.id === id);
    if (!item)
        return res.status(404).json({ error: 'not_found' });
    item.name = String(name || '').slice(0, 50) || 'Untitled';
    item.updatedAt = Date.now();
    res.json({ ok: true, item });
});
// Helper route to create a new conversation (for testing)
conversationsRouter.post('/v1/conversations', requireAuth, (req, res) => {
    const userId = req.userId;
    const name = (req.body && req.body.name) || 'New Chat';
    const item = { id: randomUUID(), name, updatedAt: Date.now(), userId };
    const list = getList(userId);
    list.push(item);
    res.json({ ok: true, item });
});
