import { SYSTEM_METRICS } from "@/lib/mock-data";
import { Server } from "lucide-react";

export default function SystemStatus() {
  return (
    <div className="glass-panel p-4 flex flex-col gap-3" data-testid="panel-system-status">
      <div className="flex items-center justify-between border-b border-card-border pb-2">
        <h2 className="font-mono text-sm font-bold tracking-wide text-foreground">SYSTEM STATUS</h2>
        <Server className="w-4 h-4 text-muted-foreground" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 gap-3 mt-1">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[9px] text-muted-foreground">API STATUS</span>
          <span className="font-mono text-xs text-primary font-bold">{SYSTEM_METRICS.apiStatus}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[9px] text-muted-foreground">PROCESSED (24H)</span>
          <span className="font-mono text-xs text-foreground font-bold">{SYSTEM_METRICS.signalsProcessed}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[9px] text-muted-foreground">QUEUE DEPTH</span>
          <span className="font-mono text-xs text-foreground font-bold">{SYSTEM_METRICS.queueDepth}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[9px] text-muted-foreground">AVG CONFIDENCE</span>
          <span className="font-mono text-xs text-foreground font-bold">{SYSTEM_METRICS.avgConfidence}</span>
        </div>
        <div className="flex flex-col gap-1 col-span-2 md:col-span-1 lg:col-span-2">
          <div className="flex justify-between items-center mb-1">
            <span className="font-mono text-[9px] text-muted-foreground">STORAGE</span>
            <span className="font-mono text-[9px] text-muted-foreground">{SYSTEM_METRICS.storageUsed}</span>
          </div>
          <div className="h-1.5 w-full bg-background rounded-full overflow-hidden border border-card-border">
            <div className="h-full bg-primary" style={{ width: '24%' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}