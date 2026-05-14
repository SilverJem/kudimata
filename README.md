# KudiMata Telegram Bot

A personal finance management bot.

## Deployment on Vercel

### 1. Database Setup (CRITICAL)
Vercel does not support SQLite for persistence. You must switch to a hosted PostgreSQL database (e.g., Supabase or Neon).
1. Create a Postgres database and get the `DATABASE_URL`.
2. In `prisma/schema.prisma`, change `provider = "sqlite"` to `provider = "postgresql"`.
3. Run `npx prisma db push` to sync your schema with the new database.

### 2. Vercel Configuration
1. Push your code to GitHub.
2. Import the project into Vercel.
3. Add the following Environment Variables in Vercel:
   - `BOT_TOKEN`: Your Telegram Bot Token.
   - `DATABASE_URL`: Your Postgres connection string.
   - `NODE_ENV`: `production`

### 3. Setting the Webhook
Once deployed, your bot will be available at `https://your-project.vercel.app/api/webhook`.
You must tell Telegram to send updates to this URL:
```bash
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://your-project.vercel.app/api/webhook"
```

## Local Development
1. `npm install`
2. `npm run dev`
