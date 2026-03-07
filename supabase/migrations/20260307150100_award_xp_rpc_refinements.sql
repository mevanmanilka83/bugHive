-- 1. Update award_bug_xp_atomic: timezone for last_activity_date, ranks from hunter_ranks table
CREATE OR REPLACE FUNCTION public.award_bug_xp_atomic(
  p_user_id UUID,
  p_xp_amount INT,
  p_action_type TEXT,
  p_metadata JSONB DEFAULT '{}',
  p_timezone_offset_minutes INT DEFAULT NULL
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_today DATE;
BEGIN
  IF p_xp_amount <= 0 THEN
    RETURN 0;
  END IF;

  -- last_activity_date in user's local timezone when offset provided
  IF p_timezone_offset_minutes IS NOT NULL THEN
    v_today := (
      (CURRENT_TIMESTAMP AT TIME ZONE 'UTC') +
      (p_timezone_offset_minutes || ' minutes')::interval
    )::date;
  ELSE
    v_today := (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')::date;
  END IF;

  UPDATE public.users
  SET
    points = COALESCE(points, 0) + p_xp_amount,
    current_rank = public.get_rank_for_xp(COALESCE(points, 0) + p_xp_amount),
    last_activity_date = v_today,
    updated_at = NOW()
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  INSERT INTO public.user_xp_history (user_id, action_type, xp_amount, metadata)
  VALUES (p_user_id, p_action_type, p_xp_amount, p_metadata);

  RETURN p_xp_amount;
END;
$$;

-- 2. award_graph_node_xp_atomic: INSERT ... ON CONFLICT DO NOTHING, award XP only for new nodes
CREATE OR REPLACE FUNCTION public.award_graph_node_xp_atomic(
  p_user_id UUID,
  p_node_ids TEXT[],
  p_graph_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}',
  p_timezone_offset_minutes INT DEFAULT NULL
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_new_count INT;
  v_xp_per_node INT := 20;
  v_xp INT;
  v_new_node_ids JSONB;
BEGIN
  IF p_node_ids IS NULL OR array_length(p_node_ids, 1) IS NULL THEN
    RETURN 0;
  END IF;

  WITH inserted AS (
    INSERT INTO public.rewarded_node_tracking (user_id, node_id)
    SELECT p_user_id, unnest(p_node_ids)
    ON CONFLICT (user_id, node_id) DO NOTHING
    RETURNING node_id
  )
  SELECT COUNT(*)::INT, COALESCE(jsonb_agg(node_id), '[]'::jsonb) INTO v_new_count, v_new_node_ids
  FROM inserted;

  IF v_new_count <= 0 THEN
    RETURN 0;
  END IF;

  v_xp := v_new_count * v_xp_per_node;

  RETURN public.award_bug_xp_atomic(
    p_user_id,
    v_xp,
    'graph_node',
    p_metadata || jsonb_build_object('nodeIds', v_new_node_ids, 'graphId', p_graph_id),
    p_timezone_offset_minutes
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.award_bug_xp_atomic(UUID, INT, TEXT, JSONB, INT) TO service_role;
GRANT EXECUTE ON FUNCTION public.award_graph_node_xp_atomic(UUID, TEXT[], UUID, JSONB, INT) TO service_role;
