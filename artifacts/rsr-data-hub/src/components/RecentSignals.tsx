import { Signal } from "@/lib/mock-data";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Database } from "lucide-react";

interface RecentSignalsProps {
  signals: Signal[];
  isLoading?: boolean;
}

function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function RecentSignals({ signals, isLoading }: RecentSignalsProps) {
  return (
    <div className="glass-panel p-4 flex flex-col gap-4 h-full" data-testid="panel-recent-signals">
      <div className="flex items-center justify-between border-b border-card-border pb-2 mb-1">
        <h2 className="font-mono text-sm font-bold tracking-wide text-foreground">RECENT SIGNALS</h2>
        <div className="flex items-center gap-2">
          {signals.length > 0 && (
            <span className="font-mono text-[10px] text-muted-foreground">{signals.length} RECORDS</span>
          )}
          <Database className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <span className="font-mono text-xs text-muted-foreground animate-pulse">LOADING SIGNALS...</span>
        </div>
      ) : signals.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <span className="font-mono text-xs text-muted-foreground/50">[NO SIGNALS RECORDED]</span>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-card-border hover:bg-transparent">
                <TableHead className="font-mono text-[10px] text-muted-foreground w-[90px]">ID</TableHead>
                <TableHead className="font-mono text-[10px] text-muted-foreground">TITLE</TableHead>
                <TableHead className="font-mono text-[10px] text-muted-foreground w-[100px]">ENGINE</TableHead>
                <TableHead className="font-mono text-[10px] text-muted-foreground w-[120px]">CLASSIFICATION</TableHead>
                <TableHead className="font-mono text-[10px] text-muted-foreground text-right w-[90px]">CONF</TableHead>
                <TableHead className="font-mono text-[10px] text-muted-foreground text-right w-[110px]">TIMESTAMP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {signals.map((sig) => (
                <TableRow key={sig.id} className="border-card-border/50 hover:bg-secondary/50 group cursor-pointer transition-colors" data-testid={`row-signal-${sig.id}`}>
                  <TableCell className="font-mono text-xs text-primary font-medium">{sig.id}</TableCell>
                  <TableCell className="font-sans text-xs text-foreground group-hover:text-primary transition-colors truncate max-w-[200px] lg:max-w-xs">{sig.title}</TableCell>
                  <TableCell className="font-mono text-[10px] text-secondary-foreground">{sig.engine}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`font-mono text-[9px] rounded-sm px-1.5 py-0 border-opacity-50 uppercase ${
                        sig.classification === "CRITICAL" ? "text-destructive border-destructive bg-destructive/10" :
                        sig.classification === "ELEVATED" ? "text-amber-500 border-amber-500 bg-amber-500/10" :
                        sig.classification === "WATCH" ? "text-blue-400 border-blue-400 bg-blue-400/10" :
                        "text-primary border-primary bg-primary/10"
                      }`}
                    >
                      {sig.classification}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-mono text-xs font-bold text-foreground">{sig.confidence}%</span>
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
