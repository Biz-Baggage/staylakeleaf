
-- Public function returning only reserved date ranges (no PII) for the homepage calendar.
CREATE OR REPLACE FUNCTION public.get_reserved_ranges()
RETURNS TABLE(check_in date, check_out date)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT check_in, check_out
  FROM public.bookings
  WHERE status IN ('new', 'contacted', 'confirmed')
    AND check_out >= current_date;
$$;

GRANT EXECUTE ON FUNCTION public.get_reserved_ranges() TO anon, authenticated;

-- Allow any authenticated user (non-admins included) to read bookings for a read-only view.
CREATE POLICY "bookings authenticated read"
  ON public.bookings FOR SELECT
  TO authenticated
  USING (true);
