-- Добавляем поля фото в таблицу отзывов
ALTER TABLE reviews
    ADD COLUMN IF NOT EXISTS reviewer_photo TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS reviewee_photo TEXT DEFAULT '';
