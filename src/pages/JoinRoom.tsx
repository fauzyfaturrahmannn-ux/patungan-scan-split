import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const JoinRoom = () => {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const joinRoom = async () => {
      if (!user || !roomCode) return;

      // Find room by code via a safe RPC (rooms table is restricted to host/members)
      const { data: roomRows, error: roomErr } = await supabase
        .rpc("get_room_by_code", { _code: roomCode });

      const room = Array.isArray(roomRows) ? roomRows[0] : roomRows;
      if (roomErr || !room) {
        toast.error("Room tidak ditemukan");
        navigate("/dashboard");
        return;
      }

      // Check if already a member
      const { data: existing } = await supabase
        .from("room_members")
        .select("id")
        .eq("room_id", room.id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (!existing) {
        const displayName = user.user_metadata?.full_name || user.email?.split("@")[0] || "Member";
        await supabase.from("room_members").insert({
          room_id: room.id,
          user_id: user.id,
          display_name: displayName,
        });
        toast.success("Berhasil join room!");
      }

      navigate(`/room/${roomCode}`);
    };

    joinRoom();
  }, [user, roomCode, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  );
};

export default JoinRoom;
