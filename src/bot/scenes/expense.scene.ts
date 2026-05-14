import { Scenes, Markup } from 'telegraf';
import { KudiMataContext } from '../../types';
import { TransactionService } from '../../services/transaction.service';
import { CategoryService } from '../../services/category.service';
import { TransactionType } from '../../types/enums';

export const EXPENSE_SCENE_ID = 'EXPENSE_SCENE';

export const expenseScene = new Scenes.WizardScene<KudiMataContext>(
    EXPENSE_SCENE_ID,
    // Step 1: Ask for amount
    async (ctx) => {
        await ctx.reply('Enter the amount spent:');
        return ctx.wizard.next();
    },
    // Step 2: Handle amount and ask for category
    async (ctx) => {
        const amount = parseFloat((ctx.message as any)?.text);
        if (isNaN(amount) || amount <= 0) {
            await ctx.reply('Please enter a valid positive number for the amount:');
            return;
        }

        (ctx.wizard.state as any).amount = amount;

        const user = ctx.state.user;
        if (!user) return ctx.scene.leave();

        const categories = await CategoryService.getCategories(user.id, TransactionType.EXPENSE);
        
        const buttons = categories.map(cat => Markup.button.callback(cat.name, cat.name));
        // Chunk buttons into rows of 2
        const rows = [];
        for (let i = 0; i < buttons.length; i += 2) {
            rows.push(buttons.slice(i, i + 2));
        }

        await ctx.reply('Select a category:', Markup.inlineKeyboard(rows));
        return ctx.wizard.next();
    },
    // Step 3: Handle category and ask for note
    async (ctx) => {
        const category = (ctx.callbackQuery as any)?.data;
        if (!category) {
            await ctx.reply('Please select a category from the buttons below:');
            return;
        }

        (ctx.wizard.state as any).category = category;
        await ctx.answerCbQuery();
        await ctx.reply(`Category: ${category}\n\nAdd a note? (or type "skip")`);
        return ctx.wizard.next();
    },
    // Step 4: Handle note and save
    async (ctx) => {
        const note = (ctx.message as any)?.text;
        const finalNote = note?.toLowerCase() === 'skip' ? undefined : note;

        const { amount, category } = ctx.wizard.state as any;
        const user = ctx.state.user;

        if (!user) {
            await ctx.reply('User session lost. Please try /start again.');
            return ctx.scene.leave();
        }

        await TransactionService.createTransaction({
            userId: user.id,
            type: TransactionType.EXPENSE,
            amount,
            category,
            note: finalNote,
        });

        await ctx.reply(`✅ Expense Added!\n\n${user.currency}${amount.toLocaleString()}\nCategory: ${category}${finalNote ? `\nNote: ${finalNote}` : ''}`);
        return ctx.scene.leave();
    }
);
