import prisma from '../database/client';
import { bot } from '../bot';
import { AnalyticsService } from './analytics.service';
import { ChartService } from './chart.service';

export class ReminderService {
    static async sendMonthlySummaries() {
        const users = await prisma.user.findMany();
        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();

        for (const user of users) {
            try {
                const summary = await AnalyticsService.getMonthlySummary(user.id, month, year);
                if (summary.count === 0) continue;

                const chartUrl = ChartService.generateBarChartUrl(summary.income, summary.expenses, `Monthly Summary - ${now.toLocaleString('default', { month: 'long' })}`);
                
                const message = `
🔔 *Your Monthly Financial Summary*

Hi ${user.firstName || 'there'}! Here's your performance for ${now.toLocaleString('default', { month: 'long' })}:

💵 *Income:* ₦${summary.income.toLocaleString()}
💰 *Expenses:* ₦${summary.expenses.toLocaleString()}
⚖️ *Balance:* ₦${summary.balance.toLocaleString()}

*Keep up the great tracking!*
`;
                await bot.telegram.sendPhoto(user.telegramId, chartUrl, { caption: message, parse_mode: 'Markdown' });
            } catch (error) {
                console.error(`Failed to send summary to user ${user.telegramId}:`, error);
            }
        }
    }

    static async sendDebtReminders() {
        const now = new Date();
        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(now.getDate() + 3);

        const upcomingDebts = await prisma.debt.findMany({
            where: {
                status: 'PENDING',
                dueDate: {
                    gte: now,
                    lte: threeDaysFromNow
                }
            },
            include: { user: true }
        });

        for (const debt of upcomingDebts) {
            try {
                const message = `
📌 *Debt Reminder*

Your debt to/from *${debt.person}* of *₦${debt.amount.toLocaleString()}* is due on *${debt.dueDate?.toLocaleDateString()}*.
`;
                await bot.telegram.sendMessage(debt.user.telegramId, message, { parse_mode: 'Markdown' });
            } catch (error) {
                console.error(`Failed to send debt reminder to user ${debt.user.telegramId}:`, error);
            }
        }
    }
}
