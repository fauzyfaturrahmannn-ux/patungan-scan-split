-- Add payment info columns to rooms
ALTER TABLE public.rooms ADD COLUMN payment_bank text;
ALTER TABLE public.rooms ADD COLUMN payment_account_number text;
ALTER TABLE public.rooms ADD COLUMN payment_account_name text;

-- Fix rooms SELECT policy: allow any authenticated user to view rooms
-- This is needed so members can find rooms by code when joining
DROP POLICY IF EXISTS "view_rooms" ON public.rooms;
CREATE POLICY "view_rooms" ON public.rooms
  FOR SELECT TO authenticated
  USING (true);

-- Fix room_members SELECT policy: allow all room members to see each other
DROP POLICY IF EXISTS "view_members" ON public.room_members;
CREATE POLICY "view_members" ON public.room_members
  FOR SELECT TO authenticated
  USING (is_room_member(room_id, auth.uid()) OR (EXISTS (
    SELECT 1 FROM rooms WHERE rooms.id = room_members.room_id AND rooms.host_id = auth.uid()
  )));