import { Rss, FileText, BarChart2, Globe, Database, ClipboardList } from "lucide-react";

interface Feed {
  id: string;
  name: string;
  status: string;
  description: string;
  sourceType?: string;
  category?: string;
}

interface ActiveFeedsProps {
  feeds: Feed[];
  isLoading?: boolean;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  News:     <Rss className="w-3 h-3" />,
  Filing:   <FileText className="w-3 h-3" />,
  Contract: <ClipboardList className="w-3 h-3" />,
  Market:   <BarChart2 className="w-3 h-3" />,
  Social:   <Globe className="w-3 h-3" />,
  Dataset:  <Database className="w-3 h-3" />,
};

function statusStyle(status: string) {
  switch (status) {
    case "active": return "bg-primary shadow-[0_0_5px_hsl(var(--primary))]";
    case "indexing": return "bg-amber-500 animate-pulse";
    case "placeholder": return "bg-muted-foreground/20";
    default: return "bg-destructive";
  }
}

function statusLabel(status: string) {
  if (status === "placeholder") return "READY";
  return status.toUpperCase();
}

function statusTextColor(status: string) {
  if (status === "active") return "text-primary";
  if (status === "indexing") return "text-amber-500";
  if (status === "placeholder") return "text-muted-foreground/40";
  return "text-muted-foreground";
}

export default function ActiveFeeds({ feeds, isLoading }: ActiveFeedsProps) {
  return (
    <div className="glass-panel p-4 flex flex-col gap-3 flex-1" data-testid="panel-feeds">
      <div className="flex items-center justify-between border-b border-card-border pb-2">
        <h2 className="font-mono text-sm font-bold tracking-wide text-foreground">SOURCE LANES</h2>
        <Rss className="w-4 h-4 text-muted-foreground" />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <span className="font-mono text-xs text-muted-foreground animate-pulse">LOADING LANES...</span>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {feeds.map((feed) => (
            <div
              key={feed.id}
              className={`flex items-center gap-2 p-2 rounded border transition-colors ${
                feed.status === "active"
                  ? "border-card-border bg-background hover:border-primary/30"
                  : feed.status === "indexing"
                  ? "border-amber-500/20 bg-background"
                  : "border-card-border/30 bg-background/40 opacity-60"
              }`}
              data-testid={`feed-item-${feed.id}`}
            >
              {/* Category icon */}
              <span className={`shrink-0 ${
                feed.status === "active" ? "text-primary" :
                feed.status === "indexing" ? "text-amber-500" :
                "text-muted-foreground/30"
              }`}>
                {CATEGORY_ICONS[feed.category ?? "News"] ?? <Rss className="w-3 h-3" />}
              </span>

              {/* Name */}
              <span className={`font-mono text-[10px] flex-1 truncate leading-tight ${
                feed.status === "active" ? "text-foreground" :
                feed.status === "indexing" ? "text-foreground" :
                "text-muted-foreground/50"
              }`}>
                {feed.name}
              </span>

              {/* Status dot + label */}
              <div className="flex items-center gap-1 shrink-0">
                <div className={`w-1.5 h-1.5 rounded-full ${statusStyle(feed.status)}`} />
                <span className={`font-mono text-[8px] ${statusTextColor(feed.status)}`}>
                  {statusLabel(feed.status)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
