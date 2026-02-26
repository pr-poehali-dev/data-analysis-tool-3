CREATE TABLE recommendations (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    request_id VARCHAR(50),
    request_name VARCHAR(255),
    owner_email VARCHAR(255) NOT NULL,
    invite_message TEXT,
    address TEXT,
    coordinates_lat DOUBLE PRECISION,
    coordinates_lng DOUBLE PRECISION,
    area VARCHAR(50),
    floor VARCHAR(50),
    total_floors VARCHAR(50),
    rooms VARCHAR(50),
    has_furniture BOOLEAN DEFAULT FALSE,
    has_appliances BOOLEAN DEFAULT FALSE,
    rent VARCHAR(255),
    property_comments TEXT,
    photos TEXT[] DEFAULT '{}',
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_recommendations_user_id ON recommendations(user_id);
CREATE INDEX idx_recommendations_request_id ON recommendations(request_id);
CREATE INDEX idx_recommendations_owner_email ON recommendations(owner_email);
CREATE INDEX idx_recommendations_status ON recommendations(status);