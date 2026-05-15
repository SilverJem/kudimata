import { Markup } from 'telegraf';
import { KudiMataContext } from '../../types';

export const startHandler = async (ctx: KudiMataContext) => {
    const user = ctx.state.user;
    if (!user) return;

    try {
        const welcomeMessage = `
💰 *Welcome to KudiMata, ${user.firstName || 'User'}!* 👋

I'm your personal financial assistant. Use the keyboard below to manage your finances easily.

*What would you like to do?*
`;

        await ctx.replyWithMarkdownV2(welcomeMessage.replace(/([-_*\[\]()~`>#+=|{}.!])/g, '\\$1'), 
            Markup.keyboard([
                ['💰 Expense', '💵 Income'],
                ['📊 Reports', '⚖️ Balance'],
                ['🏦 Savings', '📌 Debts'],
                ['📒 History', '📅 Budgets'],
                ['⚙️ Settings', '❓ Help']
            ])
            .resize()
            .persistent()
        );
    } catch (error) {
        console.error('Error in start command:', error);
        await ctx.reply('Sorry, there was an error setting up your account. Please try again later.');
    }
};
