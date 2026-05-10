const { getCommentReply } = require('../services/openai');
const { replyToComment } = require('../services/instagram');

// Gelen yorumu işle ve yanıtla
async function handleComment(commentId, commentText, mediaId) {
  try {
    console.log(`[commentHandler] Gelen yorum → ${commentId} (media: ${mediaId}): ${commentText}`);

    // GPT-4o ile kısa ve samimi yorum cevabı üret
    const reply = await getCommentReply(commentText);

    // Instagram'da yoruma cevap at
    await replyToComment(commentId, reply);

    console.log(`[commentHandler] Yorum yanıtlandı → ${commentId}`);
  } catch (err) {
    console.error('[commentHandler] handleComment hatası:', err.message);
    // Yorum yanıtlama hatası sessizce geçilir — kullanıcı deneyimini kesmez
  }
}

module.exports = { handleComment };
