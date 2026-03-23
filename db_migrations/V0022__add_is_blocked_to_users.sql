ALTER TABLE t_p66037117_data_analysis_tool_3.users
  ADD COLUMN IF NOT EXISTS is_blocked boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS blocked_at timestamp without time zone NULL,
  ADD COLUMN IF NOT EXISTS blocked_reason text NULL;