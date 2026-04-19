import { Server } from "lucide-react";
import { useHealthCheck } from "@workspace/api-client-react";

interface SystemStatusProps {
  totalSignals: number;
}

export default function SystemStatus({ totalSignals }: SystemStatusProps) {
  const { data: health, isError } = useHealthCheck({
    query: { retry: 1, refetchInterval: 30000 },
  });

  const isOnline = !isError && health?.status === "ok";

  return (
    <div className="glass-panel p-4 flex flex-col gap-3" data-testid="panel-system-status">
      <div className="flex items-center justify-between border-b border-card-border pb-2">
        <h2 className="font-mono text-sm font-bold tracking-wide text-foreground">SYSTEM STATUS</h2>
        <Server className="w-4 h-4 text-muted-foreground" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 gap-3 mt-1">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[9px] text-muted-foreground">API STATUS</span>
          <span className={`font-mono text-xs font-bold ${isOnline ? "text-primary" : "text-destructive"}`} data-testid="status-api">
            {isOnline ? "ONLINE" : "DEGRADED"}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[9px] text-muted-foreground">SIGNALS SAVED</span>
          <span className="font-mono text-xs text-foreground font-bold" data-testid="metric-signals">{totalSignals.toLocaleString()}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[9px] text-muted-foreground">QUEUE DEPTH</span>
          <span className="font-mono text-xs text-foreground font-bold">0</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[9px] text-muted-foreground">OLLAMA</span>
          <span className="font-mono text-xs text-muted-foreground font-bold">
            {isOnline ? "READY" : "N/A"}
          </span>
        </div>
        <div className="flex flex-col gap-1 col-span-2 md:col-span-1 lg:col-span-2">
          <div className="flex justify-between items-center mb-1">
            <span className="font-mono text-[9px] text-muted-foreground">ENGINE</span>
            <span className="font-mono text-[9px] text-muted-foreground">llama3.2:3b / heuristic</span>
          </div>
          <div className="h-1.5 w-full bg-background rounded-full overflow-hidden border border-card-border">
            <div className={`h-full transition-all duration-1000 ${isOnline ? "bg-primary" : "bg-destructive"}`} style={{ width: isOnline ? "100%" : "20%" }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}
