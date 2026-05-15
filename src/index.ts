// This file exists only to satisfy Vercel's entry point requirement.
// The actual bot logic for production runs in api/webhook.ts.

export default async () => {
    return { status: 'KudiMata Bot is running via Webhooks in the api/ directory.' };
};
