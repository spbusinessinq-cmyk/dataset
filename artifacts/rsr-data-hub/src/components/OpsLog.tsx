import { Terminal } from "lucide-react";
import { useEffect, useRef } from "react";

interface OpsLogEntry {
  id: string;
  timestamp: string;
  message: string;
  level: string;
}

interface OpsLogProps {
  entries: OpsLogEntry[];
  isLoading?: boolean;
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  } catch {
    return iso;
  }
}

export default function OpsLog({ entries, isLoading }: OpsLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [entries]);

  return (
    <div className="glass-panel p-4 flex flex-col gap-3" data-testid="panel-ops-log">
      <div className="flex items-center justify-between border-b border-card-border pb-2">
        <h2 className="font-mono text-sm font-bold tracking-wide text-foreground">OPS LOG</h2>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-muted-foreground">{entries.length} ENTRIES</span>
          <Terminal className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>

      <div
        ref={scrollRef}
        className="h-[120px] overflow-y-auto font-mono text-xs flex flex-col gap-1.5 pr-2"
        data-testid="ops-log-scroll"
      >
        {isLoading ? (
          <span className="text-muted-foreground animate-pulse">[LOADING LOG...]</span>
        ) : entries.length === 0 ? (
          <span className="text-muted-foreground/50">[NO LOG ENTRIES]</span>
        ) : entries.map((entry, i) => {
          const isError = entry.level === "error" || entry.message.includes("failed") || entry.message.includes("error");
          const isWarning = entry.level === "warn" || entry.message.includes("pending") || entry.message.includes("degraded");
          const isSuccess = entry.message.includes("complete") || entry.message.includes("saved") || entry.message.includes("published") || entry.message.includes("passed") || entry.message.includes("indexed") || entry.message.includes("export");

          let textColorClass = "text-secondary-foreground";
          if (i === 0) textColorClass = "text-foreground font-medium";
          if (isError) textColorClass = "text-destructive";
          else if (isWarning && i !== 0) textColorClass = "text-amber-500/80";
          else if (isSuccess && i !== 0) textColorClass = "text-primary/80";

          return (
            <div
              key={entry.id}
              className={`flex items-start gap-2 ${textColorClass} hover:bg-secondary/30 px-1 py-0.5 rounded transition-colors`}
              data-testid={`log-entry-${i}`}
            >
              <span className="text-muted-foreground/60 shrink-0 select-none">&gt;</span>
              <span className="text-muted-foreground/60 shrink-0">[{formatTime(entry.timestamp)}]</span>
              <span className="leading-tight">{entry.message}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
