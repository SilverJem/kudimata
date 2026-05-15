import { Scenes, Markup } from 'telegraf';
import { KudiMataContext } from '../../types';
import { AnalyticsService } from '../../services/analytics.service';
import { ChartService } from '../../services/chart.service';

export const REPORTS_SCENE_ID = 'REPORTS_SCENE';

export const reportsScene = new Scenes.WizardScene<KudiMataContext>(
    REPORTS_SCENE_ID,
    // Step 1: Menu
    async (ctx) => {
        await ctx.reply('📊 *Reports & Analytics*\n\nChoose a report type to view your financial performance:', {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
                [Markup.button.callback('📅 Monthly Summary', 'monthly')],
                [Markup.button.callback('Pie Chart Category Breakdown', 'categories')],
                [Markup.button.callback('🔙 Back', 'back')]
            ])
        });
        return ctx.wizard.next();
    },
    // Step 2: Handle Action
    async (ctx) => {
        const action = (ctx.callbackQuery as any)?.data;
        if (!action) return;

        const userId = ctx.state.user?.id;
        if (!userId) return ctx.scene.leave();

        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();

        await ctx.answerCbQuery();

        if (action === 'back') {
            await ctx.reply('Returning to main menu...');
            return ctx.scene.leave();
        }

        if (action === 'monthly') {
            const summary = await AnalyticsService.getMonthlySummary(userId, month, year);
            const chartUrl = ChartService.generateBarChartUrl(summary.income, summary.expenses, `Summary - ${now.toLocaleString('default', { month: 'long' })}`);
            
            const message = `
📅 *Summary for ${now.toLocaleString('default', { month: 'long' })}*

💵 *Income:* ₦${summary.income.toLocaleString()}
💰 *Expenses:* ₦${summary.expenses.toLocaleString()}
⚖️ *Balance:* ₦${summary.balance.toLocaleString()}
📈 *Transactions:* ${summary.count}
`;
            await ctx.replyWithPhoto(chartUrl, { caption: message, parse_mode: 'Markdown' });
            return ctx.scene.leave();
        }

        if (action === 'categories') {
            const breakdown = await AnalyticsService.getCategoryBreakdown(userId, month, year);
            if (breakdown.length === 0) {
                await ctx.reply('No expenses recorded for this month yet.');
                return ctx.scene.leave();
            }

            const chartUrl = ChartService.generatePieChartUrl(breakdown, `Spending - ${now.toLocaleString('default', { month: 'long' })}`);
            
            let message = `🥧 *Category Breakdown (${now.toLocaleString('default', { month: 'long' })})*\n\n`;
            breakdown.forEach(item => {
                message += `• *${item.name}:* ₦${item.amount.toLocaleString()} (${item.percentage.toFixed(1)}%)\n`;
            });

            await ctx.replyWithPhoto(chartUrl, { caption: message, parse_mode: 'Markdown' });
            return ctx.scene.leave();
        }
    }
);

