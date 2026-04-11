const Footer = () => {
  return (
    <footer className="py-10 bg-muted/50 border-t border-border">
      <div className="container">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-display font-bold text-xs">P</span>
            </div>
            <span className="font-display font-bold text-foreground">PATUNGAN</span>
          </div>
          <p className="text-muted-foreground text-sm">
            © 2026 PATUNGAN. Platform Atur Tagihan untuk Nongkrong Aman & Nyaman.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
