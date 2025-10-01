# Booking Form (Secure Telegram Proxy)

## Local run
1) Install Node.js (LTS)
2) In this folder:
   ```bash
   npm install
   cp .env.example .env   # Windows PowerShell: copy .env.example .env
   ```
3) Edit `.env` with your real values.
4) Start:
   ```bash
   npm start
   ```
5) Open http://localhost:3000

## Deploy
- Upload this project to your host (Render/Railway/Vercel/Heroku/VPS).
- Set env vars BOT_TOKEN and CHAT_ID in the dashboard.
- Never expose your token in client code.
