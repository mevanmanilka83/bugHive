-- Remove old 4-param overload; keep only the 5-param version with timezone support
DROP FUNCTION IF EXISTS public.award_bug_xp_atomic(UUID, INT, TEXT, JSONB);
