import { VercelRequest, VercelResponse } from '@vercel/node';

export default async (req: VercelRequest, res: VercelResponse) => {
    try {
        if (req.method === 'POST') {
            // Lazy load bot to prevent timeouts on initialization
            const { bot } = await import('../src/bot');
            
            console.log('Processing update...');
            await bot.handleUpdate(req.body);
            
            return res.status(200).json({ status: 'ok' });
        } else {
            const host = req.headers.host || 'your-url.vercel.app';
            const url = `https://${host}/api/webhook`;
            return res.status(200).send(`
                <h1>KudiMata Bot is active!</h1>
                <p>Status: Healthy ✅</p>
                <p>Webhook URL: <code>${url}</code></p>
                <p><a href="https://api.telegram.org/bot${process.env.BOT_TOKEN}/setWebhook?url=${url}">Click here to register this webhook</a></p>
            `);
        }
    } catch (error) {
        console.error('CRITICAL: Webhook error:', error);
        return res.status(500).json({ error: 'Internal Error' });
    }
};
