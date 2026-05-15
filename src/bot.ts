import { Telegraf, Context, session, Scenes } from 'telegraf';
import { KudiMataContext } from './types';
import { startHandler } from './bot/commands/start';
import { authMiddleware } from './bot/middleware/auth.middleware';

// Scenes
import { expenseScene, EXPENSE_SCENE_ID } from './bot/scenes/expense.scene';
import { incomeScene, INCOME_SCENE_ID } from './bot/scenes/income.scene';
import { budgetScene, BUDGET_SCENE_ID } from './bot/scenes/budget.scene';
import { savingsScene, SAVINGS_SCENE_ID } from './bot/scenes/savings.scene';
import { debtScene, DEBT_SCENE_ID } from './bot/scenes/debt.scene';
import { categoryScene, CATEGORY_SCENE_ID } from './bot/scenes/category.scene';
import { settingsScene, SETTINGS_SCENE_ID } from './bot/scenes/settings.scene';
import { reportsScene, REPORTS_SCENE_ID } from './bot/scenes/reports.scene';

// Services
import { TransactionService } from './services/transaction.service';
import { ParserService } from './services/parser.service';
import { AnalyticsService } from './services/analytics.service';

const bot = new Telegraf<KudiMataContext>(process.env.BOT_TOKEN as string);

// Error handling
bot.catch((err: any, ctx: Context) => {
    console.error(`Error for ${ctx.updateType}`, err);
});

// Middleware
bot.use(session());
bot.use(authMiddleware);

// Set up scenes stage
const stage = new Scenes.Stage<KudiMataContext>([
    expenseScene,
    incomeScene,
    budgetScene,
    savingsScene,
    debtScene,
    categoryScene,
    settingsScene,
    reportsScene
]);
bot.use(stage.middleware());

// Commands
bot.start(startHandler);

bot.command('balance', async (ctx) => {
    const user = ctx.state.user;
    if (!user) return;

    const stats = await TransactionService.getBalance(user.id);
    await ctx.reply(
        `💳 *Current Balance*\n\n` +
        `💰 Income: ${user.currency}${stats.totalIncome.toLocaleString()}\n` +
        `💸 Expenses: ${user.currency}${stats.totalExpenses.toLocaleString()}\n` +
        `⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯\n` +
        `✨ *Balance: ${user.currency}${stats.balance.toLocaleString()}*`,
        { parse_mode: 'Markdown' }
    );
});

bot.command('history', async (ctx) => {
    const userId = ctx.state.user?.id;
    if (!userId) return;

    const filter = ctx.message.text.split(' ')[1]?.toLowerCase();
    const transactions = await TransactionService.getRecentHistory(userId, 10);
    
    let filtered = transactions;
    if (filter) {
        filtered = transactions.filter(t => t.category.toLowerCase() === filter);
    }

    if (filtered.length === 0) {
        return ctx.reply(`No transactions found${filter ? ` for category "${filter}"` : ''}.`);
    }

    const historyText = filtered.map(t => 
        `${t.type === 'INCOME' ? '💵' : '💰'} *₦${t.amount.toLocaleString()}* - ${t.category}\n_${new Date(t.createdAt).toLocaleDateString()}_`
    ).join('\n\n');
    
    await ctx.reply(`📜 *Recent History${filter ? ` (${filter})` : ''}*\n\n${historyText}`, { parse_mode: 'Markdown' });
});

bot.command('expense', (ctx) => ctx.scene.enter(EXPENSE_SCENE_ID));
bot.command('income', (ctx) => ctx.scene.enter(INCOME_SCENE_ID));
bot.command('budget', (ctx) => ctx.scene.enter(BUDGET_SCENE_ID));
bot.command('savings', (ctx) => ctx.scene.enter(SAVINGS_SCENE_ID));
bot.command('debt', (ctx) => ctx.scene.enter(DEBT_SCENE_ID));
bot.command('categories', (ctx) => ctx.scene.enter(CATEGORY_SCENE_ID));
bot.command('settings', (ctx) => ctx.scene.enter(SETTINGS_SCENE_ID));
bot.command('reports', (ctx) => ctx.scene.enter(REPORTS_SCENE_ID));

