import { Camera, QrCode, Users, Calculator, Shield, Clock } from "lucide-react";

const features = [
  {
    icon: Camera,
    title: "Scan Struk Otomatis",
    desc: "Foto struk dari kamera, OCR langsung baca semua item & harga secara otomatis.",
  },
  {
    icon: Users,
    title: "Room Berbasis Link",
    desc: "Bagikan link room ke teman. Semua join, pilih pesanan, dan langsung hitung.",
  },
  {
    icon: Calculator,
    title: "Split Bill Proporsional",
    desc: "Pajak & service dibagi adil sesuai proporsi pesanan masing-masing orang.",
  },
  {
    icon: CreditCard,
    title: "Bayar via Transfer",
    desc: "Transfer sesuai nominal ke rekening host. Status lunas setelah verifikasi.",
  },
  {
    icon: Clock,
    title: "Real-Time Sync",
    desc: "Status pembayaran update otomatis di semua device tanpa perlu refresh.",
  },
  {
    icon: Shield,
    title: "Cash Verification",
    desc: "Bayar cash ke host? Host tinggal verifikasi, status langsung berubah.",
  },
];

const FeaturesSection = () => {
  return (
    <section id="fitur" className="py-20 bg-background">
      <div className="container">
        <div className="text-center mb-14">
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-foreground mb-3">
            Semua yang Kamu Butuhkan
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Fitur lengkap untuk split bill tanpa ribet saat nongkrong bareng.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div
              key={i}
              className="group glass-card rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center mb-4 group-hover:bg-primary transition-colors">
                <f.icon size={22} className="text-accent-foreground group-hover:text-primary-foreground transition-colors" />
              </div>
              <h3 className="font-display font-semibold text-lg text-foreground mb-2">{f.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
