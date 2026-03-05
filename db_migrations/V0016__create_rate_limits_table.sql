
CREATE TABLE t_p66037117_data_analysis_tool_3.rate_limits (
    id BIGSERIAL PRIMARY KEY,
    key VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rate_limits_lookup 
    ON t_p66037117_data_analysis_tool_3.rate_limits (key, action, created_at);

CREATE INDEX idx_rate_limits_cleanup 
    ON t_p66037117_data_analysis_tool_3.rate_limits (created_at);
