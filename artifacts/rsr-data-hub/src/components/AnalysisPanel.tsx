import { Signal } from "@/lib/mock-data";
import { Cpu, Tag, AlertTriangle, ActivitySquare, ShieldAlert, Clock, Radio } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AnalysisPanelProps {
  signal: Signal | null;
  isProcessing: boolean;
  engine?: string;
}

const SOURCE_TYPE_COLORS: Record<string, string> = {
  News:     "text-blue-400 border-blue-400/40 bg-blue-400/10",
  Social:   "text-purple-400 border-purple-400/40 bg-purple-400/10",
  Document: "text-amber-400 border-amber-400/40 bg-amber-400/10",
  Contract: "text-orange-400 border-orange-400/40 bg-orange-400/10",
  Dataset:  "text-cyan-400 border-cyan-400/40 bg-cyan-400/10",
  Filing:   "text-rose-400 border-rose-400/40 bg-rose-400/10",
  Market:   "text-emerald-400 border-emerald-400/40 bg-emerald-400/10",
  Manual:   "text-gray-400 border-gray-400/40 bg-gray-400/10",
};

function formatTimestamp(iso: string): string {
  try {
    return new Date(iso).toLocaleString([], {
      month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
      timeZoneName: "short",
    });
  } catch {
    return iso;
  }
}

