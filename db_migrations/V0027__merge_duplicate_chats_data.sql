-- Перенос переписки и сделок из дублирующихся чатов в основной (самый ранний) чат группы.
-- Группы: основной_id <- дубли
--   7  <- 8    (irso62@yandex.ru / kerim.radik@mail.ru / заявка 10)
--   13 <- 21,22 (irso62@yandex.ru / tg_188527463 / заявка 12)
--   4  <- 9    (kerim.radik@mail.ru / irso62@yandex.ru / заявка 6)
--   1  <- 6    (kerimov.radzhi@mail.ru / irso62@yandex.ru / заявка 6)
--   14 <- 15,17 (tg_136945242 / irso62@yandex.ru / заявка 13)
--   18 <- 19   (tg_188527463 / irso62@yandex.ru / заявка 13)

UPDATE messages SET chat_id = 7 WHERE chat_id = 8;
UPDATE messages SET chat_id = 13 WHERE chat_id IN (21, 22);
UPDATE messages SET chat_id = 4 WHERE chat_id = 9;
UPDATE messages SET chat_id = 1 WHERE chat_id = 6;
UPDATE messages SET chat_id = 14 WHERE chat_id IN (15, 17);
UPDATE messages SET chat_id = 18 WHERE chat_id = 19;

UPDATE escrow_transactions SET chat_id = '7' WHERE chat_id = '8';
UPDATE escrow_transactions SET chat_id = '13' WHERE chat_id IN ('21', '22');
UPDATE escrow_transactions SET chat_id = '4' WHERE chat_id = '9';
UPDATE escrow_transactions SET chat_id = '1' WHERE chat_id = '6';
UPDATE escrow_transactions SET chat_id = '14' WHERE chat_id IN ('15', '17');
UPDATE escrow_transactions SET chat_id = '18' WHERE chat_id = '19';

-- Обновляем ссылку на последнее (актуальное) предложение в основном чате
UPDATE chats SET recommendation_id = '11', updated_at = now() WHERE id = 7;
UPDATE chats SET recommendation_id = '23', updated_at = now() WHERE id = 13;
UPDATE chats SET recommendation_id = '7', updated_at = now() WHERE id = 4;
UPDATE chats SET recommendation_id = '9', updated_at = now() WHERE id = 1;
UPDATE chats SET recommendation_id = '18', updated_at = now() WHERE id = 14;
UPDATE chats SET recommendation_id = '20', updated_at = now() WHERE id = 18;

-- Пересчитываем последнее сообщение и время для основных чатов
UPDATE chats c SET
  last_message = (SELECT text FROM messages m WHERE m.chat_id = c.id ORDER BY m.created_at DESC LIMIT 1),
  last_message_time = (SELECT created_at FROM messages m WHERE m.chat_id = c.id ORDER BY m.created_at DESC LIMIT 1)
WHERE c.id IN (7, 13, 4, 1, 14, 18);

-- Скрываем дублирующиеся чаты (данные сохранены, но не отображаются в списках)
UPDATE chats SET is_hidden = TRUE, updated_at = now() WHERE id IN (8, 21, 22, 9, 6, 15, 17, 19);
