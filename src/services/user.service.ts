import prisma from '../database/client';

export class UserService {
    static async getOrCreateUser(telegramId: number, firstName?: string, username?: string, lastName?: string, languageCode?: string) {
        // telegramId is String in the schema
        const tgIdString = telegramId.toString();

        let user = await prisma.user.findUnique({
            where: { telegramId: tgIdString },
        });

        if (!user) {
            user = await prisma.user.create({
                data: {
                    telegramId: tgIdString,
                    firstName,
                    username,
                    lastName,
                },
            });
        }

        return user;
    }

    static async updateCurrency(telegramId: number, currency: string) {
        return prisma.user.update({
            where: { telegramId: telegramId.toString() },
            data: { currency },
        });
    }
}
