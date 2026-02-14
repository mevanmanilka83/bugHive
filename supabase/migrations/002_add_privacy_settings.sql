-- Migration: Add Privacy Settings to Users Table
-- Created: 2026-02-14
-- Description: Adds profile_visibility and show_activity columns to users table

-- Add profile_visibility column (if it doesn't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'profile_visibility'
  ) THEN
    ALTER TABLE users ADD COLUMN profile_visibility text DEFAULT 'public' CHECK (profile_visibility IN ('public', 'private', 'members_only'));
  END IF;
END $$;

-- Add show_activity column (if it doesn't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'show_activity'
  ) THEN
    ALTER TABLE users ADD COLUMN show_activity boolean DEFAULT true;
  END IF;
END $$;

-- Create index on profile_visibility for faster queries
CREATE INDEX IF NOT EXISTS idx_users_profile_visibility ON users(profile_visibility);

-- Add comment to document the columns
COMMENT ON COLUMN users.profile_visibility IS 'Controls who can see the user profile: public, private, or members_only';
COMMENT ON COLUMN users.show_activity IS 'Controls whether user activity on bugs and clusters is visible to others';
