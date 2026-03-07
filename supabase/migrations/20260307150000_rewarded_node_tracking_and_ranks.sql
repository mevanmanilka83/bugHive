-- 1. rewarded_node_tracking: O(1) duplicate check via unique index (scales vs scanning user_xp_history)
CREATE TABLE IF NOT EXISTS public.rewarded_node_tracking (
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  node_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, node_id)
);

CREATE INDEX IF NOT EXISTS idx_rewarded_node_tracking_user
  ON public.rewarded_node_tracking (user_id);

-- 2. hunter_ranks: single source of truth for rank thresholds (keeps RPC in sync with TS)
CREATE TABLE IF NOT EXISTS public.hunter_ranks (
  id TEXT PRIMARY KEY,
  min_xp INT NOT NULL,
  display_order INT NOT NULL DEFAULT 0
);

INSERT INTO public.hunter_ranks (id, min_xp, display_order) VALUES
  ('larva', 0, 0),
  ('scout', 500, 1),
  ('worker', 2000, 2),
  ('soldier', 5000, 3),
  ('hive_architect', 10000, 4)
ON CONFLICT (id) DO UPDATE SET min_xp = EXCLUDED.min_xp, display_order = EXCLUDED.display_order;

-- 3. Function: get rank id for a given XP value
CREATE OR REPLACE FUNCTION public.get_rank_for_xp(p_xp INT)
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
  SELECT id FROM public.hunter_ranks
  WHERE min_xp <= p_xp
  ORDER BY min_xp DESC
  LIMIT 1;
$$;

-- 4. Backfill rewarded_node_tracking from existing user_xp_history
INSERT INTO public.rewarded_node_tracking (user_id, node_id)
SELECT user_id, jsonb_array_elements_text(metadata->'nodeIds')
FROM public.user_xp_history
WHERE action_type = 'graph_node'
  AND metadata ? 'nodeIds'
  AND jsonb_typeof(metadata->'nodeIds') = 'array'
ON CONFLICT (user_id, node_id) DO NOTHING;
