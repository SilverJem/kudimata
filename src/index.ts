import 'dotenv/config';
import { bot } from './bot';

const startBot = async () => {
    try {
        console.log('Starting KudiMata bot...');
        await bot.launch();
        console.log('KudiMata is running successfully!');
    } catch (error) {
        console.error('Error starting bot:', error);
        process.exit(1);
    }
};

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

startBot();
