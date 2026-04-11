import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const CTASection = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container">
        <div className="relative rounded-3xl overflow-hidden p-10 sm:p-16 text-center" style={{ background: "var(--gradient-primary)" }}>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
          <div className="relative z-10">
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-primary-foreground mb-4">
              Siap Patungan Tanpa Drama?
            </h2>
            <p className="text-primary-foreground/80 text-lg max-w-lg mx-auto mb-8">
              Gratis, tanpa install, langsung dari browser. Buat room pertamamu sekarang!
            </p>
            <Button
              size="lg"
              variant="secondary"
              className="gap-2 font-semibold shadow-lg"
              onClick={() => window.location.href = '/create-room'}
            >
              + Buat Patungan Sekarang <ArrowRight size={18} />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
