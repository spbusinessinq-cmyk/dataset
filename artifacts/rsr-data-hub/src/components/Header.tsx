import { useEffect, useState } from "react";
import { useHealthCheck } from "@workspace/api-client-react";

export default function Header() {
  const [time, setTime] = useState("");
  const { data: health, isError } = useHealthCheck({
    query: { retry: 1, refetchInterval: 30000 },
  });

  const isOnline = !isError && health?.status === "ok";

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toISOString().replace("T", " ").substring(0, 19) + "Z");
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="glass-panel flex items-center justify-between px-4 py-2 border-b border-card-border" data-testid="header">
      <div className="flex items-center gap-3">
        <h1 className="font-mono text-primary font-bold tracking-tight text-lg" data-testid="text-title">RSR DATA HUB</h1>
        <span className="font-mono text-xs bg-primary/10 text-primary px-2 py-0.5 rounded border border-primary/20">v1.0.0</span>
      </div>

      <div className="hidden md:block">
        <span className="font-mono text-xs text-muted-foreground tracking-widest">INTELLIGENCE ANALYSIS PLATFORM</span>
      </div>

      <div className="flex items-center gap-4">
        <span className="font-mono text-xs text-muted-foreground" data-testid="text-clock">{time}</span>
        <div className={`flex items-center gap-2 bg-card border px-3 py-1 rounded-full ${isOnline ? "border-card-border" : "border-destructive/40"}`}>
          <div className={`w-2 h-2 rounded-full animate-pulse ${
            isOnline
              ? "bg-primary shadow-[0_0_8px_hsl(var(--primary))]"
              : "bg-destructive"
          }`}></div>
          <span className={`font-mono text-xs font-medium tracking-wide ${isOnline ? "text-primary" : "text-destructive"}`} data-testid="status-system">
            {isOnline ? "SYSTEM ONLINE" : "DEGRADED"}
          </span>
        </div>
      </div>
    </header>
  );
}
