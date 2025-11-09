-- Create appearance_preferences table
CREATE TABLE IF NOT EXISTS appearance_preferences (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  theme VARCHAR(20) DEFAULT 'system',
  color_scheme VARCHAR(20) DEFAULT 'blue',
  view_density VARCHAR(20) DEFAULT 'comfortable',
  language VARCHAR(10) DEFAULT 'en',
  reduced_motion BOOLEAN DEFAULT FALSE,
  high_contrast BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_appearance_preferences_user_id ON appearance_preferences(user_id);
