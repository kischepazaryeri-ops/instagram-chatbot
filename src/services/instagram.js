require('dotenv').config();
const axios = require('axios');

const BASE_URL = 'https://graph.facebook.com/v19.0';
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const INSTAGRAM_ACCOUNT_ID = process.env.INSTAGRAM_ACCOUNT_ID;

// Kullanıcıya DM gönder
async function sendDM(recipientId, message) {
  try {
    const response = await axios.post(
`${BASE_URL}/${INSTAGRAM_ACCOUNT_ID}/messages`,




      {
        recipient: { id: recipientId },
        message: { text: message },
        messaging_type: 'RESPONSE',
      },
      {
        headers: {
          Authorization: `Bearer ${PAGE_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log(`[instagram] DM gönderildi → ${recipientId}`);
    return response.data;
  } catch (err) {
    const detail = err.response?.data || err.message;
    console.error('[instagram] sendDM hatası:', JSON.stringify(detail));
    throw err;
  }
}

// Yoruma cevap at
async function replyToComment(commentId, message) {
  try {
    const response = await axios.post(
      `${BASE_URL}/${commentId}/replies`,
      { message },
      {
        headers: {
          Authorization: `Bearer ${PAGE_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log(`[instagram] Yorum yanıtlandı → ${commentId}`);
    return response.data;
  } catch (err) {
    const detail = err.response?.data || err.message;
    console.error('[instagram] replyToComment hatası:', JSON.stringify(detail));
    throw err;
  }
}

module.exports = { sendDM, replyToComment };
