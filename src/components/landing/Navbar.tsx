import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

const Navbar = () => {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-border/50">
      <div className="container flex items-center justify-between h-16">
        <a href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-display font-bold text-sm">P</span>
          </div>
          <span className="font-display font-bold text-xl text-foreground">PATUNGAN</span>
        </a>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#fitur" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">Fitur</a>
          <a href="#cara-kerja" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">Cara Kerja</a>
          <a href="#faq" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">FAQ</a>
          <Button variant="outline" size="sm" onClick={() => window.location.href = '/dashboard'}>Masuk</Button>
          <Button size="sm" onClick={() => window.location.href = '/dashboard'}>Buat Patungan</Button>
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden text-foreground" onClick={() => setOpen(!open)}>
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-card border-t border-border p-4 space-y-3 animate-fade-up">
          <a href="#fitur" className="block text-muted-foreground hover:text-foreground text-sm font-medium py-2">Fitur</a>
          <a href="#cara-kerja" className="block text-muted-foreground hover:text-foreground text-sm font-medium py-2">Cara Kerja</a>
          <a href="#faq" className="block text-muted-foreground hover:text-foreground text-sm font-medium py-2">FAQ</a>
          <Button variant="outline" className="w-full" size="sm">Masuk</Button>
          <Button className="w-full" size="sm">Buat Patungan</Button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
