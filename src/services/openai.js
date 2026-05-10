require('dotenv').config();
const { OpenAI } = require('openai');

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const BRAND_NAME = process.env.BRAND_NAME || 'Marka';

const SYSTEM_PROMPT = `Sen ${BRAND_NAME} Instagram hesabının müşteri hizmetleri asistanısın.
Samimi, yardımsever ve kısa yanıtlar ver (DM için maksimum 200 karakter).
Fiyat, teslimat ve iade sorularını yanıtla.
Emin olmadığın konularda "ekibimize yönlendiriyorum" de.
Emoji kullanabilirsin ama abartma.
Türkçe konuş.`;

// SQLite'dan gelen geçmişi OpenAI mesaj dizisine dönüştür
function buildMessages(history, newMessage) {
  const messages = [{ role: 'system', content: SYSTEM_PROMPT }];

  for (const row of history) {
    messages.push({ role: row.role, content: row.content });
  }

  messages.push({ role: 'user', content: newMessage });
  return messages;
}

// GPT-4o'dan yanıt al
async function getCompletion(messages) {
  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages,
      max_tokens: 300,
      temperature: 0.7,
    });
    return response.choices[0].message.content.trim();
  } catch (err) {
    console.error('[openai] getCompletion hatası:', err.message);
    throw err;
  }
}

// Kısa yorum cevabı üret (max 150 karakter)
async function getCommentReply(commentText) {
  try {
    const messages = [
      {
        role: 'system',
        content: `Sen ${BRAND_NAME} Instagram hesabısın. Gelen yoruma samimi, kısa ve pozitif bir cevap yaz. Maksimum 150 karakter. Türkçe.`,
      },
      { role: 'user', content: commentText },
    ];

    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages,
      max_tokens: 80,
      temperature: 0.8,
    });

    let reply = response.choices[0].message.content.trim();
    // 150 karakteri aşarsa kes
    if (reply.length > 150) reply = reply.substring(0, 147) + '...';
    return reply;
  } catch (err) {
    console.error('[openai] getCommentReply hatası:', err.message);
    throw err;
  }
}

// Duygu analizi — handoff kararı için kullanılır
async function analyzeSentiment(text) {
  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content:
            'Aşağıdaki metni analiz et. Sadece JSON döndür: {"negative": true/false, "score": 0-10}. score 7+ ise negative true olsun.',
        },
        { role: 'user', content: text },
      ],
      max_tokens: 50,
      temperature: 0,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(response.choices[0].message.content);
    return result;
  } catch (err) {
    console.error('[openai] analyzeSentiment hatası:', err.message);
    return { negative: false, score: 0 };
  }
}

module.exports = { buildMessages, getCompletion, getCommentReply, analyzeSentiment };
