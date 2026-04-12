import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Upload, ArrowLeft, ArrowRight, Check, Trash2, Plus, Pencil } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { scanReceipt, OCRItem } from "@/lib/ocr";
import { toast } from "sonner";

const CreateRoom = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [roomName, setRoomName] = useState("");
  const [placeName, setPlaceName] = useState("");
  const [taxPercent, setTaxPercent] = useState(10);
  const [servicePercent, setServicePercent] = useState(5);
  const [items, setItems] = useState<OCRItem[]>([]);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [createdCode, setCreatedCode] = useState("");
  const [creating, setCreating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [paymentBank, setPaymentBank] = useState("");
  const [paymentAccountNumber, setPaymentAccountNumber] = useState("");
  const [paymentAccountName, setPaymentAccountName] = useState("");

  // New item form
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newQty, setNewQty] = useState("1");
  const [editIdx, setEditIdx] = useState<number | null>(null);

  const handleScan = async (file: File) => {
    setScanning(true);
    setScanProgress(0);
    try {
      const result = await scanReceipt(file, setScanProgress);
      if (result.items.length === 0) {
        toast.warning("OCR tidak menemukan item. Coba tambahkan secara manual.");
      } else {
        toast.success(`Berhasil membaca ${result.items.length} item!`);
      }
      setItems(result.items);
      if (result.tax > 0) {
        // Estimate tax percent from subtotal
        const sub = result.items.reduce((s, i) => s + i.price * i.qty, 0);
        if (sub > 0) setTaxPercent(Math.round((result.tax / sub) * 100));
      }
      if (result.service > 0) {
        const sub = result.items.reduce((s, i) => s + i.price * i.qty, 0);
        if (sub > 0) setServicePercent(Math.round((result.service / sub) * 100));
      }
    } catch {
      toast.error("Gagal scan struk. Coba upload ulang atau tambah manual.");
    } finally {
      setScanning(false);
    }
  };

  const addItem = () => {
    if (!newName || !newPrice) return;
    if (editIdx !== null) {
      setItems((prev) => prev.map((item, i) => i === editIdx ? { name: newName, qty: parseInt(newQty) || 1, price: parseFloat(newPrice) } : item));
      setEditIdx(null);
    } else {
      setItems((prev) => [...prev, { name: newName, qty: parseInt(newQty) || 1, price: parseFloat(newPrice) }]);
    }
    setNewName("");
    setNewPrice("");
    setNewQty("1");
  };

  const removeItem = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));

  const startEdit = (idx: number) => {
    const item = items[idx];
    setNewName(item.name);
    setNewPrice(String(item.price));
    setNewQty(String(item.qty));
    setEditIdx(idx);
  };

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const taxAmount = Math.round(subtotal * taxPercent / 100);
  const serviceAmount = Math.round(subtotal * servicePercent / 100);
  const total = subtotal + taxAmount + serviceAmount;

  const handleCreate = async () => {
    if (!user || items.length === 0) return;
    setCreating(true);
    try {
      // Create room
      const { data: room, error: roomErr } = await supabase
        .from("rooms")
        .insert({
          host_id: user.id,
          name: roomName,
          place_name: placeName,
          tax_percent: taxPercent,
          service_percent: servicePercent,
        })
        .select()
        .single();

      if (roomErr) throw roomErr;

      // Insert items
      const { error: itemsErr } = await supabase.from("room_items").insert(
        items.map((item) => ({
          room_id: room.id,
          name: item.name,
          qty: item.qty,
          price: item.price,
        }))
      );
      if (itemsErr) throw itemsErr;

      // Host auto-joins as member
      const displayName = user.user_metadata?.full_name || user.email?.split("@")[0] || "Host";
      await supabase.from("room_members").insert({
        room_id: room.id,
        user_id: user.id,
        display_name: displayName,
      });

      setCreatedCode(room.code);
      setStep(3);
      toast.success("Room berhasil dibuat!");
    } catch (err: any) {
      toast.error(err.message || "Gagal membuat room");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container flex items-center gap-4 h-16">
          <button onClick={() => navigate("/dashboard")} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-display font-bold text-xs">P</span>
            </div>
            <span className="font-display font-bold text-foreground">Buat Patungan</span>
          </div>
        </div>
      </header>

      <div className="container max-w-lg py-8">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                {step > s ? <Check size={16} /> : s}
              </div>
              {s < 3 && <div className={`flex-1 h-1 rounded-full ${step > s ? "bg-primary" : "bg-muted"}`} />}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-6 animate-fade-up">
            <div>
              <h2 className="font-display font-bold text-xl text-foreground mb-1">Detail Room</h2>
              <p className="text-sm text-muted-foreground">Isi nama room dan tempat makan.</p>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="room">Nama Patungan</Label>
                <Input id="room" placeholder="Contoh: Patungan Solaria Jumat" value={roomName} onChange={(e) => setRoomName(e.target.value)} className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="place">Nama Tempat</Label>
                <Input id="place" placeholder="Contoh: Solaria Grand Indonesia" value={placeName} onChange={(e) => setPlaceName(e.target.value)} className="mt-1.5" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tax">Tax (%)</Label>
                  <Input id="tax" type="number" value={taxPercent} onChange={(e) => setTaxPercent(Number(e.target.value))} className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="svc">Service (%)</Label>
                  <Input id="svc" type="number" value={servicePercent} onChange={(e) => setServicePercent(Number(e.target.value))} className="mt-1.5" />
                </div>
              </div>
            </div>
            <Button className="w-full gap-2" onClick={() => setStep(2)} disabled={!roomName || !placeName}>
              Lanjut <ArrowRight size={18} />
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-fade-up">
            <div>
              <h2 className="font-display font-bold text-xl text-foreground mb-1">Scan Struk</h2>
              <p className="text-sm text-muted-foreground">Foto struk atau upload gambar, lalu edit jika perlu.</p>
            </div>

            {/* Scan/Upload */}
            <div className="space-y-4">
              <div className="border-2 border-dashed border-border rounded-2xl p-8 flex flex-col items-center justify-center gap-4 bg-muted/30">
                {scanning ? (
                  <>
                    <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center animate-pulse">
                      <Camera size={28} className="text-accent-foreground" />
                    </div>
                    <div className="w-full max-w-xs">
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${scanProgress}%` }} />
                      </div>
                      <p className="text-xs text-muted-foreground text-center mt-2">Scanning... {scanProgress}%</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center">
                      <Camera size={28} className="text-accent-foreground" />
                    </div>
                    <p className="text-muted-foreground text-sm text-center">Scan struk dengan kamera atau upload gambar</p>
                    <div className="flex gap-3">
                      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => e.target.files?.[0] && handleScan(e.target.files[0])} />
                      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleScan(e.target.files[0])} />
                      <Button className="gap-2" onClick={() => cameraInputRef.current?.click()}>
                        <Camera size={16} /> Kamera
                      </Button>
                      <Button variant="outline" className="gap-2" onClick={() => fileInputRef.current?.click()}>
                        <Upload size={16} /> Upload
                      </Button>
                    </div>
                  </>
                )}
              </div>

              {/* Items list */}
              {items.length > 0 && (
                <div className="space-y-2">
                  <div className="bg-accent/50 rounded-xl p-3 flex items-center gap-2">
                    <Check size={16} className="text-primary" />
                    <span className="text-sm text-foreground font-medium">{items.length} item ditemukan</span>
                  </div>
                  {items.map((item, idx) => (
                    <div key={idx} className="glass-card rounded-lg p-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.name}</p>
                        <p className="text-xs text-muted-foreground">x{item.qty}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="font-display font-semibold text-foreground">Rp{(item.price * item.qty).toLocaleString("id-ID")}</p>
                        <button onClick={() => startEdit(idx)} className="text-muted-foreground hover:text-foreground"><Pencil size={14} /></button>
                        <button onClick={() => removeItem(idx)} className="text-muted-foreground hover:text-destructive"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add/Edit item form */}
              <div className="glass-card rounded-xl p-4 space-y-3">
                <p className="text-sm font-medium text-foreground">{editIdx !== null ? "Edit Item" : "Tambah Item Manual"}</p>
                <div className="grid grid-cols-5 gap-2">
                  <Input className="col-span-2" placeholder="Nama item" value={newName} onChange={(e) => setNewName(e.target.value)} />
                  <Input placeholder="Qty" type="number" value={newQty} onChange={(e) => setNewQty(e.target.value)} />
                  <Input placeholder="Harga" type="number" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} />
                  <Button size="sm" onClick={addItem} disabled={!newName || !newPrice} className="gap-1">
                    {editIdx !== null ? <Check size={14} /> : <Plus size={14} />}
                  </Button>
                </div>
              </div>

              {/* Summary */}
              {items.length > 0 && (
                <div className="glass-card rounded-lg p-3 space-y-1">
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span className="text-foreground">Rp{subtotal.toLocaleString("id-ID")}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Tax ({taxPercent}%)</span><span className="text-foreground">Rp{taxAmount.toLocaleString("id-ID")}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Service ({servicePercent}%)</span><span className="text-foreground">Rp{serviceAmount.toLocaleString("id-ID")}</span></div>
                  <div className="border-t border-border pt-1 flex justify-between font-semibold"><span className="text-foreground">Total</span><span className="text-foreground">Rp{total.toLocaleString("id-ID")}</span></div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Kembali</Button>
              <Button onClick={handleCreate} disabled={items.length === 0 || creating} className="flex-1 gap-2">
                {creating ? "Membuat..." : "Buat Room"} <ArrowRight size={18} />
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-fade-up text-center">
            <div className="w-20 h-20 rounded-full bg-success/15 flex items-center justify-center mx-auto">
              <Check size={36} className="text-success" />
            </div>
            <div>
              <h2 className="font-display font-bold text-xl text-foreground mb-1">Room Siap!</h2>
              <p className="text-sm text-muted-foreground">Bagikan link ini ke teman-temanmu.</p>
            </div>

            <div className="glass-card rounded-xl p-4 space-y-3">
              <div className="bg-muted rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Link Room</p>
                <p className="font-mono text-sm text-foreground font-medium">{window.location.origin}/join/{createdCode}</p>
              </div>
              <div className="bg-muted rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Kode Room</p>
                <p className="font-display font-bold text-2xl text-primary tracking-widest">{createdCode}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="gap-2 text-sm" onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/join/${createdCode}`);
                toast.success("Link disalin!");
              }}>
                📋 Salin Link
              </Button>
              <Button variant="outline" className="gap-2 text-sm" onClick={() => {
                window.open(`https://wa.me/?text=Yuk patungan! Klik link ini: ${window.location.origin}/join/${createdCode}`, "_blank");
              }}>
                📱 Share WhatsApp
              </Button>
            </div>

            <Button className="w-full gap-2" onClick={() => navigate(`/room/${createdCode}`)}>
              Masuk ke Room <ArrowRight size={18} />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateRoom;
