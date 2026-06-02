import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check, QrCode, Banknote, Users, Clock, Share2, CreditCard } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Room {
  id: string;
  code: string;
  name: string;
  place_name: string;
  host_id: string;
  tax_percent: number;
  service_percent: number;
  status: string;
  payment_bank: string | null;
  payment_account_number: string | null;
  payment_account_name: string | null;
}

interface Item {
  id: string;
  name: string;
  qty: number;
  price: number;
}

interface Member {
  id: string;
  user_id: string;
  display_name: string;
}

interface MemberItem {
  id: string;
  member_id: string;
  item_id: string;
}

interface Payment {
  id: string;
  member_id: string;
  amount: number;
  method: string;
  status: string;
}

const RoomPage = () => {
  const navigate = useNavigate();
  const { roomCode } = useParams();
  const { user } = useAuth();
  const [room, setRoom] = useState<Room | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [memberItems, setMemberItems] = useState<MemberItem[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [showTransferConfirm, setShowTransferConfirm] = useState(false);

  const myMember = members.find((m) => m.user_id === user?.id);
  const isHost = room?.host_id === user?.id;

  const fetchData = useCallback(async () => {
    if (!roomCode) return;
    const { data: roomData } = await supabase.from("rooms").select("*").eq("code", roomCode).single();
    if (!roomData) { navigate("/dashboard"); return; }
    setRoom(roomData as unknown as Room);

    const [itemsRes, membersRes, miRes, payRes] = await Promise.all([
      supabase.from("room_items").select("*").eq("room_id", roomData.id),
      supabase.from("room_members").select("*").eq("room_id", roomData.id),
      supabase.from("member_items").select("*").eq("room_id", roomData.id),
      supabase.from("payments").select("*").eq("room_id", roomData.id),
    ]);

    setItems((itemsRes.data || []) as Item[]);
    setMembers((membersRes.data || []) as Member[]);
    setMemberItems((miRes.data || []) as MemberItem[]);
    setPayments((payRes.data || []) as Payment[]);
    setLoading(false);
  }, [roomCode, navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Real-time subscriptions
  useEffect(() => {
    if (!room) return;
    const channel = supabase
      .channel(`room-${room.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "room_members", filter: `room_id=eq.${room.id}` }, () => fetchData())
      .on("postgres_changes", { event: "*", schema: "public", table: "member_items", filter: `room_id=eq.${room.id}` }, () => fetchData())
      .on("postgres_changes", { event: "*", schema: "public", table: "payments", filter: `room_id=eq.${room.id}` }, () => fetchData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [room, fetchData]);

  // Auto-complete room when all members have paid
  const checkAndCompleteRoom = useCallback(async () => {
    if (!room || room.status !== "active" || !isHost) return;
    if (members.length === 0) return;
    
    const allPaid = members.every((m) => {
      const payment = payments.find((p) => p.member_id === m.id);
      return payment?.status === "paid";
    });

    if (allPaid) {
      await supabase.from("rooms").update({ status: "completed" }).eq("id", room.id);
      toast.success("Semua sudah lunas! Room selesai.");
      fetchData();
    }
  }, [room, members, payments, isHost, fetchData]);

  useEffect(() => {
    checkAndCompleteRoom();
  }, [checkAndCompleteRoom]);

  const toggleItem = async (itemId: string) => {
    if (!myMember || !room) return;
    const existing = memberItems.find((mi) => mi.member_id === myMember.id && mi.item_id === itemId);
    if (existing) {
      await supabase.from("member_items").delete().eq("id", existing.id);
    } else {
      await supabase.from("member_items").insert({ room_id: room.id, member_id: myMember.id, item_id: itemId });
    }
    fetchData();
  };

  const getItemClaimers = (itemId: string) => {
    const claimerMemberIds = memberItems.filter((mi) => mi.item_id === itemId).map((mi) => mi.member_id);
    return members.filter((m) => claimerMemberIds.includes(m.id));
  };

  const calcMemberTotal = (memberId: string) => {
    const selected = memberItems.filter((mi) => mi.member_id === memberId);
    let subtotal = 0;
    for (const sel of selected) {
      const item = items.find((i) => i.id === sel.item_id);
      if (!item) continue;
      const claimers = memberItems.filter((mi) => mi.item_id === sel.item_id).length;
      subtotal += (item.price * item.qty) / Math.max(claimers, 1);
    }
    const taxRate = Number(room?.tax_percent || 0) / 100;
    const svcRate = Number(room?.service_percent || 0) / 100;
    return Math.round(subtotal * (1 + taxRate + svcRate));
  };

  const mySelectedIds = myMember ? memberItems.filter((mi) => mi.member_id === myMember.id).map((mi) => mi.item_id) : [];

  const mySubtotal = myMember ? (() => {
    let sub = 0;
    for (const itemId of mySelectedIds) {
      const item = items.find((i) => i.id === itemId);
      if (!item) continue;
      const claimers = memberItems.filter((mi) => mi.item_id === itemId).length;
      sub += (item.price * item.qty) / Math.max(claimers, 1);
    }
    return sub;
  })() : 0;

  const taxRate = Number(room?.tax_percent || 0) / 100;
  const svcRate = Number(room?.service_percent || 0) / 100;
  const myTax = mySubtotal * taxRate;
  const mySvc = mySubtotal * svcRate;
  const myGrandTotal = Math.round(mySubtotal + myTax + mySvc);

  const myPayment = myMember ? payments.find((p) => p.member_id === myMember.id) : null;

  const handlePay = async (method: "cash" | "transfer") => {
    if (!myMember || !room) return;
    if (myPayment) {
      await supabase.from("payments").update({ method, status: "pending", amount: myGrandTotal }).eq("id", myPayment.id);
    } else {
      await supabase.from("payments").insert({
        room_id: room.id,
        member_id: myMember.id,
        amount: myGrandTotal,
        method,
        status: "pending",
      });
    }
    toast.success("Menunggu verifikasi host...");
    fetchData();
  };

  const verifyPayment = async (paymentId: string) => {
    await supabase.from("payments").update({ status: "paid", verified_at: new Date().toISOString() }).eq("id", paymentId);
    toast.success("Pembayaran diverifikasi!");
    fetchData();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!room) return null;

  const isCompleted = room.status === "completed";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/dashboard")} className="text-muted-foreground hover:text-foreground">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="font-display font-bold text-sm text-foreground">{room.name}</h1>
              <p className="text-xs text-muted-foreground">{room.place_name} · {room.code}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/join/${room.code}`);
              toast.success("Link disalin!");
            }} className="text-muted-foreground hover:text-foreground">
              <Share2 size={18} />
            </button>
            <div className="flex items-center gap-1.5">
              {isCompleted ? (
                <>
                  <Check size={14} className="text-success" />
                  <span className="text-xs text-success font-medium">Selesai</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  <span className="text-xs text-success font-medium">Live</span>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container max-w-lg py-6 space-y-6">
        {isCompleted && (
          <div className="bg-success/15 rounded-xl p-4 text-center">
            <p className="text-sm text-success font-medium">Patungan selesai! Semua sudah lunas.</p>
          </div>
        )}

        {/* Payment Info from Host */}
        {room.payment_bank && (
          <div className="glass-card rounded-xl p-4 space-y-2">
            <h2 className="font-display font-semibold text-sm text-foreground flex items-center gap-2">
              <CreditCard size={16} className="text-primary" /> Info Transfer
            </h2>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Bank/E-Wallet</span>
                <span className="text-foreground font-medium">{room.payment_bank}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">No. Rekening/HP</span>
                <span className="text-foreground font-medium font-mono">{room.payment_account_number}</span>
              </div>
              {room.payment_account_name && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Atas Nama</span>
                  <span className="text-foreground font-medium">{room.payment_account_name}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Members */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-semibold text-sm text-foreground flex items-center gap-2">
              <Users size={16} className="text-primary" /> Peserta ({members.length})
            </h2>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {members.map((m) => {
              const payment = payments.find((p) => p.member_id === m.id);
              const isPaid = payment?.status === "paid";
              return (
                <div key={m.id} className="flex-shrink-0 flex flex-col items-center gap-1.5">
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold border-2 ${isPaid ? "border-success bg-success/10 text-success" : "border-border bg-muted text-muted-foreground"}`}>
                    {m.display_name[0].toUpperCase()}
                  </div>
                  <span className="text-xs text-foreground font-medium">{m.display_name.split(" ")[0]}</span>
                  {isPaid && <span className="text-[10px] text-success font-medium">✓ Lunas</span>}
                  {m.user_id === room.host_id && <span className="text-[10px] text-primary font-medium">Host</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Items */}
        <div>
          <h2 className="font-display font-semibold text-sm text-foreground mb-3">Pilih Pesananmu</h2>
          <div className="space-y-2">
            {items.map((item) => {
              const selected = mySelectedIds.includes(item.id);
              const claimers = getItemClaimers(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => !isCompleted && toggleItem(item.id)}
                  disabled={isCompleted}
                  className={`w-full glass-card rounded-xl p-3.5 flex items-center justify-between transition-all ${selected ? "ring-2 ring-primary bg-accent/50" : "hover:shadow-md"} ${isCompleted ? "opacity-70 cursor-default" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${selected ? "bg-primary" : "bg-muted"}`}>
                      {selected && <Check size={14} className="text-primary-foreground" />}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-foreground">{item.name} {item.qty > 1 && `x${item.qty}`}</p>
                      {claimers.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {claimers.length > 1 ? `Sharing · ${claimers.map((c) => c.display_name.split(" ")[0]).join(", ")}` : claimers[0].display_name.split(" ")[0]}
                        </p>
                      )}
                    </div>
                  </div>
                  <p className="font-display font-semibold text-sm text-foreground">
                    Rp{(item.price * item.qty).toLocaleString("id-ID")}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* My Total */}
        {mySelectedIds.length > 0 && (
          <div className="glass-card rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal pesananmu</span>
              <span className="text-foreground">Rp{Math.round(mySubtotal).toLocaleString("id-ID")}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax ({Number(room.tax_percent)}%)</span>
              <span className="text-foreground">Rp{Math.round(myTax).toLocaleString("id-ID")}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Service ({Number(room.service_percent)}%)</span>
              <span className="text-foreground">Rp{Math.round(mySvc).toLocaleString("id-ID")}</span>
            </div>
            <div className="border-t border-border pt-2 flex justify-between">
              <span className="font-display font-bold text-foreground">Total Bayar</span>
              <span className="font-display font-bold text-lg text-primary">Rp{myGrandTotal.toLocaleString("id-ID")}</span>
            </div>
          </div>
        )}

        {/* Payment */}
        {!isCompleted && mySelectedIds.length > 0 && (!myPayment || myPayment.status === "unpaid") && (
          !showPayment ? (
            <Button className="w-full gap-2 shadow-primary" size="lg" onClick={() => setShowPayment(true)}>
              Bayar Sekarang
            </Button>
          ) : (
            <div className="space-y-3 animate-fade-up">
              <h2 className="font-display font-semibold text-sm text-foreground">Pilih Metode Pembayaran</h2>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setShowTransferConfirm(true)} className="glass-card rounded-xl p-5 flex flex-col items-center gap-3 hover:shadow-lg hover:ring-2 hover:ring-primary transition-all">
                  <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
                    <QrCode size={24} className="text-accent-foreground" />
                  </div>
                  <span className="font-display font-semibold text-sm text-foreground">Transfer</span>
                  <span className="text-xs text-muted-foreground">Verifikasi host</span>
                </button>
                <button onClick={() => handlePay("cash")} className="glass-card rounded-xl p-5 flex flex-col items-center gap-3 hover:shadow-lg hover:ring-2 hover:ring-primary transition-all">
                  <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
                    <Banknote size={24} className="text-accent-foreground" />
                  </div>
                  <span className="font-display font-semibold text-sm text-foreground">Cash</span>
                  <span className="text-xs text-muted-foreground">Verifikasi host</span>
                </button>
              </div>
              {showTransferConfirm && (
                <div className="glass-card rounded-xl p-4 space-y-3 animate-fade-up">
                  <div className="space-y-1">
                    <h3 className="font-display font-semibold text-sm text-foreground">Konfirmasi Transfer</h3>
                    <p className="text-xs text-muted-foreground">
                      Pastikan kamu sudah transfer ke rekening host. Setelah konfirmasi, host akan memverifikasi pembayaranmu.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => setShowTransferConfirm(false)}>
                      Batal
                    </Button>
                    <Button className="flex-1" onClick={async () => { await handlePay("transfer"); setShowTransferConfirm(false); }}>
                      Saya sudah transfer
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )
        )}

        {myPayment?.status === "pending" && (
          <div className="bg-warning/15 rounded-xl p-4 text-center">
            <p className="text-sm text-warning font-medium">⏳ Menunggu verifikasi host</p>
          </div>
        )}

        {myPayment?.status === "paid" && (
          <div className="bg-success/15 rounded-xl p-4 text-center">
            <p className="text-sm text-success font-medium">✓ Pembayaran lunas!</p>
          </div>
        )}

        {/* Payment Status */}
        <div>
          <h2 className="font-display font-semibold text-sm text-foreground mb-3 flex items-center gap-2">
            <Clock size={16} className="text-primary" /> Status Pembayaran
          </h2>
          <div className="space-y-2">
            {members.map((m) => {
              const payment = payments.find((p) => p.member_id === m.id);
              const total = calcMemberTotal(m.id);
              return (
                <div key={m.id} className="glass-card rounded-lg p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${payment?.status === "paid" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
                      {m.display_name[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{m.display_name}</p>
                      <p className="text-xs text-muted-foreground">Rp{total.toLocaleString("id-ID")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      payment?.status === "paid" ? "bg-success/15 text-success" :
                      payment?.status === "pending" ? "bg-warning/15 text-warning" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {payment?.status === "paid" ? `✓ ${payment.method === "transfer" ? "Transfer" : "Cash"}` :
                       payment?.status === "pending" ? "Pending" : "Belum bayar"}
                    </span>
                    {isHost && payment?.status === "pending" && (
                      <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => verifyPayment(payment.id)}>
                        Verifikasi
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomPage;
