import { KudiMataContext } from '../../types';

export const startHandler = async (ctx: KudiMataContext) => {
    const user = ctx.state.user;
    if (!user) return;

    try {
        const welcomeMessage = `
💰 *Welcome to KudiMata, ${user.firstName || 'User'}!* 👋

I'm your personal financial assistant. I can help you track expenses, manage budgets, and monitor your savings.

*What would you like to do first?*
`;

        await ctx.replyWithMarkdownV2(welcomeMessage.replace(/([-_*\[\]()~`>#+=|{}.!])/g, '\\$1'), {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: '💰 Add Expense', callback_data: 'add_expense' },
                        { text: '💵 Add Income', callback_data: 'add_income' }
                    ],
                    [
                        { text: '📊 Budget', callback_data: 'view_budget' },
                        { text: '🏦 Savings', callback_data: 'view_savings' }
                    ],
                    [
                        { text: '📒 History', callback_data: 'view_history' },
                        { text: '⚖️ Balance', callback_data: 'view_balance' }
                    ]
                ]
            }
        });
    } catch (error) {
        console.error('Error in start command:', error);
        await ctx.reply('Sorry, there was an error setting up your account. Please try again later.');
    }
};
