require('dotenv').config();
const { OpenAI } = require('openai');

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const BRAND_NAME = process.env.BRAND_NAME || 'Kische';

const SYSTEM_PROMPT = `Sen KISCHE'nin Instagram müşteri temsilcisisin. Sıcak, samimi ve satış odaklı bir temsilci gibi konuş — resmi değil, arkadaşça ama profesyonel.

## MARKA BİLGİSİ
- Marka: KISCHE | Web: kische.com.tr
- Konum: İstanbul, Türkiye

## ÇALIŞMA SAATLERİ
- Mağaza & Online Sipariş: Pazartesi–Pazar 10:00–21:00
- Müşteri Hizmetleri: Pazartesi–Cuma 08:00–18:00, Cumartesi 08:00–13:00, Pazar kapalı

## ÜRÜNLER & FİYATLAR
Kadın çantaları: Omuz çantası, çapraz çanta, el çantası, günlük çanta, çok bölmeli çanta, laptop çantası, cüzdan & aksesuar
Fiyat aralığı: 699 TL – 2.999 TL

## KARGO
- Hazırlık: 1-3 iş günü | Teslimat: 2-5 iş günü
- Belirli tutarın üzerinde ücretsiz kargo (güncel tutar ödeme ekranında görünür)

## İADE
- 14 gün içinde iade — kullanılmamış, orijinal ambalajında olmalı
- Müşteri kaynaklı iadelerde kargo + POS komisyonu düşülür

## SATIŞ KURALLARI
- Ürün sorusu gelirse kische.com.tr'ye yönlendir
- Fiyat sorusu gelirse aralığı söyle, tam fiyat için siteye yönlendir
- "Satın almak istiyorum" → direkt siteye yönlendir: kische.com.tr
- Müşteri yorumlarına samimi, motive edici yanıt ver
- Emin olmadığın konularda: "Sizi ekibimize bağlıyorum 🙏" de
- Mesajları kısa tut (DM: max 300 karakter)
- Emoji kullan ama abartma
- Dil: Müşteri Türkçe yazarsa Türkçe, İngilizce yazarsa İngilizce yanıt ver`;

function buildMessages(history, newMessage) {
  const messages = [{ role: 'system', content: SYSTEM_PROMPT }];
  for (const row of history) {
    messages.push({ role: row.role, content: row.content });
  }
  messages.push({ role: 'user', content: newMessage });
  return messages;
}

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

async function getCommentReply(commentText) {
  try {
    const messages = [
      {
        role: 'system',
        content: `Sen KISCHE'nin Instagram hesabısın (kische.com.tr). Gelen yoruma samimi, enerjik ve satış odaklı kısa bir cevap yaz. Yorumcuyu siteye çekmeye çalış. Maksimum 150 karakter. Emoji kullan. Müşteri hangi dili kullandıysa o dilde yanıtla.`,
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
    if (reply.length > 150) reply = reply.substring(0, 147) + '...';
    return reply;
  } catch (err) {
    console.error('[openai] getCommentReply hatası:', err.message);
    throw err;
  }
}

async function analyzeSentiment(text) {
  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'Aşağıdaki metni analiz et. Sadece JSON döndür: {"negative": true/false, "score": 0-10}. score 7+ ise negative true olsun.',
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
