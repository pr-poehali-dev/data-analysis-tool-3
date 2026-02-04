-- Создание таблицы отзывов между участниками сделок
CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    chat_id VARCHAR(255) NOT NULL,
    recommendation_id VARCHAR(255) NOT NULL,
    reviewer_email VARCHAR(255) NOT NULL,
    reviewer_name VARCHAR(255) NOT NULL,
    reviewee_email VARCHAR(255) NOT NULL,
    reviewee_name VARCHAR(255) NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(chat_id, reviewer_email)
);

-- Индексы для быстрого поиска
CREATE INDEX idx_reviews_reviewee_email ON reviews(reviewee_email);
CREATE INDEX idx_reviews_chat_id ON reviews(chat_id);
CREATE INDEX idx_reviews_recommendation_id ON reviews(recommendation_id);
CREATE INDEX idx_reviews_created_at ON reviews(created_at DESC);