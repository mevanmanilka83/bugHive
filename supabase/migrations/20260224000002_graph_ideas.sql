CREATE TABLE IF NOT EXISTS public.graph_ideas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  saved_graph_id UUID NOT NULL REFERENCES public.saved_graphs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL DEFAULT 'idea', -- 'idea', 'solution', 'fix'
  title TEXT NOT NULL,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE public.graph_ideas ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view ideas for public graphs or their own graphs" ON public.graph_ideas
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.saved_graphs sg
      WHERE sg.id = graph_ideas.saved_graph_id
      AND (sg.is_public = true OR sg.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can add ideas to their own graphs" ON public.graph_ideas
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.saved_graphs sg
      WHERE sg.id = saved_graph_id AND sg.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own ideas" ON public.graph_ideas
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own ideas" ON public.graph_ideas
  FOR DELETE USING (user_id = auth.uid());

-- Update trigger
CREATE TRIGGER trg_graph_ideas_updated_at
  BEFORE UPDATE ON public.graph_ideas
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();
