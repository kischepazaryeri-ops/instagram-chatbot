require('dotenv').config();
const express = require('express');
const { handleDM } = require('./handlers/dmHandler');
const { handleComment } = require('./handlers/commentHandler');

const router = express.Router();

const WEBHOOK_VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN;

// GET /webhook — Meta webhook doğrulama (subscribe sırasında bir kez çağrılır)
router.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === WEBHOOK_VERIFY_TOKEN) {
    console.log('[webhook] Webhook doğrulandı');
    return res.status(200).send(challenge);
  }

  console.warn('[webhook] Doğrulama başarısız — token eşleşmedi');
  return res.sendStatus(403);
});

// POST /webhook — Gelen olayları işle
router.post('/', (req, res) => {
  const body = req.body;

  // Meta her zaman 200 bekler, yoksa tekrar gönderir
  res.sendStatus(200);

  if (body.object !== 'instagram') {
    console.warn('[webhook] Bilinmeyen object türü:', body.object);
    return;
  }

  for (const entry of body.entry || []) {
    // --- DM olayları ---
    for (const messaging of entry.messaging || []) {
      const senderId = messaging.sender?.id;
      const messageText = messaging.message?.text;

      // Kendi mesajlarımızı yok say (echo)
      if (messaging.message?.is_echo) continue;

      if (senderId && messageText) {
        handleDM(senderId, messageText).catch((err) =>
          console.error('[webhook] handleDM async hatası:', err.message)
        );
      }
    }

    // --- Yorum olayları ---
    for (const change of entry.changes || []) {
      if (change.field !== 'comments') continue;

      const value = change.value;
      const commentId = value?.id;
      const commentText = value?.text;
      const mediaId = value?.media?.id;

      // Kendi yorumlarımızı yok say
      if (value?.from?.id === process.env.INSTAGRAM_ACCOUNT_ID) continue;

      if (commentId && commentText) {
        handleComment(commentId, commentText, mediaId).catch((err) =>
          console.error('[webhook] handleComment async hatası:', err.message)
        );
      }
    }
  }
});

module.exports = router;
