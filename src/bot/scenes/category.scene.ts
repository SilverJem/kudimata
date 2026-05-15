import { Scenes, Markup } from 'telegraf';
import { KudiMataContext } from '../../types';
import { CategoryService } from '../../services/category.service';
import { TransactionType } from '../../types/enums';

export const CATEGORY_SCENE_ID = 'CATEGORY_SCENE';

export const categoryScene = new Scenes.WizardScene<KudiMataContext>(
    CATEGORY_SCENE_ID,
    // Step 1: Main Menu
    async (ctx) => {
        await ctx.reply('📂 *Category Management*\n\nWhat would you like to do?', {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
                [Markup.button.callback('📝 View Categories', 'list_categories')],
                [Markup.button.callback('➕ Add Category', 'add_category')],
                [Markup.button.callback('🔙 Back to Main Menu', 'back_to_menu')]
            ])
        });
        return ctx.wizard.next();
    },
    // Step 2: Handle Main Menu Choice
    async (ctx) => {
        const choice = (ctx.callbackQuery as any)?.data;
        if (!choice) return;

        await ctx.answerCbQuery();

        if (choice === 'back_to_menu') {
            await ctx.reply('Returning to main menu... use /start to see options.');
            return ctx.scene.leave();
        }

        if (choice === 'list_categories') {
            const user = ctx.state.user;
            if (!user) return ctx.scene.leave();

            const expenseCats = await CategoryService.getCategories(user.id, TransactionType.EXPENSE);
            const incomeCats = await CategoryService.getCategories(user.id, TransactionType.INCOME);

            let msg = '📊 *Your Categories*\n\n';
            msg += '*Expenses:*\n' + expenseCats.map(c => `- ${c.name}`).join('\n') + '\n\n';
            msg += '*Income:*\n' + incomeCats.map(c => `- ${c.name}`).join('\n');

            await ctx.reply(msg, { 
                parse_mode: 'Markdown',
                ...Markup.inlineKeyboard([[Markup.button.callback('🔙 Back', 'back_to_categories')]])
            });
            ctx.wizard.selectStep(0);
            return;
        }

        if (choice === 'add_category') {
            await ctx.reply('What type of category is this?', {
                ...Markup.inlineKeyboard([
                    [Markup.button.callback('💸 Expense', 'type_expense'), Markup.button.callback('💰 Income', 'type_income')]
                ])
            });
            return ctx.wizard.next();
        }
    },
    // Step 3: Handle Type Selection
    async (ctx) => {
        const typeChoice = (ctx.callbackQuery as any)?.data;
        if (!typeChoice) return;

        await ctx.answerCbQuery();
        (ctx.wizard.state as any).type = typeChoice === 'type_expense' ? TransactionType.EXPENSE : TransactionType.INCOME;
        
        await ctx.reply(`Enter the name for the new ${typeChoice === 'type_expense' ? 'Expense' : 'Income'} category:`);
        return ctx.wizard.next();
    },
    // Step 4: Handle Name and Save
    async (ctx) => {
        const name = (ctx.message as any)?.text;
        if (!name || name.length < 2) {
            await ctx.reply('Please enter a valid category name (at least 2 characters):');
            return;
        }

        const user = ctx.state.user;
        const type = (ctx.wizard.state as any).type;

        if (!user) return ctx.scene.leave();

        await CategoryService.createCategory(user.id, name, type);
        await ctx.reply(`✅ Category "${name}" added successfully!`);
        
        // Return to start of scene
        return ctx.scene.reenter();
    }
);
