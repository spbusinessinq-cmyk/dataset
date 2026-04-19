import { Signal } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Inbox, Cpu, Save, SendToBack, X, FolderOpen } from "lucide-react";

interface IntakeQueueProps {
  items: Signal[];
  isAnalyzing?: boolean;
  onAnalyze: (signal: Signal) => void;
  onSave: (signal: Signal) => void;
  onPublish: (signal: Signal) => void;
  onLoad: (signal: Signal) => void;
  onDismiss: (id: string) => void;
}

const SOURCE_TYPE_COLORS: Record<string, string> = {
  News:     "text-blue-400 border-blue-400 bg-blue-400/10",
  Social:   "text-purple-400 border-purple-400 bg-purple-400/10",
  Document: "text-amber-400 border-amber-400 bg-amber-400/10",
  Contract: "text-orange-400 border-orange-400 bg-orange-400/10",
  Dataset:  "text-cyan-400 border-cyan-400 bg-cyan-400/10",
  Filing:   "text-rose-400 border-rose-400 bg-rose-400/10",
  Market:   "text-emerald-400 border-emerald-400 bg-emerald-400/10",
  Manual:   "text-gray-400 border-gray-400 bg-gray-400/10",
};

const STATUS_COLORS: Record<string, string> = {
  pulled:   "text-blue-400",
  uploaded: "text-amber-400",
  analyzed: "text-primary",
  saved:    "text-primary",
};

function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}

export default function IntakeQueue({
  items,
  isAnalyzing,
  onAnalyze,
  onSave,
  onPublish,
  onLoad,
  onDismiss,
}: IntakeQueueProps) {
  if (items.length === 0) return null;

  return (
    <div className="glass-panel p-4 flex flex-col gap-3" data-testid="panel-intake-queue">
      <div className="flex items-center justify-between border-b border-card-border pb-2">
        <div className="flex items-center gap-2">
          <h2 className="font-mono text-sm font-bold tracking-wide text-foreground">INTAKE QUEUE</h2>
          <span className="font-mono text-[10px] text-primary border border-primary/30 rounded px-1.5 py-0.5">
            {items.length} PENDING
          </span>
        </div>
        <Inbox className="w-4 h-4 text-muted-foreground" />
      </div>

      <div className="flex flex-col gap-2 max-h-[320px] overflow-y-auto pr-1">
        {items.map((item) => (
          <div
            key={item.id}
            className="border border-card-border/60 rounded p-3 bg-background/40 flex flex-col gap-2"
            data-testid={`queue-item-${item.id}`}
          >
            {/* Top row: badges + dismiss */}
            <div className="flex items-start gap-2">
              <div className="flex gap-1.5 flex-wrap flex-1">
                <Badge
                  variant="outline"
                  className={`font-mono text-[8px] px-1.5 py-0 rounded-sm border uppercase ${
                    SOURCE_TYPE_COLORS[item.sourceType ?? "News"] ?? SOURCE_TYPE_COLORS["News"]
                  }`}
                >
                  {item.sourceType ?? "Unknown"}
                </Badge>
                <Badge
                  variant="outline"
                  className={`font-mono text-[8px] px-1.5 py-0 rounded-sm border uppercase ${
                    item.classification === "CRITICAL" ? "text-destructive border-destructive bg-destructive/10" :
                    item.classification === "ELEVATED" ? "text-amber-500 border-amber-500 bg-amber-500/10" :
                    "text-primary border-primary bg-primary/10"
                  }`}
                >
                  {item.classification}
                </Badge>
                <span className={`font-mono text-[8px] uppercase ${STATUS_COLORS[item.status ?? "pulled"] ?? "text-muted-foreground"}`}>
                  {item.status ?? "pulled"}
                </span>
              </div>
              <button
                className="text-muted-foreground/40 hover:text-destructive transition-colors shrink-0"
                onClick={() => onDismiss(item.id)}
                title="Dismiss"
              >
                <X className="w-3 h-3" />
              </button>
            </div>

            {/* Title + source + time */}
            <div>
              <p className="font-mono text-xs text-foreground leading-snug truncate">{item.title}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-mono text-[9px] text-muted-foreground">{item.source}</span>
                <span className="text-muted-foreground/30">·</span>
                <span className="font-mono text-[9px] text-muted-foreground">{formatTimestamp(item.timestamp)}</span>
                <span className="text-muted-foreground/30">·</span>
                <span className="font-mono text-[9px] text-muted-foreground">{item.confidence}% conf</span>
              </div>
            </div>

            {/* Summary snippet */}
            {item.summary && (
              <p className="font-mono text-[10px] text-muted-foreground leading-relaxed line-clamp-2">
                {item.summary}
              </p>
            )}

            {/* Action row */}
            <div className="flex gap-1.5 flex-wrap">
              <Button
                size="sm"
                variant="outline"
                className="h-6 px-2 font-mono text-[9px] border-primary/30 bg-background hover:bg-primary/10 text-primary gap-1"
                onClick={() => onAnalyze(item)}
                disabled={isAnalyzing}
              >
                <Cpu className="w-2.5 h-2.5" />
                ANALYZE
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-6 px-2 font-mono text-[9px] border-card-border bg-background hover:bg-secondary text-muted-foreground gap-1"
                onClick={() => onLoad(item)}
              >
                <FolderOpen className="w-2.5 h-2.5" />
                LOAD
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-6 px-2 font-mono text-[9px] border-card-border bg-background hover:bg-secondary text-muted-foreground gap-1"
                onClick={() => onSave(item)}
              >
                <Save className="w-2.5 h-2.5" />
                SAVE
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-6 px-2 font-mono text-[9px] border-card-border bg-background hover:bg-secondary text-muted-foreground gap-1"
                onClick={() => onPublish(item)}
              >
                <SendToBack className="w-2.5 h-2.5" />
                PUBLISH
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
