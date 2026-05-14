import { VercelRequest, VercelResponse } from '@vercel/node';
import { bot } from '../src/bot';

export default async (req: VercelRequest, res: VercelResponse) => {
    try {
        if (req.method === 'POST') {
            await bot.handleUpdate(req.body, res as any);
        } else {
            res.status(200).send('Bot is running...');
        }
    } catch (error) {
        console.error('Error handling update:', error);
        res.status(500).send('Error handling update');
    }
};
