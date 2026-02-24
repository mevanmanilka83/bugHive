CREATE TABLE IF NOT EXISTS public.saved_graphs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  nodes JSONB NOT NULL DEFAULT '[]'::jsonb,
  edges JSONB NOT NULL DEFAULT '[]'::jsonb,
  origin_bug_id UUID REFERENCES public.bugs(id) ON DELETE SET NULL,
  origin_cluster_id UUID REFERENCES public.clusters(id) ON DELETE SET NULL,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE public.saved_graphs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own saved graphs" ON public.saved_graphs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Public saved graphs are visible to all" ON public.saved_graphs
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can insert their own saved graphs" ON public.saved_graphs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved graphs" ON public.saved_graphs
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved graphs" ON public.saved_graphs
  FOR DELETE USING (auth.uid() = user_id);

-- Update trigger
CREATE TRIGGER trg_saved_graphs_updated_at
  BEFORE UPDATE ON public.saved_graphs
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();
