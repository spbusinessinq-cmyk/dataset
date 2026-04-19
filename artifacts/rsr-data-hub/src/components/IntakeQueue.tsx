import { useState } from "react";
import { Signal } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Inbox, Cpu, Save, X, Monitor, Radio, CheckCircle2, Info } from "lucide-react";

interface IntakeQueueProps {
  items: Signal[];
  isAnalyzing?: boolean;
  savedIds?: Set<string>;
  onAnalyze: (signal: Signal) => void;
  onSave: (signal: Signal) => void;
  onLoad: (signal: Signal) => void;
  onDismiss: (id: string) => void;
}

const SOURCE_TYPE_COLORS: Record<string, string> = {
  News:     "text-blue-400 border-blue-400/60 bg-blue-400/10",
  Social:   "text-purple-400 border-purple-400/60 bg-purple-400/10",
  Document: "text-amber-400 border-amber-400/60 bg-amber-400/10",
  Contract: "text-orange-400 border-orange-400/60 bg-orange-400/10",
  Dataset:  "text-cyan-400 border-cyan-400/60 bg-cyan-400/10",
  Filing:   "text-rose-400 border-rose-400/60 bg-rose-400/10",
  Market:   "text-emerald-400 border-emerald-400/60 bg-emerald-400/10",
  Manual:   "text-gray-400 border-gray-400/60 bg-gray-400/10",
};

const STATE_CONFIG: Record<string, { label: string; color: string; desc: string }> = {
  pulled:   { label: "PULLED",   color: "text-blue-400",    desc: "Fetched from live source — not yet saved" },
  analyzed: { label: "ANALYZED", color: "text-primary",     desc: "Processed by analysis engine — saved to archive" },
  saved:    { label: "SAVED",    color: "text-emerald-400", desc: "Written to signal archive" },
  uploaded: { label: "UPLOADED", color: "text-amber-400",   desc: "Uploaded via file import" },
};

function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}

type FilterType = "all" | "analyzed" | "pulled";

