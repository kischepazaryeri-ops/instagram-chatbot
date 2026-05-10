require('dotenv').config();
const express = require('express');
const webhookRouter = require('./webhook');

const app = express();
const PORT = process.env.PORT || 3000;

// Meta ham JSON body'yi imzayla doğrulamak için önce raw buffer al
app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  })
);

// Webhook rotaları
app.use('/webhook', webhookRouter);

// Sağlık kontrolü — Railway/Render için
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Tanımsız rotalar
app.use((_req, res) => {
  res.sendStatus(404);
});

// Global hata yakalayıcı
app.use((err, _req, res, _next) => {
  console.error('[server] Beklenmeyen hata:', err.message);
  res.sendStatus(500);
});

app.listen(PORT, () => {
  console.log(`[server] Instagram Chatbot çalışıyor → port ${PORT}`);
  console.log(`[server] Webhook URL: /webhook`);
  console.log(`[server] Ortam: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
