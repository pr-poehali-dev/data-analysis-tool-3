
CREATE TABLE escrow_transactions (
    id SERIAL PRIMARY KEY,
    chat_id VARCHAR(100),
    recommendation_id VARCHAR(100),
    request_name VARCHAR(500) NOT NULL,
    tenant_email VARCHAR(255) NOT NULL,
    tenant_name VARCHAR(255) NOT NULL,
    recommender_email VARCHAR(255) NOT NULL,
    recommender_name VARCHAR(255) NOT NULL,
    rent_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    commission_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'frozen', 'completed', 'cancelled', 'refunded')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL
);

CREATE INDEX idx_escrow_tenant_email ON escrow_transactions(tenant_email);
CREATE INDEX idx_escrow_recommender_email ON escrow_transactions(recommender_email);
CREATE INDEX idx_escrow_status ON escrow_transactions(status);
