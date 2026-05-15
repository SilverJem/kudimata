import prisma from '../database/client';
import { TransactionType } from '../types/enums';

export class AnalyticsService {
    static async getMonthlySummary(userId: string, month: number, year: number) {
        const startOfMonth = new Date(year, month - 1, 1);
        const endOfMonth = new Date(year, month, 0, 23, 59, 59);

        const transactions = await prisma.transaction.findMany({
            where: {
                userId,
                createdAt: {
                    gte: startOfMonth,
                    lte: endOfMonth,
                },
            },
        });

        const income = transactions
            .filter((t: any) => t.type === TransactionType.INCOME)
            .reduce((sum: number, t: any) => sum + t.amount, 0);

        const expenses = transactions
            .filter((t: any) => t.type === TransactionType.EXPENSE)
            .reduce((sum: number, t: any) => sum + t.amount, 0);

        return {
            income,
            expenses,
            balance: income - expenses,
            count: transactions.length,
        };
    }

    static async getCategoryBreakdown(userId: string, month: number, year: number) {
        const startOfMonth = new Date(year, month - 1, 1);
        const endOfMonth = new Date(year, month, 0, 23, 59, 59);

        const expenses = await prisma.transaction.findMany({
            where: {
                userId,
                type: TransactionType.EXPENSE,
                createdAt: {
                    gte: startOfMonth,
                    lte: endOfMonth,
                },
            },
        });

        const breakdown: Record<string, number> = {};
        expenses.forEach((t: any) => {
            breakdown[t.category] = (breakdown[t.category] || 0) + t.amount;
        });

        const total = Object.values(breakdown).reduce((sum, val) => sum + val, 0);

        return Object.entries(breakdown)
            .map(([name, amount]) => ({
                name,
                amount,
                percentage: total > 0 ? (amount / total) * 100 : 0,
            }))
            .sort((a, b) => b.amount - a.amount);
    }
}
