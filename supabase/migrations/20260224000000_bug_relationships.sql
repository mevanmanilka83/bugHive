CREATE TABLE IF NOT EXISTS public.bug_relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_id UUID NOT NULL REFERENCES public.bugs(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES public.bugs(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL,
  confidence NUMERIC NOT NULL DEFAULT 1.0,
  origin TEXT NOT NULL DEFAULT 'manual', -- 'manual', 'ai', 'imported'
  evidence_ref TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(source_id, target_id, relationship_type)
);

-- Index for graph traversals
CREATE INDEX IF NOT EXISTS idx_bug_relationships_source ON public.bug_relationships(source_id);
CREATE INDEX IF NOT EXISTS idx_bug_relationships_target ON public.bug_relationships(target_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trg_bug_relationships_updated_at ON public.bug_relationships;
CREATE TRIGGER trg_bug_relationships_updated_at
  BEFORE UPDATE ON public.bug_relationships
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();