export default function AnalysisPanel({ signal, isProcessing, engine = "AXION" }: AnalysisPanelProps) {
  return (
    <div className="glass-panel p-4 flex flex-col gap-4 relative overflow-hidden" data-testid="panel-analysis">
      <div className="flex items-center justify-between border-b border-card-border pb-2 mb-2 z-10">
        <h2 className="font-mono text-sm font-bold tracking-wide text-foreground">ANALYSIS RESULT</h2>
        <Cpu className="w-4 h-4 text-primary" />
      </div>

      {isProcessing ? (
        <div className="flex-1 flex items-center justify-center flex-col gap-4 z-10" data-testid="state-processing">
          <div className="w-12 h-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
          <div className="flex flex-col items-center gap-1">
            <span className="font-mono text-xs text-primary animate-pulse tracking-widest">
              RUNNING {engine.toUpperCase()} ENGINE...
            </span>
            <span className="font-mono text-[10px] text-muted-foreground">Processing signal — standby</span>
          </div>
        </div>
      ) : !signal ? (
        <div className="flex-1 flex items-center justify-center flex-col gap-3 z-10" data-testid="state-empty">
          <div className="w-10 h-10 rounded-full border border-card-border flex items-center justify-center">
            <Cpu className="w-4 h-4 text-muted-foreground/40" />
          </div>
          <div className="flex flex-col items-center gap-1 text-center">
            <span className="font-mono text-xs text-muted-foreground tracking-widest">
              Select or analyze a signal to begin.
            </span>
            <span className="font-mono text-[10px] text-muted-foreground/50">
              Use Ingest panel or click archive row
            </span>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-1 z-10" data-testid="content-analysis">

          {/* ── Source metadata strip ──────────────────────────────────── */}
          <div className="flex items-center gap-2 flex-wrap pb-3 border-b border-card-border/60">
            {signal.sourceType && (
              <Badge
                variant="outline"
                className={`font-mono text-[9px] px-1.5 py-0 rounded-sm border uppercase ${
                  SOURCE_TYPE_COLORS[signal.sourceType] ?? "text-muted-foreground border-muted-foreground"
                }`}
              >
                {signal.sourceType}
              </Badge>
            )}
            <span className="font-mono text-[10px] text-muted-foreground flex items-center gap-1">
              <Radio className="w-2.5 h-2.5" />
              {signal.source}
            </span>
            <span className="text-muted-foreground/30">·</span>
            <span className="font-mono text-[10px] text-muted-foreground flex items-center gap-1">
              <Clock className="w-2.5 h-2.5" />
              {formatTimestamp(signal.timestamp)}
            </span>
            <span className="text-muted-foreground/30">·</span>
            <span className="font-mono text-[10px] text-muted-foreground">
              {String(signal.engine).toUpperCase()}
            </span>
          </div>

          {/* ── Classification + confidence ────────────────────────────── */}
          <div className="flex justify-between items-center">
            <Badge
              variant="outline"
              className={`font-mono text-xs rounded-sm px-2.5 py-0.5 border uppercase font-bold ${
                signal.classification === "CRITICAL" ? "text-destructive border-destructive bg-destructive/10" :
                signal.classification === "ELEVATED" ? "text-amber-500 border-amber-500 bg-amber-500/10" :
                signal.classification === "WATCH"    ? "text-blue-400 border-blue-400 bg-blue-400/10" :
                "text-primary border-primary bg-primary/10"
              }`}
              data-testid="badge-classification"
            >
              {signal.classification}
            </Badge>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-muted-foreground">CONFIDENCE</span>
              <div className="flex items-center gap-1.5">
                <div className="w-20 h-1.5 bg-background rounded-full overflow-hidden border border-card-border">
                  <div
                    className={`h-full transition-all duration-1000 ease-out ${
                      signal.confidence >= 80 ? "bg-primary" :
                      signal.confidence >= 60 ? "bg-amber-500" : "bg-destructive"
                    }`}
                    style={{ width: `${signal.confidence}%` }}
                  />
                </div>
                <span className="font-mono text-sm text-primary font-bold">{signal.confidence}%</span>
              </div>
            </div>
          </div>

          {/* ── Title ─────────────────────────────────────────────────── */}
          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-[9px] text-muted-foreground tracking-widest">SIGNAL TITLE</span>
            <h3
              className="font-sans font-bold text-base leading-snug text-foreground"
              data-testid="text-signal-title"
            >
              {signal.title}
            </h3>
          </div>

          {/* ── Summary ───────────────────────────────────────────────── */}
          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-[9px] text-muted-foreground tracking-widest">SUMMARY</span>
            <p
              className="font-sans text-sm text-secondary-foreground leading-relaxed"
              data-testid="text-summary"
            >
              {signal.summary}
            </p>
          </div>

          {/* ── Why It Matters ────────────────────────────────────────── */}
          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-[9px] text-primary tracking-widest">WHY IT MATTERS</span>
            <p className="font-sans text-sm text-foreground leading-relaxed border-l-2 border-primary/50 pl-3 py-1 bg-primary/5 rounded-r">
              {signal.whyItMatters}
            </p>
          </div>

          {/* ── Tags + Entities ───────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <h4 className="font-mono text-[9px] text-muted-foreground tracking-widest flex items-center gap-1">
                <Tag className="w-3 h-3" /> IMPACT TAGS
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {signal.tags.map(tag => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="font-mono text-[9px] rounded-sm bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <h4 className="font-mono text-[9px] text-muted-foreground tracking-widest flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> ENTITIES
              </h4>
              <div className="flex flex-col gap-1">
                {signal.entities.map(entity => (
                  <span key={entity} className="font-sans text-xs text-foreground font-medium flex items-center gap-1.5">
                    <span className="w-1 h-1 shrink-0 rounded-full bg-muted-foreground" />
                    {entity}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* ── System Impact ─────────────────────────────────────────── */}
          {signal.systemImpact?.length > 0 && (
            <div className="flex flex-col gap-2">
              <h4 className="font-mono text-[9px] text-muted-foreground tracking-widest flex items-center gap-1">
                <ShieldAlert className="w-3 h-3" /> SYSTEM IMPACT
              </h4>
              <div className="grid grid-cols-2 gap-1.5">
                {signal.systemImpact.map(impact => (
                  <div key={impact} className="flex items-center gap-1.5 bg-background border border-card-border p-1.5 rounded">
                    <ActivitySquare className="w-3 h-3 shrink-0 text-primary" />
                    <span className="font-sans text-[11px] text-secondary-foreground leading-tight">{impact}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Signal ID footer ──────────────────────────────────────── */}
          <div className="flex justify-between items-center pt-2 border-t border-card-border/40 mt-auto">
            <span className="font-mono text-[10px] text-primary">{signal.id}</span>
            <span className="font-mono text-[10px] text-muted-foreground">
              {signal.status?.toUpperCase() ?? "—"}
            </span>
          </div>
        </div>
      )}

      {/* Decorative scan line */}
      {isProcessing && (
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-primary/50 shadow-[0_0_10px_hsl(var(--primary))] animate-[scan_2s_ease-in-out_infinite] z-0" />
      )}
    </div>
  );
}
