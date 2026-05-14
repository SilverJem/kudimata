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

// Services
import { TransactionService } from './services/transaction.service';

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
    debtScene
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
    const user = ctx.state.user;
    if (!user) return;

    const history = await TransactionService.getRecentHistory(user.id);
    if (history.length === 0) {
        return ctx.reply('No transactions found yet.');
    }

    const historyText = history
        .map(t => `${t.type === 'INCOME' ? '➕' : '➖'} ${user.currency}${t.amount.toLocaleString()} - ${t.category} ${t.note ? `(${t.note})` : ''}`)
        .join('\n');

    await ctx.reply(`📜 *Recent History*\n\n${historyText}`, { parse_mode: 'Markdown' });
});

bot.help((ctx) => ctx.reply('I can help you manage your finances. Use /start to see the main menu.'));

// Menu Actions
bot.action('add_expense', (ctx) => ctx.scene.enter(EXPENSE_SCENE_ID));
bot.action('add_income', (ctx) => ctx.scene.enter(INCOME_SCENE_ID));
bot.action('view_budget', (ctx) => ctx.scene.enter(BUDGET_SCENE_ID));
bot.action('view_savings', (ctx) => ctx.scene.enter(SAVINGS_SCENE_ID));
bot.action('add_debt', (ctx) => ctx.scene.enter(DEBT_SCENE_ID));
bot.action('view_balance', (ctx) => ctx.reply('Use /balance command to see your stats.'));
bot.action('view_history', (ctx) => ctx.reply('Use /history command to see your transactions.'));

export { bot, KudiMataContext };
