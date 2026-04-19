import { Terminal } from "lucide-react";
import { useEffect, useRef } from "react";

interface OpsLogProps {
  logs: string[];
}

export default function OpsLog({ logs }: OpsLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0; // Because we prepend logs, new logs are at the top
    }
  }, [logs]);

  return (
    <div className="glass-panel p-4 flex flex-col gap-3" data-testid="panel-ops-log">
      <div className="flex items-center justify-between border-b border-card-border pb-2">
        <h2 className="font-mono text-sm font-bold tracking-wide text-foreground">OPS LOG</h2>
        <Terminal className="w-4 h-4 text-muted-foreground" />
      </div>

      <div 
        ref={scrollRef}
        className="h-[120px] overflow-y-auto font-mono text-xs flex flex-col gap-1.5 pr-2"
      >
        {logs.map((log, i) => {
          // Add some simple highlighting syntax
          const isError = log.includes("failed") || log.includes("error");
          const isWarning = log.includes("pending") || log.includes("irregularities");
          const isSuccess = log.includes("successfully") || log.includes("completed") || log.includes("passed");
          
          let textColorClass = "text-secondary-foreground";
          if (i === 0) textColorClass = "text-foreground font-medium"; // highlight newest
          if (isError) textColorClass = "text-destructive";
          if (isWarning && i !== 0) textColorClass = "text-amber-500/80";
          if (isSuccess && i !== 0) textColorClass = "text-primary/80";

          return (
            <div key={i} className={`flex items-start gap-2 ${textColorClass} hover:bg-secondary/30 px-1 py-0.5 rounded transition-colors`} data-testid={`log-entry-${i}`}>
              <span className="text-muted-foreground/60 shrink-0 select-none">&gt;</span>
              <span className="leading-tight">{log}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}