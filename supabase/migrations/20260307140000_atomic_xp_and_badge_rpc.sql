-- Atomic XP increment and badge append RPC
-- Fixes: lost-update race condition, stale badge overwrites
-- Requires: users (points, badges, current_rank, last_activity_date), user_xp_history

CREATE OR REPLACE FUNCTION public.award_bug_xp_atomic(
  p_user_id UUID,
  p_xp_amount INT,
  p_action_type TEXT,
  p_metadata JSONB DEFAULT '{}'
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

  v_today := (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')::DATE;

  UPDATE public.users
  SET
    points = COALESCE(points, 0) + p_xp_amount,
    current_rank = CASE
      WHEN (COALESCE(points, 0) + p_xp_amount) >= 10000 THEN 'hive_architect'
      WHEN (COALESCE(points, 0) + p_xp_amount) >= 5000 THEN 'soldier'
      WHEN (COALESCE(points, 0) + p_xp_amount) >= 2000 THEN 'worker'
      WHEN (COALESCE(points, 0) + p_xp_amount) >= 500 THEN 'scout'
      ELSE 'larva'
    END,
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

CREATE OR REPLACE FUNCTION public.add_badge_if_missing(
  p_user_id UUID,
  p_badge TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.users
  SET
    badges = array_append(COALESCE(badges, '{}'), p_badge),
    updated_at = NOW()
  WHERE id = p_user_id
    AND (badges IS NULL OR NOT (p_badge = ANY(badges)));

  RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION public.award_bug_xp_atomic(UUID, INT, TEXT, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.add_badge_if_missing(UUID, TEXT) TO service_role;
