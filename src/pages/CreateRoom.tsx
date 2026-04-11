import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Upload, ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";

const mockOCRItems = [
  { id: 1, name: "Nasi Goreng Spesial", qty: 1, price: 35000 },
  { id: 2, name: "Chicken Katsu", qty: 1, price: 42000 },
  { id: 3, name: "Lemon Tea", qty: 2, price: 18000 },
  { id: 4, name: "Es Teh Manis", qty: 1, price: 12000 },
  { id: 5, name: "French Fries (Share)", qty: 1, price: 28000 },
  { id: 6, name: "Mie Goreng", qty: 1, price: 32000 },
];

const CreateRoom = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [roomName, setRoomName] = useState("");
  const [placeName, setPlaceName] = useState("");
  const [scanned, setScanned] = useState(false);

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
              <p className="text-sm text-muted-foreground">Foto struk atau upload gambar untuk auto-scan.</p>
            </div>

            {!scanned ? (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-border rounded-2xl p-12 flex flex-col items-center justify-center gap-4 bg-muted/30">
                  <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center">
                    <Camera size={28} className="text-accent-foreground" />
                  </div>
                  <p className="text-muted-foreground text-sm text-center">Arahkan kamera ke struk untuk scan otomatis</p>
                  <div className="flex gap-3">
                    <Button className="gap-2" onClick={() => setScanned(true)}>
                      <Camera size={16} /> Buka Kamera
                    </Button>
                    <Button variant="outline" className="gap-2" onClick={() => setScanned(true)}>
                      <Upload size={16} /> Upload
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-accent/50 rounded-xl p-3 flex items-center gap-2">
                  <Check size={16} className="text-primary" />
                  <span className="text-sm text-foreground font-medium">OCR berhasil membaca 6 item!</span>
                </div>

                <div className="space-y-2">
                  {mockOCRItems.map((item) => (
                    <div key={item.id} className="glass-card rounded-lg p-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.name}</p>
                        <p className="text-xs text-muted-foreground">x{item.qty}</p>
                      </div>
                      <p className="font-display font-semibold text-foreground">Rp{item.price.toLocaleString("id-ID")}</p>
                    </div>
                  ))}
                </div>

                <div className="glass-card rounded-lg p-3 space-y-1">
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span className="text-foreground">Rp185.000</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Tax (10%)</span><span className="text-foreground">Rp18.500</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Service (5%)</span><span className="text-foreground">Rp9.250</span></div>
                  <div className="border-t border-border pt-1 flex justify-between font-semibold"><span className="text-foreground">Total</span><span className="text-foreground">Rp212.750</span></div>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Kembali</Button>
              <Button onClick={() => setStep(3)} disabled={!scanned} className="flex-1 gap-2">
                Lanjut <ArrowRight size={18} />
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
                <p className="font-mono text-sm text-foreground font-medium">patungan.id/room/ABCD123</p>
              </div>
              <div className="bg-muted rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Kode Room</p>
                <p className="font-display font-bold text-2xl text-primary tracking-widest">ABCD123</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="gap-2 text-sm">
                📋 Salin Link
              </Button>
              <Button variant="outline" className="gap-2 text-sm">
                📱 Share WhatsApp
              </Button>
            </div>

            <Button className="w-full gap-2" onClick={() => navigate("/room/ABCD123")}>
              Masuk ke Room <ArrowRight size={18} />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateRoom;
