import { Router } from 'express';
import { z } from 'zod';
export const authRouter = Router();
const smsSendSchema = z.object({ phoneNumber: z.string().min(6) });
authRouter.post('/sms/send', (req, res) => {
    const parsed = smsSendSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: 'invalid_phone' });
    // Stub: pretend code sent
    res.json({ ok: true, sent: true });
});
const smsLoginSchema = z.object({ phoneNumber: z.string().min(6), code: z.string().min(4) });
authRouter.post('/sms/login', (req, res) => {
    const parsed = smsLoginSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: 'invalid_params' });
    // Stub: accept any code, issue token = phoneNumber
    const { phoneNumber } = parsed.data;
    const token = phoneNumber;
    const userInfo = { phoneNumber, nickname: `User-${phoneNumber.slice(-4)}` };
    res.json({ token, userInfo });
});
// WeChat stubs
authRouter.get('/wechat/url', (_req, res) => {
    res.json({ url: 'https://example.com/wechat/oauth?state=demo' });
});
authRouter.post('/wechat/callback', (req, res) => {
    // Stub: exchange code for token
    const token = 'wechat-user-token';
    const userInfo = { nickname: 'WeChatUser', headimgurl: '' };
    res.json({ token, userInfo });
});
authRouter.get('/wechat/validate', (_req, res) => {
    res.json({ valid: true });
});
authRouter.get('/wechat/userinfo', (_req, res) => {
    res.json({ nickname: 'WeChatUser', headimgurl: '' });
});
authRouter.post('/wechat/logout', (_req, res) => {
    res.json({ ok: true });
});
