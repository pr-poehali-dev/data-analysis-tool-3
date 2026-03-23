CREATE TABLE IF NOT EXISTS t_p66037117_data_analysis_tool_3.feedback_messages (
    id          serial PRIMARY KEY,
    email       varchar(255) NOT NULL,
    subject_type varchar(100) NOT NULL DEFAULT 'Вопрос',
    message     text NOT NULL,
    status      varchar(20) NOT NULL DEFAULT 'new',
    admin_reply text NULL,
    replied_at  timestamp NULL,
    created_at  timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);