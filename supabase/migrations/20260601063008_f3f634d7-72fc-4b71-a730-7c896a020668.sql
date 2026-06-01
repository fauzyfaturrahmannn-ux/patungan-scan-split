
-- 1) Tighten rooms SELECT: only host or existing members
DROP POLICY IF EXISTS "view_rooms" ON public.rooms;
DROP POLICY IF EXISTS "Anyone can find room by code" ON public.rooms;
DROP POLICY IF EXISTS "Room members can view room" ON public.rooms;

CREATE POLICY "view_rooms_host_or_member"
ON public.rooms
FOR SELECT
TO authenticated
USING (
  auth.uid() = host_id
  OR public.is_room_member(id, auth.uid())
);

-- 2) Safe code-lookup RPC so users can find a room to join without broad SELECT
CREATE OR REPLACE FUNCTION public.get_room_by_code(_code text)
RETURNS TABLE (id uuid, code text, name text, place_name text)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT r.id, r.code, r.name, r.place_name
  FROM public.rooms r
  WHERE r.code = upper(_code)
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_room_by_code(text) FROM public;
GRANT EXECUTE ON FUNCTION public.get_room_by_code(text) TO authenticated;

-- 3) Prevent members from self-verifying payments via a BEFORE trigger.
--    Only the room host may set status='paid' or populate verified_at.
CREATE OR REPLACE FUNCTION public.enforce_payment_verification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_host boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.rooms
    WHERE id = NEW.room_id AND host_id = auth.uid()
  ) INTO v_is_host;

  IF NOT v_is_host THEN
    -- Members cannot mark themselves paid or verified
    IF NEW.status = 'paid' THEN
      NEW.status := 'pending';
    END IF;
    NEW.verified_at := NULL;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_payment_verification_trg ON public.payments;
CREATE TRIGGER enforce_payment_verification_trg
BEFORE INSERT OR UPDATE ON public.payments
FOR EACH ROW EXECUTE FUNCTION public.enforce_payment_verification();

-- 4) Realtime authorization: scope channel subscriptions to room members.
--    Channels are named "room-<uuid>" in the client.
DROP POLICY IF EXISTS "room_members_can_read_realtime" ON realtime.messages;
CREATE POLICY "room_members_can_read_realtime"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  realtime.topic() LIKE 'room-%'
  AND public.is_room_member(
    NULLIF(substring(realtime.topic() from 6), '')::uuid,
    auth.uid()
  )
);
