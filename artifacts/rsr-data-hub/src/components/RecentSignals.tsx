import { useState } from "react";
import { Signal } from "@/lib/mock-data";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Database } from "lucide-react";

interface RecentSignalsProps {
  signals: Signal[];
  isLoading?: boolean;
  onSelect?: (signal: Signal) => void;
}

const SOURCE_TYPE_COLORS: Record<string, string> = {
  News:     "text-blue-400/80 border-blue-400/40 bg-blue-400/5",
  Social:   "text-purple-400/80 border-purple-400/40 bg-purple-400/5",
  Document: "text-amber-400/80 border-amber-400/40 bg-amber-400/5",
  Contract: "text-orange-400/80 border-orange-400/40 bg-orange-400/5",
  Dataset:  "text-cyan-400/80 border-cyan-400/40 bg-cyan-400/5",
  Filing:   "text-rose-400/80 border-rose-400/40 bg-rose-400/5",
  Market:   "text-emerald-400/80 border-emerald-400/40 bg-emerald-400/5",
  Manual:   "text-gray-400/80 border-gray-400/40 bg-gray-400/5",
};

const CLASS_FILTERS = ["ALL", "CRITICAL", "ELEVATED", "WATCH", "ROUTINE"] as const;
type ClassFilter = (typeof CLASS_FILTERS)[number];

function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}

export default function RecentSignals({ signals, isLoading, onSelect }: RecentSignalsProps) {
  const [classFilter, setClassFilter] = useState<ClassFilter>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");

  const sourceTypes = ["ALL", ...Array.from(new Set(signals.map((s) => s.sourceType ?? "Manual")))];

  const filtered = signals.filter((s) => {
    const matchClass = classFilter === "ALL" || s.classification === classFilter;
    const matchType  = typeFilter  === "ALL" || (s.sourceType ?? "Manual") === typeFilter;
    return matchClass && matchType;
  });

  return (
    <div className="glass-panel p-4 flex flex-col gap-3 h-full" data-testid="panel-recent-signals">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-card-border pb-2">
        <h2 className="font-mono text-sm font-bold tracking-wide text-foreground">SIGNAL ARCHIVE</h2>
        <div className="flex items-center gap-3">
          {signals.length > 0 && (
            <span className="font-mono text-[10px] text-muted-foreground">{signals.length} RECORDS</span>
          )}
          <Database className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>

      {/* Filters */}
      {!isLoading && signals.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {/* Classification filter */}
          <div className="flex gap-1">
            {CLASS_FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setClassFilter(f)}
                className={`font-mono text-[9px] tracking-widest px-2 py-0.5 rounded border transition-colors ${
                  classFilter === f
                    ? f === "CRITICAL" ? "border-destructive/60 text-destructive bg-destructive/10"
                    : f === "ELEVATED" ? "border-amber-500/60 text-amber-500 bg-amber-500/10"
                    : f === "WATCH"    ? "border-blue-400/60 text-blue-400 bg-blue-400/10"
                    : "border-primary/60 text-primary bg-primary/10"
                    : "border-card-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Source type filter */}
          {sourceTypes.length > 2 && (
            <div className="flex gap-1">
              {sourceTypes.map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`font-mono text-[9px] tracking-widest px-2 py-0.5 rounded border transition-colors ${
                    typeFilter === t
                      ? "border-primary/50 text-primary bg-primary/10"
                      : "border-card-border text-muted-foreground/60 hover:border-primary/20 hover:text-muted-foreground"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <span className="font-mono text-xs text-muted-foreground animate-pulse">LOADING SIGNALS...</span>
        </div>
      ) : signals.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 py-6">
          <Database className="w-6 h-6 text-muted-foreground/30" />
          <span className="font-mono text-xs text-muted-foreground/50">[NO SIGNALS ARCHIVED]</span>
          <span className="font-mono text-[10px] text-muted-foreground/40">
            Analyze and save a signal to build the archive.
          </span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex items-center justify-center py-4">
          <span className="font-mono text-[10px] text-muted-foreground/50">No signals match active filters.</span>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-card-border hover:bg-transparent">
                <TableHead className="font-mono text-[10px] text-muted-foreground w-[80px]">ID</TableHead>
                <TableHead className="font-mono text-[10px] text-muted-foreground">TITLE</TableHead>
                <TableHead className="font-mono text-[10px] text-muted-foreground w-[85px]">TYPE</TableHead>
                <TableHead className="font-mono text-[10px] text-muted-foreground w-[75px]">ENGINE</TableHead>
                <TableHead className="font-mono text-[10px] text-muted-foreground w-[105px]">CLASS</TableHead>
                <TableHead className="font-mono text-[10px] text-muted-foreground text-right w-[55px]">CONF</TableHead>
                <TableHead className="font-mono text-[10px] text-muted-foreground text-right w-[110px]">TIME</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((sig) => (
                <TableRow
                  key={sig.id}
                  className="border-card-border/50 hover:bg-secondary/50 group cursor-pointer transition-colors"
                  data-testid={`row-signal-${sig.id}`}
                  onClick={() => onSelect?.(sig)}
                  title="Click to load into analysis panel"
                >
                  <TableCell className="font-mono text-xs text-primary font-medium group-hover:text-primary/80">
                    {sig.id}
                  </TableCell>
                  <TableCell className="font-sans text-xs text-foreground group-hover:text-primary transition-colors truncate max-w-[160px] lg:max-w-[240px]">
                    {sig.title}
                  </TableCell>
                  <TableCell>
                    {sig.sourceType ? (
                      <Badge
                        variant="outline"
                        className={`font-mono text-[8px] rounded-sm px-1 py-0 border uppercase ${
                          SOURCE_TYPE_COLORS[sig.sourceType] ?? "text-muted-foreground border-muted-foreground"
                        }`}
                      >
                        {sig.sourceType}
                      </Badge>
                    ) : (
                      <span className="font-mono text-[9px] text-muted-foreground/40">—</span>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-[10px] text-muted-foreground uppercase">
                    {sig.engine}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`font-mono text-[9px] rounded-sm px-1.5 py-0 border uppercase ${
                        sig.classification === "CRITICAL" ? "text-destructive border-destructive bg-destructive/10" :
                        sig.classification === "ELEVATED" ? "text-amber-500 border-amber-500 bg-amber-500/10" :
                        sig.classification === "WATCH"    ? "text-blue-400 border-blue-400 bg-blue-400/10" :
                        "text-primary border-primary bg-primary/10"
                      }`}
                    >
                      {sig.classification}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={`font-mono text-xs font-bold ${
                      sig.confidence >= 80 ? "text-primary" :
                      sig.confidence >= 60 ? "text-amber-500" : "text-muted-foreground"
                    }`}>
                      {sig.confidence}%
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-mono text-[10px] text-muted-foreground">
                    {formatTimestamp(sig.timestamp)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
