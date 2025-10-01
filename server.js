const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID   = process.env.CHAT_ID;

if (!BOT_TOKEN || !CHAT_ID) {
  console.warn('⚠️  BOT_TOKEN or CHAT_ID missing. Create a .env file or set environment variables.');
}

// Serve static files from /public (index.html lives there)
app.use(express.static(path.join(__dirname, 'public')));

function diffNights(checkin, checkout) {
  const d1 = new Date(checkin);
  const d2 = new Date(checkout);
  const ms = d2 - d1;
  const nights = Math.round(ms / 86400000);
  return Math.max(1, nights);
}

app.post('/telegram-proxy', async (req, res) => {
  try {
    if (!BOT_TOKEN || !CHAT_ID) {
      return res.status(500).json({ ok: false, error: 'Server is missing BOT_TOKEN or CHAT_ID' });
    }
    const { checkin, checkout, adults, children, email, phone } = req.body || {};
    if (!checkin || !checkout || !adults || !email || !phone) {
      return res.status(400).json({ ok: false, error: 'Missing required fields.' });
    }
    if (new Date(checkout) <= new Date(checkin)) {
      return res.status(400).json({ ok: false, error: 'Checkout must be after checkin.' });
    }

    const nights = diffNights(checkin, checkout);
    const text = [
      '🏨 *New Booking Request*',
      `• Check-in: *${checkin}*`,
      `• Check-out: *${checkout}*`,
      `• Nights: *${nights}*`,
      `• Guests: *${adults}* adult(s), *${children || 0}* child(ren)`,
      `• Email: *${email}*`,
      `• Phone: *${phone}*`
    ].join('\n');

    const sendUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    const r1 = await fetch(sendUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHAT_ID, text, parse_mode: 'Markdown' })
    });
    const data1 = await r1.json();
    if (!r1.ok || !data1.ok) {
      return res.status(502).json({ ok: false, error: data1.description || 'Telegram sendMessage failed.' });
    }

    const messageId = data1.result.message_id;
    const confirmText = '✅ Your reservation is made! We will contact you soon.';
    const r2 = await fetch(sendUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHAT_ID, text: confirmText, reply_to_message_id: messageId })
    });
    const data2 = await r2.json();
    if (!r2.ok || !data2.ok) {
      return res.json({ ok: true, result: { main: data1.result, confirm_error: data2.description || 'Reply failed' } });
    }

    res.json({ ok: true, result: { main: data1.result, confirm: data2.result } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: e.message || 'Server error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Running at http://localhost:${PORT}`);
});
