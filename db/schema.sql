-- Konuşma geçmişi tablosu
CREATE TABLE IF NOT EXISTS conversations (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    TEXT    NOT NULL,
  role       TEXT    NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
  content    TEXT    NOT NULL,
  created_at DATETIME DEFAULT (datetime('now'))
);

-- Sorgularda user_id + tarih sıklıkla kullanılacak
CREATE INDEX IF NOT EXISTS idx_conversations_user_id
  ON conversations(user_id, created_at DESC);

-- İnsan devri durumlarını tutan tablo
CREATE TABLE IF NOT EXISTS handoffs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     TEXT    NOT NULL,
  trigger_msg TEXT    NOT NULL,
  notified_at DATETIME DEFAULT (datetime('now')),
  resolved    INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_handoffs_user_id
  ON handoffs(user_id);
