
CREATE TABLE chats (
    id SERIAL PRIMARY KEY,
    recommendation_id VARCHAR(255),
    request_id VARCHAR(255),
    request_name VARCHAR(255),
    recommender_email VARCHAR(255) NOT NULL,
    recommender_name VARCHAR(255),
    recommender_photo TEXT,
    recommender_vk_link TEXT,
    tenant_email VARCHAR(255) NOT NULL,
    tenant_name VARCHAR(255),
    tenant_photo TEXT,
    tenant_vk_link TEXT,
    last_message TEXT,
    last_message_time TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chats_recommender_email ON chats(recommender_email);
CREATE INDEX idx_chats_tenant_email ON chats(tenant_email);
CREATE INDEX idx_chats_recommendation_id ON chats(recommendation_id);
CREATE INDEX idx_chats_request_id ON chats(request_id);
CREATE INDEX idx_chats_last_message_time ON chats(last_message_time DESC);

CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    chat_id INTEGER NOT NULL REFERENCES chats(id),
    sender_id VARCHAR(255) NOT NULL,
    sender_name VARCHAR(255),
    sender_photo TEXT,
    text TEXT NOT NULL DEFAULT '',
    photos TEXT[] DEFAULT '{}',
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    is_system_message BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_chat_id ON messages(chat_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(chat_id, created_at);
CREATE INDEX idx_messages_unread ON messages(chat_id, is_read) WHERE is_read = FALSE;
