-- Добавляем признак "скрытый" чат — используется для дублей, объединённых в основной диалог.
ALTER TABLE chats ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS idx_chats_is_hidden ON chats(is_hidden);
