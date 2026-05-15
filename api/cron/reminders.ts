import { VercelRequest, VercelResponse } from '@vercel/node';
import { ReminderService } from '../../src/services/reminder.service';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Basic security: Check for a secret header if you want to prevent unauthorized calls
    // if (req.headers['x-cron-auth'] !== process.env.CRON_SECRET) {
    //     return res.status(401).end('Unauthorized');
    // }

    try {
        console.log('Running daily reminders cron...');
        await ReminderService.sendDebtReminders();
        
        // If it's the 1st of the month, send monthly summaries
        const today = new Date();
        if (today.getDate() === 1) {
            console.log('Running monthly summary cron...');
            await ReminderService.sendMonthlySummaries();
        }

        res.status(200).json({ success: true });
    } catch (error: any) {
        console.error('Cron job failed:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}
