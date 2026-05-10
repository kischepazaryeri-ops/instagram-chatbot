const { getHistory, saveMessage } = require('../services/memory');
const { buildMessages, getCompletion } = require('../services/openai');
const { sendDM } = require('../services/instagram');
const { shouldHandoff } = require('../utils/rules');
const { notifySlack } = require('../services/handoff');

const HANDOFF_REPLY =
  'Sizi uzman ekibimize yönlendiriyorum, en kısa sürede dönüş yapacağız. 🙏';

// Gelen DM'i işle ve yanıtla
async function handleDM(senderId, messageText) {
  try {
    console.log(`[dmHandler] Gelen DM → ${senderId}: ${messageText}`);

    // İnsan devri kontrolü — kullanıcıya cevap vermeden önce
    const needsHandoff = await shouldHandoff(messageText);

    if (needsHandoff) {
      console.log(`[dmHandler] Handoff tetiklendi → ${senderId}`);

      // Kullanıcıya devir mesajı gönder
      await sendDM(senderId, HANDOFF_REPLY);

      // Slack'e bildir
      await notifySlack(senderId, messageText);

      // Devir mesajını hafızaya kaydet
      await saveMessage(senderId, 'user', messageText);
      await saveMessage(senderId, 'assistant', HANDOFF_REPLY);
      return;
    }

    // Konuşma geçmişini çek
    const history = getHistory(senderId, 10);

    // GPT-4o'ya gönderilecek mesaj dizisini oluştur
    const messages = buildMessages(history, messageText);

    // GPT-4o'dan yanıt al
    const aiReply = await getCompletion(messages);

    // Hafızaya kaydet
    saveMessage(senderId, 'user', messageText);
    saveMessage(senderId, 'assistant', aiReply);

    // Instagram DM olarak gönder
    await sendDM(senderId, aiReply);

    console.log(`[dmHandler] Yanıt gönderildi → ${senderId}`);
  } catch (err) {
    console.error('[dmHandler] handleDM hatası:', err.message);

    // Hata durumunda kullanıcıya genel hata mesajı gönder
    try {
      await sendDM(
        senderId,
        'Üzgünüm, şu an bir sorun yaşıyorum. Lütfen kısa süre sonra tekrar deneyin.'
      );
    } catch (sendErr) {
      console.error('[dmHandler] Hata mesajı gönderilemedi:', sendErr.message);
    }
  }
}

module.exports = { handleDM };
