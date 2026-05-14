import prisma from '../database/client';

export class BudgetService {
    static async setBudget(data: {
        userId: string;
        category: string;
        limit: number;
        month: number;
        year: number;
    }) {
        // Upsert budget for the same category, month, and year
        const existing = await prisma.budget.findFirst({
            where: {
                userId: data.userId,
                category: data.category,
                month: data.month,
                year: data.year,
            },
        });

        if (existing) {
            return prisma.budget.update({
                where: { id: existing.id },
                data: { limit: data.limit },
            });
        }

        return prisma.budget.create({
            data: {
                userId: data.userId,
                category: data.category,
                limit: data.limit,
                month: data.month,
                year: data.year,
            },
        });
    }

    static async getBudgetProgress(userId: string, category: string, month: number, year: number) {
        const budget = await prisma.budget.findFirst({
            where: { userId, category, month, year },
        });

        if (!budget) return null;

        const expenses = await prisma.transaction.findMany({
            where: {
                userId,
                category,
                type: 'EXPENSE',
                createdAt: {
                    gte: new Date(year, month - 1, 1),
                    lt: new Date(year, month, 1),
                },
            },
        });

        const spent = expenses.reduce((sum, t) => sum + t.amount, 0);
        const percentage = (spent / budget.limit) * 100;

        return {
            limit: budget.limit,
            spent,
            percentage,
            remaining: budget.limit - spent,
        };
    }
}