bot.command('export', async (ctx) => {
    const userId = ctx.state.user?.id;
    if (!userId) return;

    const transactions = await TransactionService.getRecentHistory(userId, 1000); // Get up to 1000
    if (transactions.length === 0) return ctx.reply('No transactions to export.');

    let csv = 'Date,Type,Amount,Category,Note\n';
    transactions.forEach(t => {
        csv += `${new Date(t.createdAt).toLocaleDateString()},${t.type},${t.amount},"${t.category}","${t.note || ''}"\n`;
    });

    const buffer = Buffer.from(csv, 'utf-8');
    await ctx.replyWithDocument({ source: buffer, filename: `kudimata_export_${new Date().toISOString().split('T')[0]}.csv` }, {
        caption: '📊 *KudiMata Data Export*\nHere are your transactions in CSV format.',
        parse_mode: 'Markdown'
    });
});

// Keyboard Handlers
bot.hears('💰 Expense', (ctx) => ctx.scene.enter(EXPENSE_SCENE_ID));
bot.hears('💵 Income', (ctx) => ctx.scene.enter(INCOME_SCENE_ID));
bot.hears('📊 Reports', (ctx) => ctx.scene.enter(REPORTS_SCENE_ID));
bot.hears('⚖️ Balance', (ctx) => ctx.command('balance'));
bot.hears('🏦 Savings', (ctx) => ctx.scene.enter(SAVINGS_SCENE_ID));
bot.hears('📌 Debts', (ctx) => ctx.scene.enter(DEBT_SCENE_ID));
bot.hears('📒 History', (ctx) => ctx.command('history'));
bot.hears('📅 Budgets', (ctx) => ctx.scene.enter(BUDGET_SCENE_ID));
bot.hears('⚙️ Settings', (ctx) => ctx.scene.enter(SETTINGS_SCENE_ID));
bot.hears('❓ Help', (ctx) => ctx.command('help'));

// Quick Entry Parser
bot.on('text', async (ctx, next) => {
    const text = ctx.message.text;
    if (text.startsWith('/')) return next();
    
    // Skip if it's one of the main keyboard buttons
    const mainButtons = ['💰 Expense', '💵 Income', '📊 Reports', '⚖️ Balance', '🏦 Savings', '📌 Debts', '📒 History', '📅 Budgets', '⚙️ Settings', '❓ Help'];
    if (mainButtons.includes(text)) return next();

    const parsed = ParserService.parse(text);
    if (parsed) {
        const typeEmoji = parsed.type === 'INCOME' ? '💵' : '💰';
        const message = `
${typeEmoji} *Quick Entry Detected*

*Type:* ${parsed.type}
*Amount:* ₦${parsed.amount.toLocaleString()}
*Category:* ${parsed.category}
${parsed.note ? `*Note:* ${parsed.note}` : ''}

*Do you want to record this?*
`;
        return ctx.reply(message, {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
                [Markup.button.callback('✅ Confirm', `confirm_quick_${parsed.type}_${parsed.amount}_${parsed.category}`)],
                [Markup.button.callback('❌ Cancel', 'cancel_quick')]
            ])
        });
    }

    return next();
});

bot.action(/confirm_quick_(.+)_(.+)_(.+)/, async (ctx) => {
    const [, type, amount, category] = ctx.match;
    const userId = ctx.state.user?.id;
    if (!userId) return;

    await TransactionService.createTransaction({
        userId,
        type: type as any,
        amount: parseFloat(amount),
        category: category,
    });

    await ctx.answerCbQuery('Transaction recorded! ✅');
    await ctx.editMessageText(`✅ *Recorded:* ₦${parseFloat(amount).toLocaleString()} as ${category} (${type})`, { parse_mode: 'Markdown' });
});

bot.action('cancel_quick', (ctx) => {
    ctx.answerCbQuery();
    ctx.deleteMessage();
});

bot.help((ctx) => ctx.reply('I can help you manage your finances.\n\nCommands:\n/start - Main menu\n/income - Add income\n/expense - Add expense\n/budget - Manage budget\n/savings - Savings goals\n/debt - Manage debts\n/categories - Manage categories\n/settings - Bot settings\n/reports - Financial reports\n/balance - Check balance\n/history - View history'));

// Menu Actions
bot.action('add_expense', (ctx) => ctx.scene.enter(EXPENSE_SCENE_ID));
bot.action('add_income', (ctx) => ctx.scene.enter(INCOME_SCENE_ID));
bot.action('view_budget', (ctx) => ctx.scene.enter(BUDGET_SCENE_ID));
bot.action('view_savings', (ctx) => ctx.scene.enter(SAVINGS_SCENE_ID));
bot.action('add_debt', (ctx) => ctx.scene.enter(DEBT_SCENE_ID));
bot.action('view_balance', (ctx) => ctx.reply('Use /balance command to see your stats.'));
bot.action('view_history', (ctx) => ctx.reply('Use /history command to see your transactions.'));

export { bot, KudiMataContext };
