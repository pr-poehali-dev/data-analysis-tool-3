ALTER TABLE t_p66037117_data_analysis_tool_3.requests ADD COLUMN IF NOT EXISTS tz VARCHAR(64);
ALTER TABLE t_p66037117_data_analysis_tool_3.recommendations ADD COLUMN IF NOT EXISTS tz VARCHAR(64);
ALTER TABLE t_p66037117_data_analysis_tool_3.feedback_messages ADD COLUMN IF NOT EXISTS tz VARCHAR(64);
ALTER TABLE t_p66037117_data_analysis_tool_3.escrow_transactions ADD COLUMN IF NOT EXISTS tz VARCHAR(64);
ALTER TABLE t_p66037117_data_analysis_tool_3.reviews ADD COLUMN IF NOT EXISTS tz VARCHAR(64);
ALTER TABLE t_p66037117_data_analysis_tool_3.users ADD COLUMN IF NOT EXISTS tz VARCHAR(64);