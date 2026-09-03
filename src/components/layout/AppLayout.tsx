import { ReactNode, useState } from "react";
import { Sidebar, SidebarContent } from "./Sidebar";
import { AnimatePresence, motion } from "framer-motion";
import { useLocation } from "wouter";
import { Menu } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";

export function AppLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground flex overflow-hidden noise-overlay">
      {/* Dot grid background */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-grid" />
      {/* Subtle ambient glows — very restrained */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-64 w-[600px] h-[400px] opacity-20"
          style={{ background: "radial-gradient(ellipse, rgba(10,132,255,0.15) 0%, transparent 70%)" }} />
        <div className="absolute bottom-0 right-0 w-[500px] h-[400px] opacity-15"
          style={{ background: "radial-gradient(ellipse, rgba(34,240,255,0.12) 0%, transparent 70%)" }} />
      </div>

      <Sidebar />

      {/* Mobile top bar */}
      <div
        className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center gap-3 px-3 h-12"
        style={{
          background: "rgba(9,11,18,0.97)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          backdropFilter: "blur(24px)",
        }}
      >
        <button
          onClick={() => setMobileNavOpen(true)}
          className="p-1.5 -ml-1 rounded-lg text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <img
          src="/arc-logo.png"
          alt="Arc Agent Pay"
          className="h-5 w-auto object-contain"
          style={{ filter: 'brightness(4) drop-shadow(0 0 8px rgba(10,132,255,0.5))' }}
        />
      </div>

      {/* Mobile nav drawer */}
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent
          side="left"
          className="p-0 w-[240px] max-w-[78vw] border-r-0"
          style={{ background: "rgba(9,11,18,0.98)", backdropFilter: "blur(24px)" }}
        >
          <SidebarContent onNavigate={() => setMobileNavOpen(false)} />
        </SheetContent>
      </Sheet>

      <main className="flex-1 md:ml-64 relative z-10 h-screen overflow-y-auto overflow-x-hidden pt-12 md:pt-0">
        <div className="p-3 sm:p-6 md:p-8 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
