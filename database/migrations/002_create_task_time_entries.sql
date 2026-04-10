-- Migration: Create task_time_entries table
-- Description: Add time tracking functionality to tasks
-- Version: 3

CREATE TABLE IF NOT EXISTS task_time_entries (
    id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    hours_worked DECIMAL(5, 2) NOT NULL,
    notes TEXT,
    billable BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT fk_task_time_entries_task FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    CONSTRAINT chk_hours_worked CHECK (hours_worked > 0 AND hours_worked <= 24)
);

-- Create indexes for common queries
CREATE INDEX idx_task_time_entries_task_id ON task_time_entries(task_id);
CREATE INDEX idx_task_time_entries_user_id ON task_time_entries(user_id);
CREATE INDEX idx_task_time_entries_date ON task_time_entries(date);
CREATE INDEX idx_task_time_entries_user_date ON task_time_entries(user_id, date);
CREATE INDEX idx_task_time_entries_billable ON task_time_entries(billable);

-- Create a view for quick summaries
CREATE OR REPLACE VIEW task_time_summary AS
SELECT 
    task_id,
    user_id,
    COUNT(*) as entries_count,
    SUM(hours_worked) as total_hours,
    SUM(CASE WHEN billable = true THEN hours_worked ELSE 0 END) as billable_hours,
    SUM(CASE WHEN billable = false THEN hours_worked ELSE 0 END) as non_billable_hours,
    MIN(date) as first_entry,
    MAX(date) as last_entry
FROM task_time_entries
GROUP BY task_id, user_id;

-- Create a view for daily summaries
CREATE OR REPLACE VIEW daily_time_summary AS
SELECT 
    user_id,
    date,
    COUNT(*) as entries_count,
    SUM(hours_worked) as total_hours,
    SUM(CASE WHEN billable = true THEN hours_worked ELSE 0 END) as billable_hours,
    COUNT(DISTINCT task_id) as tasks_worked_on
FROM task_time_entries
GROUP BY user_id, date
ORDER BY date DESC;
