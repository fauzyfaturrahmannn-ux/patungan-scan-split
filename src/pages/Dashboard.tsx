import { Button } from "@/components/ui/button";
import { Plus, Clock, Users, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const mockRooms = [
  { id: "ABCD123", name: "Patungan Solaria Jumat", place: "Solaria Grand Indonesia", date: "11 Apr 2026", members: 5, total: 485000, status: "active" },
  { id: "EFGH456", name: "Makan Siang Kantor", place: "Padang Sederhana", date: "9 Apr 2026", members: 4, total: 320000, status: "completed" },
  { id: "IJKL789", name: "Boba Time", place: "Kokumi PIK", date: "5 Apr 2026", members: 3, total: 156000, status: "completed" },
];

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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
              <span className="text-accent-foreground text-sm font-semibold">A</span>
            </div>
          </div>
        </div>
      </header>

      <div className="container py-8">
        {/* Welcome */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display font-bold text-2xl text-foreground">Halo, Andi! 👋</h1>
            <p className="text-muted-foreground text-sm mt-1">Kelola semua patunganmu di sini.</p>
          </div>
          <Button className="gap-2 shadow-primary" onClick={() => navigate("/create-room")}>
            <Plus size={18} /> Buat Patungan
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Room", value: "12", icon: Users },
            { label: "Room Aktif", value: "1", icon: Clock },
            { label: "Total Transaksi", value: "Rp2.4jt", icon: ArrowRight },
            { label: "Teman", value: "18", icon: Users },
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

        {/* Rooms */}
        <h2 className="font-display font-semibold text-lg text-foreground mb-4">Riwayat Patungan</h2>
        <div className="space-y-3">
          {mockRooms.map((room) => (
            <div
              key={room.id}
              className="glass-card rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:shadow-lg transition-all cursor-pointer"
              onClick={() => navigate(`/room/${room.id}`)}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-display font-semibold text-foreground">{room.name}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${room.status === "active" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
                    {room.status === "active" ? "Aktif" : "Selesai"}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{room.place} · {room.date}</p>
              </div>
              <div className="text-right">
                <p className="font-display font-bold text-foreground">Rp{room.total.toLocaleString("id-ID")}</p>
                <p className="text-xs text-muted-foreground">{room.members} orang</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
