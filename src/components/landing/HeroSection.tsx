import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Scan, Users, Zap, LogIn } from "lucide-react";
import heroImg from "@/assets/hero-illustration.jpg";

const HeroSection = () => {
  const [joinCode, setJoinCode] = useState("");

  const handleJoin = () => {
    const code = joinCode.trim();
    if (code) {
      window.location.href = `/join/${code}`;
    }
  };

  return (
    <section className="relative pt-28 pb-20 overflow-hidden bg-gradient-hero">
      {/* Decorative blobs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />

      <div className="container relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 animate-fade-up">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent text-accent-foreground text-xs font-semibold">
              <Zap size={14} />
              Split bill tanpa drama
            </div>

            <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl leading-tight text-foreground">
              Patungan Makan
              <br />
              <span className="text-gradient-primary">Jadi Gampang!</span>
            </h1>

            <p className="text-muted-foreground text-lg max-w-lg leading-relaxed">
              Scan struk, bagi tagihan otomatis, bayar via transfer — semua real-time langsung dari browser. Gak perlu install aplikasi.
            </p>

            <div className="flex flex-wrap gap-3">
              <Button size="lg" className="shadow-primary gap-2" onClick={() => window.location.href = '/create-room'}>
                + Buat Patungan <ArrowRight size={18} />
              </Button>
            </div>

            <div className="flex items-center gap-2 max-w-sm">
              <Input
                placeholder="Masukkan kode room..."
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                className="flex-1"
              />
              <Button variant="outline" className="gap-2 flex-shrink-0" onClick={handleJoin} disabled={!joinCode.trim()}>
                <LogIn size={16} /> Join Room
              </Button>
            </div>

            <div className="flex items-center gap-6 pt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Scan size={16} className="text-primary" />
                OCR Scanner
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users size={16} className="text-primary" />
                Real-time Sync
              </div>
            </div>
          </div>

          <div className="relative animate-float hidden lg:block">
            <div className="rounded-2xl overflow-hidden shadow-lg border border-border/50">
              <img src={heroImg} alt="Teman-teman nongkrong dan split bill dengan PATUNGAN" className="w-full h-auto" />
            </div>
            {/* Floating card */}
            <div className="absolute -bottom-4 -left-4 glass-card rounded-xl p-4 animate-scale-in">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-success flex items-center justify-center">
                  <span className="text-success-foreground text-lg">✓</span>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Andi sudah bayar</p>
                  <p className="font-semibold text-sm text-foreground">Rp27.429</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
