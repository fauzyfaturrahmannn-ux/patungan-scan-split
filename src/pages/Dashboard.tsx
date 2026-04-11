import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Clock, Users, ArrowRight, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface RoomRow {
  id: string;
  code: string;
  name: string;
  place_name: string;
  status: string;
  created_at: string;
  host_id: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [rooms, setRooms] = useState<RoomRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRooms = async () => {
      // Rooms where user is host
      const { data: hostRooms } = await supabase
        .from("rooms")
        .select("*")
        .eq("host_id", user!.id)
        .order("created_at", { ascending: false });

      // Rooms where user is member
      const { data: memberRows } = await supabase
        .from("room_members")
        .select("room_id")
        .eq("user_id", user!.id);

      const memberRoomIds = (memberRows || []).map((r) => r.room_id);
      let memberRooms: RoomRow[] = [];
      if (memberRoomIds.length > 0) {
        const { data } = await supabase
          .from("rooms")
          .select("*")
          .in("id", memberRoomIds)
          .order("created_at", { ascending: false });
        memberRooms = (data as RoomRow[]) || [];
      }

      const allRooms = [...(hostRooms || []), ...memberRooms];
      const unique = Array.from(new Map(allRooms.map((r) => [r.id, r])).values());
      setRooms(unique as RoomRow[]);
      setLoading(false);
    };

    if (user) fetchRooms();
  }, [user]);

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-display font-bold text-sm">P</span>
            </div>
            <span className="font-display font-bold text-xl text-foreground">PATUNGAN</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
              <span className="text-accent-foreground text-sm font-semibold">{displayName[0].toUpperCase()}</span>
            </div>
            <button onClick={() => { signOut(); navigate("/"); }} className="text-muted-foreground hover:text-foreground">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <div className="container py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display font-bold text-2xl text-foreground">Halo, {displayName}! 👋</h1>
            <p className="text-muted-foreground text-sm mt-1">Kelola semua patunganmu di sini.</p>
          </div>
          <Button className="gap-2 shadow-primary" onClick={() => navigate("/create-room")}>
            <Plus size={18} /> Buat Patungan
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total Room", value: String(rooms.length), icon: Users },
            { label: "Room Aktif", value: String(rooms.filter((r) => r.status === "active").length), icon: Clock },
            { label: "Selesai", value: String(rooms.filter((r) => r.status === "completed").length), icon: ArrowRight },
          ].map((s, i) => (
            <div key={i} className="glass-card rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <s.icon size={16} className="text-primary" />
                <span className="text-xs text-muted-foreground">{s.label}</span>
              </div>
              <p className="font-display font-bold text-xl text-foreground">{s.value}</p>
            </div>
          ))}
        </div>

        <h2 className="font-display font-semibold text-lg text-foreground mb-4">Riwayat Patungan</h2>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Memuat...</div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">Belum ada patungan. Buat yang pertama!</p>
            <Button onClick={() => navigate("/create-room")} className="gap-2">
              <Plus size={18} /> Buat Patungan
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {rooms.map((room) => (
              <div
                key={room.id}
                className="glass-card rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:shadow-lg transition-all cursor-pointer"
                onClick={() => navigate(`/room/${room.code}`)}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-display font-semibold text-foreground">{room.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${room.status === "active" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
                      {room.status === "active" ? "Aktif" : "Selesai"}
                    </span>
                    {room.host_id === user?.id && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-primary/15 text-primary">Host</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {room.place_name} · {new Date(room.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm text-muted-foreground">{room.code}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
