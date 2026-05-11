require('dotenv').config();
const express = require('express');
const webhookRouter = require('./webhook');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  })
);

app.use('/webhook', webhookRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/auth', async (req, res) => {
  const { code, error } = req.query;
  if (error) return res.send(`Hata: ${error}`);
  if (!code) return res.send('Code bulunamadı');
  try {
    const axios = require('axios');
    const tokenRes = await axios.get('https://graph.facebook.com/oauth/access_token', {
      params: {
        client_id: process.env.APP_ID,
        client_secret: process.env.APP_SECRET,
        redirect_uri: process.env.APP_REDIRECT_URI,
        code,
      },
    });
    const userToken = tokenRes.data.access_token;
    const pageRes = await axios.get(`https://graph.facebook.com/${process.env.FACEBOOK_PAGE_ID}`, {
      params: { fields: 'access_token', access_token: userToken },
    });
    const pageToken = pageRes.data.access_token || userToken;
    res.send(`
      <h2>User Token:</h2>
      <textarea rows="3" cols="80">${userToken}</textarea>
      <h2>Page Token (bunu PAGE_ACCESS_TOKEN yap):</h2>
      <textarea rows="3" cols="80">${pageToken}</textarea>
    `);
  } catch (err) {
    res.send(`Token alınamadı: ${JSON.stringify(err.response?.data || err.message)}`);
  }
});

app.use((_req, res) => {
  res.sendStatus(404);
});

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
