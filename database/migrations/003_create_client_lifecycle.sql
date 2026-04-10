-- Migration: Create client lifecycle tracking table
-- Description: Track client lifecycle stage transitions and history
-- Version: 4

CREATE TABLE IF NOT EXISTS client_lifecycle_transitions (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL,
    from_stage VARCHAR(50) NOT NULL,
    to_stage VARCHAR(50) NOT NULL,
    reason TEXT,
    initiated_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT fk_lifecycle_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    CONSTRAINT chk_valid_from_stage CHECK (from_stage IN ('prospect', 'lead', 'active', 'inactive', 'archived')),
    CONSTRAINT chk_valid_to_stage CHECK (to_stage IN ('prospect', 'lead', 'active', 'inactive', 'archived'))
);

-- Create indexes for common queries
CREATE INDEX idx_client_lifecycle_client_id ON client_lifecycle_transitions(client_id);
CREATE INDEX idx_client_lifecycle_created_at ON client_lifecycle_transitions(created_at);
CREATE INDEX idx_client_lifecycle_stage_pair ON client_lifecycle_transitions(from_stage, to_stage);

-- Add lifecycle stage column to clients table if not exists
-- (The column should already exist as 'status', but we'll ensure it's set correctly)
ALTER TABLE clients 
MODIFY COLUMN status ENUM('prospect', 'lead', 'active', 'inactive', 'archived') DEFAULT 'prospect';

-- Create view for lifecycle analytics
CREATE OR REPLACE VIEW client_lifecycle_summary AS
SELECT 
    c.id,
    c.name,
    c.status as current_stage,
    COUNT(clt.id) as total_transitions,
    MAX(clt.created_at) as last_transition,
    MIN(clt.created_at) as first_transition,
    EXTRACT(DAY FROM NOW() - MAX(clt.created_at)) as days_since_transition,
    EXTRACT(DAY FROM NOW() - c.created_at) as days_as_client
FROM clients c
LEFT JOIN client_lifecycle_transitions clt ON c.id = clt.client_id
GROUP BY c.id, c.name, c.status;

-- Create view for stage distribution
CREATE OR REPLACE VIEW client_stage_distribution AS
SELECT 
    status as stage,
    COUNT(*) as client_count,
    ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM clients), 2) as percentage
FROM clients
GROUP BY status
ORDER BY client_count DESC;
