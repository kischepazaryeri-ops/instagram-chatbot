require('dotenv').config();
const path = require('path');
const fs = require('fs');
const cron = require('node-cron');
const initSqlJs = require('sql.js');

const DB_PATH = path.join(__dirname, '../../db/chatbot.sqlite');

let db = null;

// Veritabanını başlat
async function initDB() {
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS handoffs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      trigger_msg TEXT NOT NULL,
      notified_at DATETIME DEFAULT (datetime('now')),
      resolved INTEGER DEFAULT 0
    )
  `);

  saveDB();
  console.log('[memory] Veritabanı hazır');
}

// Değişiklikleri diske yaz
function saveDB() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  fs.writeFileSync(DB_PATH, buffer);
}

// Kullanıcının son N mesajını döndür
function getHistory(userId, limit = 10) {
  if (!db) return [];
  const stmt = db.prepare(
    `SELECT role, content FROM conversations
     WHERE user_id = ?
     ORDER BY created_at DESC
     LIMIT ?`
  );
  stmt.bind([userId, limit]);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows.reverse();
}

// Yeni mesajı kaydet
function saveMessage(userId, role, content) {
  if (!db) return;
  db.run(
    `INSERT INTO conversations (user_id, role, content) VALUES (?, ?, ?)`,
    [userId, role, content]
  );
  saveDB();
}

// 30 günden eski kayıtları temizle — her gece 02:00'de
cron.schedule('0 2 * * *', () => {
  try {
    if (!db) return;
    db.run(`DELETE FROM conversations WHERE created_at < datetime('now', '-30 days')`);
    saveDB();
    console.log('[memory] Eski kayıtlar temizlendi');
  } catch (err) {
    console.error('[memory] Temizleme hatası:', err.message);
  }
});

// Uygulama başlarken DB'yi başlat
initDB().catch((err) => console.error('[memory] DB başlatma hatası:', err.message));

module.exports = { getHistory, saveMessage };
