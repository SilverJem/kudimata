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

// Only launch polling if NOT in a serverless environment (Vercel)
if (!process.env.VERCEL) {
    startBot();
} else {
    console.log('Serverless environment detected. Skipping bot.launch().');
}

// Dummy export to satisfy Vercel's builder if it tries to deploy this as a function
export default async () => {
    return { status: 'Bot entry point is api/webhook.ts' };
};
