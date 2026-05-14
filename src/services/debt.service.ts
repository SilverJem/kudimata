import prisma from '../database/client';
import { DebtDirection, DebtStatus } from '../types/enums';

export class DebtService {
    static async createDebt(data: {
        userId: string;
        person: string;
        amount: number;
        direction: DebtDirection;
        dueDate?: Date;
    }) {
        return prisma.debt.create({
            data: {
                userId: data.userId,
                person: data.person,
                amount: data.amount,
                direction: data.direction,
                dueDate: data.dueDate,
            },
        });
    }

    static async markAsPaid(debtId: string) {
        return prisma.debt.update({
            where: { id: debtId },
            data: { status: DebtStatus.PAID },
        });
    }

    static async getActiveDebts(userId: string) {
        return prisma.debt.findMany({
            where: {
                userId,
                status: DebtStatus.PENDING,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
}
