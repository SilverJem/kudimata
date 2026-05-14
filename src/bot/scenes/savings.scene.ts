import { Scenes } from 'telegraf';
import { KudiMataContext } from '../../types';
import { SavingsService } from '../../services/savings.service';

export const SAVINGS_SCENE_ID = 'SAVINGS_SCENE';

export const savingsScene = new Scenes.WizardScene<KudiMataContext>(
    SAVINGS_SCENE_ID,
    // Step 1: Ask for goal name
    async (ctx) => {
        await ctx.reply('What are you saving for? (e.g. "New iPhone", "Emergency Fund")');
        return ctx.wizard.next();
    },
    // Step 2: Handle name and ask for target amount
    async (ctx) => {
        const name = (ctx.message as any)?.text;
        if (!name) return;

        (ctx.wizard.state as any).name = name;
        await ctx.reply(`Setting goal for "${name}".\n\nWhat is your target amount?`);
        return ctx.wizard.next();
    },
    // Step 3: Handle target and save
    async (ctx) => {
        const targetAmount = parseFloat((ctx.message as any)?.text);
        if (isNaN(targetAmount) || targetAmount <= 0) {
            await ctx.reply('Please enter a valid positive number for the target amount:');
            return;
        }

        const { name } = ctx.wizard.state as any;
        const user = ctx.state.user;

        if (!user) return ctx.scene.leave();

        await SavingsService.createGoal({
            userId: user.id,
            name,
            targetAmount,
        });

        await ctx.reply(`✅ Savings Goal Created!\n\nGoal: ${name}\nTarget: ${user.currency}${targetAmount.toLocaleString()}`);
        return ctx.scene.leave();
    }
);
