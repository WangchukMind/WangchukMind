import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { requireAuth } from '../middleware/auth.js';
export const chatRouter = Router();
// SSE streaming endpoint
chatRouter.post('/v1/chat-messages', requireAuth, async (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    const id = randomUUID();
    const name = 'New Chat';
    // Send an initial message indicating creation
    res.write(`event: message\n`);
    res.write(`data: ${JSON.stringify({ id, type: 'message_start', name })}\n\n`);
    // Demo streaming tokens
    const text = 'Hello from WangchukMind streaming response.';
    for (const chunk of text.split(' ')) {
        await new Promise((r) => setTimeout(r, 200));
        res.write(`event: message\n`);
        res.write(`data: ${JSON.stringify({ id, type: 'token', content: chunk + ' ' })}\n\n`);
    }
    res.write(`event: message\n`);
    res.write(`data: ${JSON.stringify({ id, type: 'message_end' })}\n\n`);
    res.end();
});
// Stop endpoint (no-op in stub)
chatRouter.post('/v1/chat-messages/:id/stop', requireAuth, (req, res) => {
    res.json({ ok: true, stopped: req.params.id });
});
// Suggested questions stub
chatRouter.get('/v1/messages/:id/suggested', requireAuth, (req, res) => {
    res.json({ suggestions: ['介绍一下你自己', '我可以做什么？', '演示一个示例'] });
});
// Messages list stub
chatRouter.get('/v1/messages', requireAuth, (_req, res) => {
    res.json({ items: [] });
});
