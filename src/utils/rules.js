require('dotenv').config();
const { analyzeSentiment } = require('../services/openai');

// Handoff tetikleyen anahtar kelimeler
const HANDOFF_KEYWORDS = [
  'iade',
  'şikayet',
  'şikâyet',
  'kötü',
  'berbat',
  'dava',
  'avukat',
  'sahtekâr',
  'dolandırıcı',
  'sahte',
  'mahkeme',
  'tüketici',
  'şikayet',
];

// Mesajın insan devri gerektirip gerektirmediğini kontrol et
async function shouldHandoff(text) {
  try {
    const lowerText = text.toLowerCase();

    // Anahtar kelime eşleşmesi — hızlı kontrol
    const hasKeyword = HANDOFF_KEYWORDS.some((kw) => lowerText.includes(kw));
    if (hasKeyword) return true;

    // GPT ile duygu analizi — skoru yüksekse devir yap
    const sentiment = await analyzeSentiment(text);
    if (sentiment.negative && sentiment.score >= 7) return true;

    return false;
  } catch (err) {
    console.error('[rules] shouldHandoff hatası:', err.message);
    // Hata durumunda güvenli tarafta kal — devir yap
    return false;
  }
}

module.exports = { shouldHandoff };
