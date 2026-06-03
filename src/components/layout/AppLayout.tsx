import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { AnimatePresence, motion } from "framer-motion";
import { useLocation } from "wouter";

export function AppLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground flex overflow-hidden noise-overlay">
      {/* Dot grid background */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-grid" />
      {/* Subtle ambient glows — very restrained */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-64 w-[600px] h-[400px] opacity-20"
          style={{ background: "radial-gradient(ellipse, rgba(99,102,241,0.15) 0%, transparent 70%)" }} />
        <div className="absolute bottom-0 right-0 w-[500px] h-[400px] opacity-15"
          style={{ background: "radial-gradient(ellipse, rgba(6,182,212,0.12) 0%, transparent 70%)" }} />
      </div>

      <Sidebar />

      <main className="flex-1 ml-64 relative z-10 h-screen overflow-y-auto overflow-x-hidden">
        <div className="p-8 max-w-7xl mx-auto">
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
