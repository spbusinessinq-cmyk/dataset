import { Server } from "lucide-react";
import { useGetStatus } from "@workspace/api-client-react";

interface SystemStatusProps {
  totalSignals: number;
  queueDepth: number;
  lastPullTime: string | null;
}

function formatRelative(iso: string | null): string {
  if (!iso) return "—";
  try {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  } catch {
    return "—";
  }
}

export default function SystemStatus({ totalSignals, queueDepth, lastPullTime }: SystemStatusProps) {
  const { data: status, isError } = useGetStatus({
    query: { retry: 1, refetchInterval: 15000 },
  });

  const backendOnline = !isError && status?.backend === "online";
  const ollamaOnline = status?.ollama === "online";
  const savedCount = status?.signalCount ?? totalSignals;
  const serverLastPull = status?.lastPullTime ?? null;
  const displayLastPull = lastPullTime ?? serverLastPull;

  return (
    <div className="glass-panel p-4 flex flex-col gap-3" data-testid="panel-system-status">
      <div className="flex items-center justify-between border-b border-card-border pb-2">
        <h2 className="font-mono text-sm font-bold tracking-wide text-foreground">SYSTEM STATUS</h2>
        <Server className="w-4 h-4 text-muted-foreground" />
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-3 mt-1">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[9px] text-muted-foreground">API BACKEND</span>
          <span className={`font-mono text-xs font-bold ${backendOnline ? "text-primary" : "text-destructive"}`} data-testid="status-api">
            {backendOnline ? "ONLINE" : "DEGRADED"}
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="font-mono text-[9px] text-muted-foreground">OLLAMA LLM</span>
          <span className={`font-mono text-xs font-bold ${ollamaOnline ? "text-primary" : "text-amber-500/80"}`} data-testid="status-ollama">
            {status ? (ollamaOnline ? "ONLINE" : "HEURISTIC") : "CHECKING..."}
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="font-mono text-[9px] text-muted-foreground">SIGNALS SAVED</span>
          <span className="font-mono text-xs text-foreground font-bold" data-testid="metric-signals">{savedCount.toLocaleString()}</span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="font-mono text-[9px] text-muted-foreground">QUEUE DEPTH</span>
          <span className={`font-mono text-xs font-bold ${queueDepth > 0 ? "text-amber-400" : "text-foreground"}`}>
            {queueDepth}
          </span>
        </div>

        <div className="flex flex-col gap-1 col-span-2">
          <span className="font-mono text-[9px] text-muted-foreground">LAST PULL</span>
          <span className="font-mono text-xs text-foreground/70">
            {formatRelative(displayLastPull)}
          </span>
        </div>

        <div className="flex flex-col gap-1 col-span-2">
          <div className="flex justify-between items-center mb-1">
            <span className="font-mono text-[9px] text-muted-foreground">ENGINE</span>
            <span className="font-mono text-[9px] text-muted-foreground">
              {ollamaOnline ? "llama3.2:3b" : "heuristic"}
            </span>
          </div>
          <div className="h-1.5 w-full bg-background rounded-full overflow-hidden border border-card-border">
            <div
              className={`h-full transition-all duration-1000 ${backendOnline ? "bg-primary" : "bg-destructive"}`}
              style={{ width: backendOnline ? "100%" : "20%" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
