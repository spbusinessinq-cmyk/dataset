import { ACTIVE_FEEDS } from "@/lib/mock-data";
import { Rss } from "lucide-react";

export default function ActiveFeeds() {
  return (
    <div className="glass-panel p-4 flex flex-col gap-3 flex-1" data-testid="panel-feeds">
      <div className="flex items-center justify-between border-b border-card-border pb-2">
        <h2 className="font-mono text-sm font-bold tracking-wide text-foreground">ACTIVE FEEDS / DATASETS</h2>
        <Rss className="w-4 h-4 text-muted-foreground" />
      </div>

      <div className="flex flex-col gap-2.5 mt-1">
        {ACTIVE_FEEDS.map((feed, i) => (
          <div key={i} className="flex justify-between items-center bg-background border border-card-border p-2 rounded">
            <span className="font-sans text-xs text-foreground truncate">{feed.name}</span>
            <div className="flex items-center gap-1.5 ml-2 shrink-0">
              <div className={`w-1.5 h-1.5 rounded-full ${
                feed.status === 'ACTIVE' ? 'bg-primary shadow-[0_0_5px_hsl(var(--primary))]' :
                feed.status === 'INDEXING' ? 'bg-amber-500 animate-pulse' :
                'bg-destructive'
              }`}></div>
              <span className="font-mono text-[9px] text-muted-foreground w-12 text-right">{feed.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}