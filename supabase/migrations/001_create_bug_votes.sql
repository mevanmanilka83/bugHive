-- Create bug_votes table to track user votes on bugs
CREATE TABLE IF NOT EXISTS bug_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bug_id UUID NOT NULL REFERENCES bugs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(bug_id, user_id) -- One vote per user per bug
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_bug_votes_bug_id ON bug_votes(bug_id);
CREATE INDEX IF NOT EXISTS idx_bug_votes_user_id ON bug_votes(user_id);

-- Add vote count columns to bugs table (for performance)
ALTER TABLE bugs ADD COLUMN IF NOT EXISTS upvotes_count INTEGER DEFAULT 0;
ALTER TABLE bugs ADD COLUMN IF NOT EXISTS downvotes_count INTEGER DEFAULT 0;

-- Create function to update vote counts
CREATE OR REPLACE FUNCTION update_bug_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE bugs
  SET 
    upvotes_count = (
      SELECT COUNT(*) FROM bug_votes 
      WHERE bug_id = COALESCE(NEW.bug_id, OLD.bug_id) 
      AND vote_type = 'upvote'
    ),
    downvotes_count = (
      SELECT COUNT(*) FROM bug_votes 
      WHERE bug_id = COALESCE(NEW.bug_id, OLD.bug_id) 
      AND vote_type = 'downvote'
    )
  WHERE id = COALESCE(NEW.bug_id, OLD.bug_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update vote counts
DROP TRIGGER IF EXISTS trigger_update_bug_vote_counts ON bug_votes;
CREATE TRIGGER trigger_update_bug_vote_counts
  AFTER INSERT OR UPDATE OR DELETE ON bug_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_bug_vote_counts();

