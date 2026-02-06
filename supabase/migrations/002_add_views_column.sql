-- Add views column to bugs table
ALTER TABLE bugs ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;

-- Add views column to solutions table
ALTER TABLE solutions ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;
