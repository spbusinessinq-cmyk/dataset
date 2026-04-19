import { Signal } from "@/lib/mock-data";
import { Download, Save, FileText, Table2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useSaveSignal, useAppendOpsLog, getListSignalsQueryKey, getListOpsLogQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

interface OutputPanelProps {
  signal: Signal | null;
  isProcessing: boolean;
  onGenerateBrief: () => void;
}

export default function OutputPanel({ signal, isProcessing, onGenerateBrief }: OutputPanelProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const saveSignal = useSaveSignal();
  const appendLog = useAppendOpsLog();

  const formatTimestamp = (ts: string) => {
    try {
      return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    } catch {
      return ts;
    }
  };

  const handleSave = () => {
    if (!signal) return;
    saveSignal.mutate(
      { data: signal },
      {
        onSuccess: () => {
          appendLog.mutate(
            { data: { message: `Signal ${signal.id} saved — ${signal.title.slice(0, 40)}`, level: "info" } },
            { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListOpsLogQueryKey() }) },
          );
          queryClient.invalidateQueries({ queryKey: getListSignalsQueryKey() });
          toast({
            title: "Signal Saved",
            description: `${signal.id} archived successfully`,
            className: "font-mono border-primary bg-background text-foreground",
          });
        },
        onError: () => {
          toast({
            title: "Save Failed",
            description: "Could not save signal — backend may be unavailable",
            variant: "destructive",
            className: "font-mono",
          });
        },
      },
    );
  };

  const handleExportJson = () => {
    if (!signal) return;
    const json = JSON.stringify(signal, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rsr-signal-${signal.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
    appendLog.mutate(
      { data: { message: `Export JSON — signal ${signal.id}`, level: "info" } },
      { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListOpsLogQueryKey() }) },
    );
    toast({
      title: "Export Complete",
      description: `rsr-signal-${signal.id}.json downloaded`,
      className: "font-mono border-primary bg-background text-foreground",
    });
  };

  const handleExportCsv = () => {
    if (!signal) return;
    const headers = ["id", "title", "classification", "source", "sourceType", "confidence", "engine", "timestamp", "summary", "whyItMatters", "tags", "entities", "systemImpact"];
    const row = [
      signal.id,
      `"${signal.title.replace(/"/g, '""')}"`,
      signal.classification,
      `"${(signal.source ?? "").replace(/"/g, '""')}"`,
      signal.sourceType ?? "",
      signal.confidence,
      signal.engine,
      signal.timestamp,
      `"${signal.summary.replace(/"/g, '""')}"`,
      `"${signal.whyItMatters.replace(/"/g, '""')}"`,
      `"${signal.tags.join("; ")}"`,
      `"${signal.entities.join("; ")}"`,
      `"${signal.systemImpact.join("; ")}"`,
    ];
    const csv = [headers.join(","), row.join(",")].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rsr-signal-${signal.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    appendLog.mutate(
      { data: { message: `Export CSV — signal ${signal.id}`, level: "info" } },
      { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListOpsLogQueryKey() }) },
    );
    toast({
      title: "Export Complete",
      description: `rsr-signal-${signal.id}.csv downloaded`,
      className: "font-mono border-primary bg-background text-foreground",
    });
  };

  const isBusy = saveSignal.isPending;

  return (
    <div className="glass-panel p-4 flex flex-col gap-4" data-testid="panel-output">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-card-border pb-2 mb-2">
        <h2 className="font-mono text-sm font-bold tracking-wide text-foreground">EXPORT & PUBLISH</h2>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            signal ? "bg-primary" : isProcessing ? "bg-amber-500 animate-pulse" : "bg-muted-foreground/40"
          }`} />
          <span className="font-mono text-[10px] text-muted-foreground" data-testid="status-output">
            {signal ? "SIGNAL READY" : isProcessing ? "PROCESSING..." : "AWAITING OUTPUT"}
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col gap-2.5">
        <Button
          variant="outline"
          className="w-full justify-start font-mono text-xs border-primary/40 bg-background hover:bg-primary/10 text-foreground h-10 transition-all"
          disabled={!signal || isProcessing || isBusy}
          onClick={handleSave}
          data-testid="btn-save"
        >
          <Save className="w-4 h-4 mr-2 text-primary shrink-0" />
          {saveSignal.isPending ? "SAVING..." : "SAVE SIGNAL"}
        </Button>

        <Button
          variant="outline"
          className="w-full justify-start font-mono text-xs border-primary/40 bg-background hover:bg-primary/10 text-foreground h-10 transition-all"
          disabled={!signal || isProcessing}
          onClick={onGenerateBrief}
          data-testid="btn-generate-brief"
        >
          <FileText className="w-4 h-4 mr-2 text-primary shrink-0" />
          GENERATE BRIEF
        </Button>

        <div className="border-t border-card-border/40 pt-2 flex flex-col gap-2">
          <Button
            variant="ghost"
            className="w-full justify-start font-mono text-xs text-muted-foreground hover:text-foreground hover:bg-secondary h-9 border border-card-border border-dashed transition-all"
            disabled={!signal || isProcessing}
            onClick={handleExportJson}
            data-testid="btn-export-json"
          >
            <Download className="w-3.5 h-3.5 mr-2 shrink-0" />
            EXPORT JSON
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start font-mono text-xs text-muted-foreground hover:text-foreground hover:bg-secondary h-9 border border-card-border border-dashed transition-all"
            disabled={!signal || isProcessing}
            onClick={handleExportCsv}
            data-testid="btn-export-csv"
          >
            <Table2 className="w-3.5 h-3.5 mr-2 shrink-0" />
            EXPORT CSV
          </Button>
        </div>
      </div>

      {/* Signal preview */}
      <div className="mt-auto pt-3 flex flex-col gap-2">
        <h4 className="font-mono text-[10px] text-muted-foreground tracking-widest">SIGNAL PREVIEW</h4>
        <div className="bg-background border border-card-border rounded-md p-3 min-h-[80px] flex flex-col justify-center">
          {signal ? (
            <div className="flex flex-col gap-2" data-testid="preview-content">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-primary">{signal.id}</span>
                <span className="font-mono text-[9px] text-muted-foreground">{formatTimestamp(signal.timestamp)}</span>
              </div>
              <p className="font-sans text-xs text-foreground font-medium line-clamp-2 leading-snug">
                {signal.title}
              </p>
              <div className="flex items-center gap-2">
                <span className={`font-mono text-[9px] ${
                  signal.classification === "CRITICAL" ? "text-destructive" :
                  signal.classification === "ELEVATED" ? "text-amber-500" :
                  "text-primary"
                }`}>
                  {signal.classification}
                </span>
                <span className="text-muted-foreground/30">·</span>
                <span className="font-mono text-[9px] text-muted-foreground">{signal.confidence}%</span>
                {signal.sourceType && (
                  <>
                    <span className="text-muted-foreground/30">·</span>
                    <span className="font-mono text-[9px] text-muted-foreground">{signal.sourceType}</span>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1 text-center">
              <span className="font-mono text-xs text-muted-foreground/40">[NO SIGNAL]</span>
              <span className="font-mono text-[9px] text-muted-foreground/30">Analyze a signal to enable export</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
