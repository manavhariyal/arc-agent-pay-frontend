import { AppLayout } from "@/components/layout/AppLayout";
import { Construction } from "lucide-react";

export default function MultiSend() {
  return (
    <AppLayout>
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="glass-panel-elevated rounded-2xl p-12 text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Construction className="w-8 h-8 text-amber-400" />
          </div>
          <h2 className="text-white font-bold text-xl mb-2">Under Maintenance</h2>
          <p className="text-white/40 text-sm">
            Multi-Send feature is being improved and will be available soon. Thanks for your patience!
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
