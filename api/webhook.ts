import { VercelRequest, VercelResponse } from '@vercel/node';
import { bot } from '../src/bot';

export default async (req: VercelRequest, res: VercelResponse) => {
    try {
        console.log('Webhook received update:', JSON.stringify(req.body));
        
        if (req.method === 'POST') {
            await bot.handleUpdate(req.body, res);
            // Vercel functions should always return a response
            if (!res.writableEnded) {
                res.status(200).json({ status: 'ok' });
            }
        } else {
            res.status(200).send('KudiMata Bot is active!');
        }
    } catch (error) {
        console.error('CRITICAL: Webhook error:', error);
        res.status(500).json({ error: 'Internal Error', message: error instanceof Error ? error.message : 'Unknown error' });
    }
};
