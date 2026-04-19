import { useEffect, useState } from "react";

export default function Header() {
  const [time, setTime] = useState("");

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
        <div className="flex items-center gap-2 bg-card border border-card-border px-3 py-1 rounded-full">
          <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary))] animate-pulse"></div>
          <span className="font-mono text-xs text-primary font-medium tracking-wide">SYSTEM ONLINE</span>
        </div>
      </div>
    </header>
  );
}