require('dotenv').config();
const axios = require('axios');

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

// Slack'e insan devri bildirimi gönder
async function notifySlack(userId, message) {
  if (!SLACK_WEBHOOK_URL) {
    console.warn('[handoff] SLACK_WEBHOOK_URL tanımlı değil, bildirim atlandı');
    return;
  }

  const instagramProfileUrl = `https://www.instagram.com/direct/t/${userId}/`;

  const payload = {
    text: ':sos: *İnsan Devri Gerekiyor*',
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: ':sos: İnsan Devri Gerekiyor',
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Kullanıcı ID:*\n${userId}`,
          },
          {
            type: 'mrkdwn',
            text: `*Zaman:*\n${new Date().toLocaleString('tr-TR')}`,
          },
        ],
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Son Mesaj:*\n> ${message}`,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Instagram Konuşması:*\n<${instagramProfileUrl}|Konuşmayı Aç>`,
        },
      },
    ],
  };

  try {
    await axios.post(SLACK_WEBHOOK_URL, payload);
    console.log(`[handoff] Slack bildirimi gönderildi → kullanıcı: ${userId}`);
  } catch (err) {
    const detail = err.response?.data || err.message;
    console.error('[handoff] Slack bildirimi hatası:', JSON.stringify(detail));
  }
}

module.exports = { notifySlack };
