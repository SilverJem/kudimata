import { Scenes } from 'telegraf';
import { KudiMataContext } from '../../types';
import { TransactionService } from '../../services/transaction.service';
import { TransactionType } from '../../types/enums';

export const INCOME_SCENE_ID = 'INCOME_SCENE';

export const incomeScene = new Scenes.WizardScene<KudiMataContext>(
    INCOME_SCENE_ID,
    // Step 1: Ask for amount
    async (ctx) => {
        await ctx.reply('Enter the amount received:');
        return ctx.wizard.next();
    },
    // Step 2: Handle amount and ask for source
    async (ctx) => {
        const amount = parseFloat((ctx.message as any)?.text);
        if (isNaN(amount) || amount <= 0) {
            await ctx.reply('Please enter a valid positive number for the amount:');
            return;
        }

        (ctx.wizard.state as any).amount = amount;

        await ctx.reply('Select the source:', {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: '💼 Salary', callback_data: 'Salary' },
                        { text: '💻 Freelance', callback_data: 'Freelance' }
                    ],
                    [
                        { text: '🏢 Business', callback_data: 'Business' },
                        { text: '🎁 Gift', callback_data: 'Gift' }
                    ],
                    [
                        { text: '📈 Investment', callback_data: 'Investment' },
                        { text: '➕ Other', callback_data: 'Other' }
                    ]
                ]
            }
        });
        return ctx.wizard.next();
    },
    // Step 3: Handle source and ask for note
    async (ctx) => {
        const source = (ctx.callbackQuery as any)?.data;
        if (!source) {
            await ctx.reply('Please select a source from the buttons below:');
            return;
        }

        (ctx.wizard.state as any).source = source;
        await ctx.answerCbQuery();
        await ctx.reply(`Source: ${source}\n\nAdd a note? (or type "skip")`);
        return ctx.wizard.next();
    },
    // Step 4: Handle note and save
    async (ctx) => {
        const note = (ctx.message as any)?.text;
        const finalNote = note?.toLowerCase() === 'skip' ? undefined : note;

        const { amount, source } = ctx.wizard.state as any;
        const user = ctx.state.user;

        if (!user) {
            await ctx.reply('User session lost. Please try /start again.');
            return ctx.scene.leave();
        }

        await TransactionService.createTransaction({
            userId: user.id,
            type: TransactionType.INCOME,
            amount,
            category: source,
            note: finalNote,
        });

        await ctx.reply(`✅ Income Added!\n\n${user.currency}${amount.toLocaleString()}\nSource: ${source}${finalNote ? `\nNote: ${finalNote}` : ''}`);
        return ctx.scene.leave();
    }
);
