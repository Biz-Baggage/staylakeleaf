-- Restrict SECURITY DEFINER helper functions.
-- has_role / is_admin are used inside RLS policies for authenticated users only.
-- They should NEVER be callable by anonymous visitors, and never by PUBLIC.
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- get_reserved_ranges is intentionally public (calendar reserved-day markers,
-- returns only dates, no PII). Keep it callable by anon and authenticated,
-- but drop the implicit PUBLIC grant so only those two named roles can call it.
REVOKE ALL ON FUNCTION public.get_reserved_ranges() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_reserved_ranges() TO anon, authenticated;