import scanImg from "@/assets/scan-receipt.png";

const steps = [
  {
    num: "01",
    title: "Host Buat Room",
    desc: "Login, klik '+ Buat Patungan', isi nama tempat makan, dan scan struk dari kamera.",
  },
  {
    num: "02",
    title: "Scan & Edit Struk",
    desc: "OCR otomatis membaca item & harga. Host bisa edit jika ada yang kurang tepat.",
  },
  {
    num: "03",
    title: "Share Link ke Teman",
    desc: "Bagikan link room via WhatsApp, LINE, atau Telegram. Semua teman join & pilih pesanannya.",
  },
  {
    num: "04",
    title: "Bayar & Selesai!",
    desc: "Setiap orang bayar sesuai total masing-masing via transfer atau cash. Status real-time!",
  },
];

const HowItWorksSection = () => {
  return (
    <section id="cara-kerja" className="py-20 bg-muted/50">
      <div className="container">
        <div className="text-center mb-14">
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-foreground mb-3">
            Cara Kerja PATUNGAN
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            4 langkah simpel dari scan struk sampai semua lunas.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            {steps.map((s, i) => (
              <div key={i} className="flex gap-4 group">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-display font-bold text-sm">{s.num}</span>
                </div>
                <div>
                  <h3 className="font-display font-semibold text-lg text-foreground mb-1">{s.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center">
            <div className="relative">
              <div className="w-64 h-64 sm:w-80 sm:h-80 rounded-3xl bg-accent/50 flex items-center justify-center">
                <img src={scanImg} alt="Scan struk dengan OCR" className="w-48 h-48 sm:w-60 sm:h-60 object-contain animate-float" />
              </div>
              <div className="absolute -top-3 -right-3 px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-xs font-bold shadow-md">
                OCR Powered ⚡
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
