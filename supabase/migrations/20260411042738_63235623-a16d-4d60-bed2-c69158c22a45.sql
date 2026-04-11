
-- Function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Rooms table
CREATE TABLE public.rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE DEFAULT upper(substring(md5(random()::text) from 1 for 7)),
  host_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  place_name TEXT NOT NULL,
  tax_percent NUMERIC NOT NULL DEFAULT 10,
  service_percent NUMERIC NOT NULL DEFAULT 5,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  receipt_image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

-- Room items
CREATE TABLE public.room_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  qty INTEGER NOT NULL DEFAULT 1,
  price NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.room_items ENABLE ROW LEVEL SECURITY;

-- Room members
CREATE TABLE public.room_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(room_id, user_id)
);

ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;

-- Member item selections
CREATE TABLE public.member_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.room_members(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.room_items(id) ON DELETE CASCADE,
  UNIQUE(member_id, item_id)
);

ALTER TABLE public.member_items ENABLE ROW LEVEL SECURITY;

-- Payments
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.room_members(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  method TEXT NOT NULL DEFAULT 'unpaid' CHECK (method IN ('unpaid', 'cash', 'qris')),
  status TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'pending', 'paid')),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Triggers
CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON public.rooms FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies

-- Rooms: members can view, host can manage
CREATE POLICY "Room members can view room" ON public.rooms FOR SELECT USING (
  auth.uid() = host_id OR EXISTS (SELECT 1 FROM public.room_members WHERE room_id = id AND user_id = auth.uid())
);
CREATE POLICY "Anyone authenticated can create rooms" ON public.rooms FOR INSERT WITH CHECK (auth.uid() = host_id);
CREATE POLICY "Host can update room" ON public.rooms FOR UPDATE USING (auth.uid() = host_id);
CREATE POLICY "Host can delete room" ON public.rooms FOR DELETE USING (auth.uid() = host_id);

-- Room items: viewable by room members, manageable by host
CREATE POLICY "Room members can view items" ON public.room_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.rooms WHERE id = room_id AND (host_id = auth.uid() OR EXISTS (SELECT 1 FROM public.room_members rm WHERE rm.room_id = room_items.room_id AND rm.user_id = auth.uid())))
);
CREATE POLICY "Host can manage items" ON public.room_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.rooms WHERE id = room_id AND host_id = auth.uid())
);
CREATE POLICY "Host can update items" ON public.room_items FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.rooms WHERE id = room_id AND host_id = auth.uid())
);
CREATE POLICY "Host can delete items" ON public.room_items FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.rooms WHERE id = room_id AND host_id = auth.uid())
);

-- Room members: viewable by room members, anyone can join
CREATE POLICY "Room members can view members" ON public.room_members FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.rooms WHERE id = room_id AND (host_id = auth.uid() OR EXISTS (SELECT 1 FROM public.room_members rm2 WHERE rm2.room_id = room_members.room_id AND rm2.user_id = auth.uid())))
);
CREATE POLICY "Authenticated users can join rooms" ON public.room_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Members can leave" ON public.room_members FOR DELETE USING (auth.uid() = user_id);

-- Member items: viewable by room members, manageable by the member
CREATE POLICY "Room members can view selections" ON public.member_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.room_members rm WHERE rm.id = member_id AND (rm.user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.rooms WHERE id = room_id AND host_id = auth.uid())))
);
CREATE POLICY "Members can select items" ON public.member_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.room_members rm WHERE rm.id = member_id AND rm.user_id = auth.uid())
);
CREATE POLICY "Members can deselect items" ON public.member_items FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.room_members rm WHERE rm.id = member_id AND rm.user_id = auth.uid())
);

-- Payments: viewable by room members, manageable by member/host
CREATE POLICY "Room members can view payments" ON public.payments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.room_members rm WHERE rm.id = member_id AND (rm.user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.rooms WHERE id = room_id AND host_id = auth.uid())))
);
CREATE POLICY "Members can create payment" ON public.payments FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.room_members rm WHERE rm.id = member_id AND rm.user_id = auth.uid())
);
CREATE POLICY "Member or host can update payment" ON public.payments FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.room_members rm WHERE rm.id = member_id AND rm.user_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM public.rooms WHERE id = room_id AND host_id = auth.uid())
);

-- Allow anyone authenticated to look up a room by code (for joining)
CREATE POLICY "Anyone can find room by code" ON public.rooms FOR SELECT USING (auth.uid() IS NOT NULL);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.member_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;
