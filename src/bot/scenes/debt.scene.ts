import { Scenes } from 'telegraf';
import { KudiMataContext } from '../../types';
import { DebtService } from '../../services/debt.service';
import { DebtDirection } from '../../types/enums';

export const DEBT_SCENE_ID = 'DEBT_SCENE';

export const debtScene = new Scenes.WizardScene<KudiMataContext>(
    DEBT_SCENE_ID,
    // Step 1: Ask for type
    async (ctx) => {
        await ctx.reply('Select debt type:', {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: '💸 I owe someone', callback_data: DebtDirection.OWE },
                        { text: '💰 Someone owes me', callback_data: DebtDirection.OWED_TO_ME }
                    ]
                ]
            }
        });
        return ctx.wizard.next();
    },
    // Step 2: Handle type and ask for person name
    async (ctx) => {
        const direction = (ctx.callbackQuery as any)?.data;
        if (!direction) return;

        (ctx.wizard.state as any).direction = direction;
        await ctx.answerCbQuery();
        await ctx.reply(`Who is this person?`);
        return ctx.wizard.next();
    },
    // Step 3: Handle person and ask for amount
    async (ctx) => {
        const person = (ctx.message as any)?.text;
        if (!person) return;

        (ctx.wizard.state as any).person = person;
        await ctx.reply(`Enter the amount:`);
        return ctx.wizard.next();
    },
    // Step 4: Handle amount and save
    async (ctx) => {
        const amount = parseFloat((ctx.message as any)?.text);
        if (isNaN(amount) || amount <= 0) {
            await ctx.reply('Please enter a valid positive number for the amount:');
            return;
        }

        const { direction, person } = ctx.wizard.state as any;
        const user = ctx.state.user;

        if (!user) return ctx.scene.leave();

        await DebtService.createDebt({
            userId: user.id,
            person,
            amount,
            direction,
        });

        const actionText = direction === DebtDirection.OWE ? 'You owe' : 'is owing you';
        await ctx.reply(`✅ Debt Recorded!\n\n${actionText} ${person}: ${user.currency}${amount.toLocaleString()}`);
        return ctx.scene.leave();
    }
);
