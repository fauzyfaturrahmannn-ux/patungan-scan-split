import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check, QrCode, Banknote, Users, Clock } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

const items = [
  { id: 1, name: "Nasi Goreng Spesial", price: 35000, claimedBy: ["Andi"] },
  { id: 2, name: "Chicken Katsu", price: 42000, claimedBy: [] },
  { id: 3, name: "Lemon Tea", price: 18000, claimedBy: ["Andi"] },
  { id: 4, name: "Es Teh Manis", price: 12000, claimedBy: [] },
  { id: 5, name: "French Fries (Share)", price: 28000, claimedBy: ["Andi", "Budi"] },
  { id: 6, name: "Mie Goreng", price: 32000, claimedBy: [] },
];

const members = [
  { name: "Andi", avatar: "A", status: "paid", method: "qris", total: 67100 },
  { name: "Budi", avatar: "B", status: "paid", method: "cash", total: 48300 },
  { name: "Citra", avatar: "C", status: "unpaid", method: null, total: 51750 },
  { name: "Dina", avatar: "D", status: "unpaid", method: null, total: 45600 },
];

const RoomPage = () => {
  const navigate = useNavigate();
  const { roomId } = useParams();
  const [selectedItems, setSelectedItems] = useState<number[]>([1, 3, 5]);
  const [showPayment, setShowPayment] = useState(false);

  const toggleItem = (id: number) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const myTotal = selectedItems.reduce((sum, id) => {
    const item = items.find((i) => i.id === id);
    if (!item) return sum;
    const shared = item.claimedBy.length > 0 ? item.claimedBy.length : 1;
    return sum + item.price / shared;
  }, 0);

  const taxService = myTotal * 0.15;
  const grandTotal = myTotal + taxService;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/dashboard")} className="text-muted-foreground hover:text-foreground">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="font-display font-bold text-sm text-foreground">Patungan Solaria Jumat</h1>
              <p className="text-xs text-muted-foreground">Solaria Grand Indonesia · {roomId}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-xs text-success font-medium">Live</span>
          </div>
        </div>
      </header>

      <div className="container max-w-lg py-6 space-y-6">
        {/* Members */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-semibold text-sm text-foreground flex items-center gap-2">
              <Users size={16} className="text-primary" /> Peserta ({members.length})
            </h2>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {members.map((m) => (
              <div key={m.name} className="flex-shrink-0 flex flex-col items-center gap-1.5">
                <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold border-2 ${m.status === "paid" ? "border-success bg-success/10 text-success" : "border-border bg-muted text-muted-foreground"}`}>
                  {m.avatar}
                </div>
                <span className="text-xs text-foreground font-medium">{m.name}</span>
                {m.status === "paid" && <span className="text-[10px] text-success font-medium">✓ Lunas</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Items */}
        <div>
          <h2 className="font-display font-semibold text-sm text-foreground mb-3">Pilih Pesananmu</h2>
          <div className="space-y-2">
            {items.map((item) => {
              const selected = selectedItems.includes(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => toggleItem(item.id)}
                  className={`w-full glass-card rounded-xl p-3.5 flex items-center justify-between transition-all ${selected ? "ring-2 ring-primary bg-accent/50" : "hover:shadow-md"}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${selected ? "bg-primary" : "bg-muted"}`}>
                      {selected && <Check size={14} className="text-primary-foreground" />}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-foreground">{item.name}</p>
                      {item.claimedBy.length > 1 && (
                        <p className="text-xs text-muted-foreground">Sharing · {item.claimedBy.length} orang</p>
                      )}
                    </div>
                  </div>
                  <p className="font-display font-semibold text-sm text-foreground">
                    Rp{item.price.toLocaleString("id-ID")}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Total */}
        <div className="glass-card rounded-xl p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal pesananmu</span>
            <span className="text-foreground">Rp{Math.round(myTotal).toLocaleString("id-ID")}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tax + Service (15%)</span>
            <span className="text-foreground">Rp{Math.round(taxService).toLocaleString("id-ID")}</span>
          </div>
          <div className="border-t border-border pt-2 flex justify-between">
            <span className="font-display font-bold text-foreground">Total Bayar</span>
            <span className="font-display font-bold text-lg text-primary">Rp{Math.round(grandTotal).toLocaleString("id-ID")}</span>
          </div>
        </div>

        {/* Payment */}
        {!showPayment ? (
          <Button className="w-full gap-2 shadow-primary" size="lg" onClick={() => setShowPayment(true)}>
            Bayar Sekarang
          </Button>
        ) : (
          <div className="space-y-3 animate-fade-up">
            <h2 className="font-display font-semibold text-sm text-foreground">Pilih Metode Pembayaran</h2>
            <div className="grid grid-cols-2 gap-3">
              <button className="glass-card rounded-xl p-5 flex flex-col items-center gap-3 hover:shadow-lg hover:ring-2 hover:ring-primary transition-all">
                <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
                  <QrCode size={24} className="text-accent-foreground" />
                </div>
                <span className="font-display font-semibold text-sm text-foreground">QRIS</span>
                <span className="text-xs text-muted-foreground">Auto verifikasi</span>
              </button>
              <button className="glass-card rounded-xl p-5 flex flex-col items-center gap-3 hover:shadow-lg hover:ring-2 hover:ring-primary transition-all">
                <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
                  <Banknote size={24} className="text-accent-foreground" />
                </div>
                <span className="font-display font-semibold text-sm text-foreground">Cash</span>
                <span className="text-xs text-muted-foreground">Verifikasi host</span>
              </button>
            </div>
          </div>
        )}

        {/* Payment Status */}
        <div>
          <h2 className="font-display font-semibold text-sm text-foreground mb-3 flex items-center gap-2">
            <Clock size={16} className="text-primary" /> Status Pembayaran
          </h2>
          <div className="space-y-2">
            {members.map((m) => (
              <div key={m.name} className="glass-card rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${m.status === "paid" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
                    {m.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{m.name}</p>
                    <p className="text-xs text-muted-foreground">Rp{m.total.toLocaleString("id-ID")}</p>
                  </div>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${m.status === "paid" ? "bg-success/15 text-success" : "bg-warning/15 text-warning"}`}>
                  {m.status === "paid" ? `✓ ${m.method === "qris" ? "QRIS" : "Cash"}` : "Belum bayar"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomPage;
