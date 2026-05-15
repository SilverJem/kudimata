import { Scenes, Markup } from 'telegraf';
import { KudiMataContext } from '../../types';
import prisma from '../../database/client';

export const SETTINGS_SCENE_ID = 'SETTINGS_SCENE';

export const settingsScene = new Scenes.WizardScene<KudiMataContext>(
    SETTINGS_SCENE_ID,
    // Step 1: Main Menu
    async (ctx) => {
        const user = ctx.state.user;
        if (!user) return ctx.scene.leave();

        await ctx.reply('⚙️ *Settings*\n\nChoose an option to customize your experience:', {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
                [Markup.button.callback(`💱 Currency (${user.currency})`, 'change_currency')],
                [Markup.button.callback('🌍 Timezone', 'change_timezone')],
                [Markup.button.callback('🔙 Back', 'back')]
            ])
        });
        return ctx.wizard.next();
    },
    // Step 2: Handle Selection
    async (ctx) => {
        const choice = (ctx.callbackQuery as any)?.data;
        if (!choice) return;

        await ctx.answerCbQuery();

        if (choice === 'back') {
            await ctx.reply('Returning to main menu...');
            return ctx.scene.leave();
        }

        if (choice === 'change_currency') {
            await ctx.reply('Select your preferred currency:', Markup.inlineKeyboard([
                [Markup.button.callback('₦ Naira (NGN)', 'set_NGN'), Markup.button.callback('$ Dollar (USD)', 'set_USD')],
                [Markup.button.callback('£ Pound (GBP)', 'set_GBP'), Markup.button.callback('€ Euro (EUR)', 'set_EUR')]
            ]));
            return ctx.wizard.next();
        }

        if (choice === 'change_timezone') {
            await ctx.reply('Enter your timezone (e.g., Africa/Lagos, Europe/London):');
            return ctx.wizard.next();
        }
    },
    // Step 3: Handle Update
    async (ctx) => {
        const user = ctx.state.user;
        if (!user) return ctx.scene.leave();

        const callbackData = (ctx.callbackQuery as any)?.data;
        const textData = (ctx.message as any)?.text;

        if (callbackData?.startsWith('set_')) {
            const currency = callbackData.split('_')[1];
            await prisma.user.update({
                where: { id: user.id },
                data: { currency }
            });
            await ctx.answerCbQuery();
            await ctx.reply(`✅ Currency updated to ${currency}`);
            return ctx.scene.leave();
        }

        if (textData) {
            // Very basic timezone validation
            try {
                Intl.DateTimeFormat(undefined, { timeZone: textData });
                await prisma.user.update({
                    where: { id: user.id },
                    data: { timezone: textData }
                });
                await ctx.reply(`✅ Timezone updated to ${textData}`);
            } catch (e) {
                await ctx.reply('❌ Invalid timezone. Please try again (e.g., Africa/Lagos):');
                return;
            }
            return ctx.scene.leave();
        }
    }
);
