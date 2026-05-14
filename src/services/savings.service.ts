import prisma from '../database/client';

export class SavingsService {
    static async createGoal(data: {
        userId: string;
        name: string;
        targetAmount: number;
    }) {
        return prisma.savingsGoal.create({
            data: {
                userId: data.userId,
                name: data.name,
                targetAmount: data.targetAmount,
            },
        });
    }

    static async contributeToGoal(goalId: string, amount: number) {
        return prisma.savingsGoal.update({
            where: { id: goalId },
            data: {
                currentAmount: {
                    increment: amount,
                },
            },
        });
    }

    static async getGoals(userId: string) {
        return prisma.savingsGoal.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }
}