export default function IntakeQueue({
  items,
  isAnalyzing,
  savedIds,
  onAnalyze,
  onSave,
  onLoad,
  onDismiss,
}: IntakeQueueProps) {
  const [filter, setFilter] = useState<FilterType>("all");

  const filtered = filter === "all" ? items : items.filter((i) => i.status === filter);
  const analyzedCount = items.filter((i) => i.status === "analyzed").length;
  const pulledCount   = items.filter((i) => i.status === "pulled").length;

  return (
    <div className="glass-panel p-4 flex flex-col gap-3" data-testid="panel-intake-queue">

      {/* Header */}
      <div className="flex items-center justify-between border-b border-card-border pb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="font-mono text-sm font-bold tracking-wide text-foreground">INTAKE QUEUE</h2>
          <span className="font-mono text-[10px] text-primary border border-primary/30 rounded px-1.5 py-0.5">
            {items.length} PENDING
          </span>
          {analyzedCount > 0 && (
            <span className="font-mono text-[10px] text-primary border border-primary/30 rounded px-1.5 py-0.5">
              {analyzedCount} ANALYZED
            </span>
          )}
          {pulledCount > 0 && (
            <span className="font-mono text-[10px] text-blue-400 border border-blue-400/30 rounded px-1.5 py-0.5">
              {pulledCount} RAW
            </span>
          )}
        </div>
        <Inbox className="w-4 h-4 text-muted-foreground shrink-0" />
      </div>

      {/* Workflow legend */}
      <div className="flex items-center gap-1.5 px-1 py-1 bg-secondary/30 rounded border border-card-border/60">
        <Info className="w-3 h-3 text-muted-foreground/60 shrink-0" />
        <span className="font-mono text-[9px] text-muted-foreground/70">
          Queue = live pulled, unprocessed signals &nbsp;·&nbsp; Archive = analyzed + saved signals &nbsp;·&nbsp;
          <span className="text-blue-400">PULLED</span> →{" "}
          <span className="text-primary">ANALYZED</span> →{" "}
          <span className="text-emerald-400">SAVED</span>
        </span>
      </div>

      {/* Filter tabs */}
      {items.length > 0 && (
        <div className="flex gap-1">
          {(["all", "analyzed", "pulled"] as FilterType[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`font-mono text-[9px] tracking-widest px-2 py-1 rounded border transition-colors uppercase ${
                filter === f
                  ? "border-primary/60 text-primary bg-primary/10"
                  : "border-card-border text-muted-foreground hover:text-foreground hover:border-primary/30"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      )}

      {/* Empty state */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 gap-3">
          <div className="w-10 h-10 rounded-full border border-card-border flex items-center justify-center">
            <Radio className="w-4 h-4 text-muted-foreground/40" />
          </div>
          <div className="flex flex-col items-center gap-1 text-center">
            <span className="font-mono text-xs text-muted-foreground tracking-widest">No live signals loaded yet.</span>
            <span className="font-mono text-[10px] text-muted-foreground/50">Pull signals to begin.</span>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex items-center justify-center py-4">
          <span className="font-mono text-[10px] text-muted-foreground/50">No items match filter.</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 max-h-[380px] overflow-y-auto pr-1">
          {filtered.map((item) => {
            const isSaved    = savedIds?.has(item.id) || item.status === "saved";
            const isAnalyzed = item.status === "analyzed";
            const stateConf  = STATE_CONFIG[item.status ?? "pulled"] ?? STATE_CONFIG["pulled"];

            return (
              <div
                key={item.id}
                className={`border rounded p-3 flex flex-col gap-2 transition-colors ${
                  isAnalyzed ? "border-primary/30 bg-primary/5" :
                  isSaved    ? "border-emerald-400/20 bg-emerald-400/5" :
                               "border-card-border/60 bg-background/40"
                }`}
                data-testid={`queue-item-${item.id}`}
              >
                {/* Top row: state badge + source type + dismiss */}
                <div className="flex items-start gap-2">
                  <div className="flex gap-1.5 flex-wrap flex-1 min-w-0">
                    {/* State badge — most prominent */}
                    <span className={`font-mono text-[8px] font-bold flex items-center gap-0.5 ${stateConf.color}`}>
                      {isAnalyzed || isSaved ? <CheckCircle2 className="w-2.5 h-2.5" /> : null}
                      {stateConf.label}
                    </span>

                    {item.sourceType && (
                      <Badge
                        variant="outline"
                        className={`font-mono text-[8px] px-1.5 py-0 rounded-sm border uppercase shrink-0 ${
                          SOURCE_TYPE_COLORS[item.sourceType] ?? SOURCE_TYPE_COLORS["Manual"]
                        }`}
                      >
                        {item.sourceType}
                      </Badge>
                    )}

                    {item.classification && isAnalyzed && (
                      <Badge
                        variant="outline"
                        className={`font-mono text-[8px] px-1.5 py-0 rounded-sm border uppercase shrink-0 ${
                          item.classification === "CRITICAL" ? "text-destructive border-destructive bg-destructive/10" :
                          item.classification === "ELEVATED" ? "text-amber-500 border-amber-500 bg-amber-500/10" :
                          item.classification === "WATCH"    ? "text-blue-400 border-blue-400 bg-blue-400/10" :
                          "text-primary border-primary bg-primary/10"
                        }`}
                      >
                        {item.classification}
                      </Badge>
                    )}
                  </div>
                  <button
                    className="text-muted-foreground/40 hover:text-destructive transition-colors shrink-0 mt-0.5"
                    onClick={() => onDismiss(item.id)}
                    title="Dismiss from queue"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>

                {/* Title + metadata */}
                <div>
                  <p className="font-mono text-[11px] text-foreground leading-snug line-clamp-2 break-words">
                    {item.title}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <span className="font-mono text-[9px] text-muted-foreground truncate max-w-[120px]">{item.source}</span>
                    <span className="text-muted-foreground/30">·</span>
                    <span className="font-mono text-[9px] text-muted-foreground">{formatTimestamp(item.timestamp)}</span>
                    {item.confidence > 0 && (
                      <>
                        <span className="text-muted-foreground/30">·</span>
                        <span className="font-mono text-[9px] text-muted-foreground">{item.confidence}%</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Summary snippet */}
                {item.summary && (
                  <p className="font-mono text-[10px] text-muted-foreground leading-relaxed line-clamp-2">
                    {item.summary}
                  </p>
                )}

                {/* Action buttons with descriptions */}
                <div className="flex flex-col gap-1.5 mt-auto">
                  <div className="flex gap-1 flex-wrap">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 font-mono text-[9px] border-primary/30 bg-background hover:bg-primary/10 text-primary gap-1"
                      onClick={() => onAnalyze(item)}
                      disabled={isAnalyzing}
                      title="Run analysis engine on this signal — result loads into workspace and is auto-saved to archive"
                    >
                      <Cpu className="w-2.5 h-2.5" />
                      ANALYZE
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 font-mono text-[9px] border-card-border bg-background hover:bg-secondary text-muted-foreground gap-1"
                      onClick={() => onLoad(item)}
                      title="Load this signal into workspace panel without re-analyzing"
                    >
                      <Monitor className="w-2.5 h-2.5" />
                      LOAD
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className={`h-7 px-2 font-mono text-[9px] gap-1 border-card-border bg-background transition-colors ${
                        isSaved
                          ? "text-emerald-400 border-emerald-400/30 cursor-default"
                          : "text-muted-foreground hover:bg-secondary"
                      }`}
                      onClick={() => !isSaved && onSave(item)}
                      disabled={isSaved}
                      title={isSaved ? "Already saved to archive" : "Write this signal to archive (signals.json)"}
                    >
                      <Save className="w-2.5 h-2.5" />
                      {isSaved ? "SAVED" : "SAVE"}
                    </Button>
                  </div>

                  {/* Micro action descriptions */}
                  <div className="font-mono text-[8px] text-muted-foreground/50 leading-tight px-0.5">
                    {isAnalyzing ? (
                      <span className="text-primary/70">Analyzing — standby...</span>
                    ) : isAnalyzed ? (
                      <span>Analyzed + auto-saved to archive · LOAD to view · SAVE if not yet archived</span>
                    ) : (
                      <span>ANALYZE → runs engine · LOAD → view as-is · SAVE → archive raw</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
