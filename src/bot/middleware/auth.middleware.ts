import { KudiMataContext } from '../../types';
import { UserService } from '../../services/user.service';

export const authMiddleware = async (ctx: KudiMataContext, next: () => Promise<void>) => {
    if (!ctx.from) {
        return next();
    }

    try {
        const user = await UserService.getOrCreateUser(
            ctx.from.id,
            ctx.from.first_name,
            ctx.from.username,
            ctx.from.last_name,
            ctx.from.language_code
        );

        // Attach the user from the database to the Telegraf context state
        ctx.state.user = user;
    } catch (error) {
        console.error('Error in auth middleware:', error);
        // We do not stop execution if DB fails here, but some commands might fail
        // Optionally, we could send a message and not call next()
    }

    return next();
};
