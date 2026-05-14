import prisma from '../database/client';
import { TransactionType } from '../types/enums';

export class TransactionService {
    static async createTransaction(data: {
        userId: string;
        type: TransactionType;
        amount: number;
        category: string;
        note?: string;
    }) {
        return prisma.transaction.create({
            data: {
                userId: data.userId,
                type: data.type,
                amount: data.amount,
                category: data.category,
                note: data.note,
            },
        });
    }

    static async getBalance(userId: string) {
        const transactions = await prisma.transaction.findMany({
            where: { userId },
        });

        const totalIncome = transactions
            .filter((t: any) => t.type === TransactionType.INCOME)
            .reduce((sum: number, t: any) => sum + t.amount, 0);

        const totalExpenses = transactions
            .filter((t: any) => t.type === TransactionType.EXPENSE)
            .reduce((sum: number, t: any) => sum + t.amount, 0);

        return {
            totalIncome,
            totalExpenses,
            balance: totalIncome - totalExpenses,
        };
    }

    static async getRecentHistory(userId: string, limit: number = 10) {
        return prisma.transaction.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }
}
