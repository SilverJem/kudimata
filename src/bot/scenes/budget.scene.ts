import { Scenes } from 'telegraf';
import { KudiMataContext } from '../../types';
import { BudgetService } from '../../services/budget.service';

export const BUDGET_SCENE_ID = 'BUDGET_SCENE';

export const budgetScene = new Scenes.WizardScene<KudiMataContext>(
    BUDGET_SCENE_ID,
    // Step 1: Ask for category
    async (ctx) => {
        await ctx.reply('Select a category to set a budget for:', {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: '🍔 Food', callback_data: 'Food' },
                        { text: '🚕 Transport', callback_data: 'Transport' }
                    ],
                    [
                        { text: '🏠 Rent', callback_data: 'Rent' },
                        { text: '💡 Bills', callback_data: 'Bills' }
                    ],
                    [
                        { text: '🛍 Shopping', callback_data: 'Shopping' }
                    ]
                ]
            }
        });
        return ctx.wizard.next();
    },
    // Step 2: Handle category and ask for monthly limit
    async (ctx) => {
        const category = (ctx.callbackQuery as any)?.data;
        if (!category) {
            await ctx.reply('Please select a category:');
            return;
        }

        (ctx.wizard.state as any).category = category;
        await ctx.answerCbQuery();
        await ctx.reply(`Setting monthly budget for ${category}.\n\nEnter the limit amount:`);
        return ctx.wizard.next();
    },
    // Step 3: Handle limit and save
    async (ctx) => {
        const limit = parseFloat((ctx.message as any)?.text);
        if (isNaN(limit) || limit <= 0) {
            await ctx.reply('Please enter a valid positive number for the budget limit:');
            return;
        }

        const { category } = ctx.wizard.state as any;
        const user = ctx.state.user;
        const now = new Date();

        if (!user) return ctx.scene.leave();

        await BudgetService.setBudget({
            userId: user.id,
            category,
            limit,
            month: now.getMonth() + 1,
            year: now.getFullYear(),
        });

        await ctx.reply(`✅ Budget Set!\n\nCategory: ${category}\nMonthly Limit: ${user.currency}${limit.toLocaleString()}`);
        return ctx.scene.leave();
    }
);
