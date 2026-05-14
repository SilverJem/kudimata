import prisma from '../database/client';
import { TransactionType } from '../types/enums';

export class CategoryService {
    static async getCategories(userId: string, type: TransactionType) {
        let categories = await prisma.category.findMany({
            where: { userId, type },
            orderBy: { name: 'asc' }
        });

        // If user has no categories, seed with defaults
        if (categories.length === 0) {
            const defaults = type === TransactionType.EXPENSE 
                ? ['Food', 'Transport', 'Rent', 'Bills', 'Shopping', 'Health']
                : ['Salary', 'Freelance', 'Gift', 'Investment'];
            
            await prisma.category.createMany({
                data: defaults.map(name => ({
                    userId,
                    name,
                    type
                }))
            });

            categories = await prisma.category.findMany({
                where: { userId, type },
                orderBy: { name: 'asc' }
            });
        }

        return categories;
    }

    static async createCategory(userId: string, name: string, type: TransactionType) {
        return prisma.category.upsert({
            where: {
                userId_name_type: { userId, name, type }
            },
            update: {},
            create: { userId, name, type }
        });
    }

    static async deleteCategory(id: string) {
        return prisma.category.delete({
            where: { id }
        });
    }
}
