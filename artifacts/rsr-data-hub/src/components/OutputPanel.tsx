import { Signal } from "@/lib/mock-data";
import { Share, Download, Save, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useSaveSignal, usePublishSignal, useAppendOpsLog, getListSignalsQueryKey, getListOpsLogQueryKey } from "@workspace/api-client-react";
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
  const publishSignal = usePublishSignal();
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
            { data: { message: `Signal ${signal.id} saved manually — ${signal.title.slice(0, 40)}`, level: "info" } },
            { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListOpsLogQueryKey() }) },
          );
          queryClient.invalidateQueries({ queryKey: getListSignalsQueryKey() });
          toast({
            title: "Signal Saved",
            description: `${signal.id} saved to local storage`,
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

  const handlePublish = () => {
    if (!signal) return;
    publishSignal.mutate(
      { data: signal },
      {
        onSuccess: () => {
          appendLog.mutate(
            { data: { message: `Signal ${signal.id} published to site — ${signal.title.slice(0, 40)}`, level: "info" } },
            { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListOpsLogQueryKey() }) },
          );
          toast({
            title: "Published",
            description: `${signal.id} published successfully`,
            className: "font-mono border-primary bg-background text-foreground",
          });
        },
        onError: () => {
          toast({
            title: "Publish Failed",
            description: "Could not publish — backend may be unavailable",
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
    a.download = `${signal.id}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    appendLog.mutate(
      { data: { message: `Export JSON generated for signal ${signal.id}`, level: "info" } },
      { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListOpsLogQueryKey() }) },
    );
    toast({
      title: "Export Ready",
      description: `${signal.id}.json downloaded`,
      className: "font-mono border-primary bg-background text-foreground",
    });
  };

  const isBusy = saveSignal.isPending || publishSignal.isPending;

  return (
    <div className="glass-panel p-4 flex flex-col gap-4" data-testid="panel-output">
      <div className="flex items-center justify-between border-b border-card-border pb-2 mb-2">
        <h2 className="font-mono text-sm font-bold tracking-wide text-foreground">EXPORT & PUBLISH</h2>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${signal ? "bg-primary" : isProcessing ? "bg-amber-500 animate-pulse" : "bg-muted-foreground"}`}></div>
          <span className="font-mono text-[10px] text-muted-foreground" data-testid="status-output">
            {signal ? "SIGNAL READY" : isProcessing ? "PROCESSING..." : "AWAITING OUTPUT"}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Button
          variant="outline"
          className="w-full justify-start font-mono text-xs border-primary/40 bg-background hover:bg-primary/10 text-foreground h-10 transition-all"
          disabled={!signal || isProcessing || isBusy}
          onClick={handleSave}
          data-testid="btn-save"
        >
          <Save className="w-4 h-4 mr-2 text-primary" />
          {saveSignal.isPending ? "SAVING..." : "SAVE SIGNAL"}
        </Button>

        <Button
          variant="outline"
          className="w-full justify-start font-mono text-xs border-primary/40 bg-background hover:bg-primary/10 text-foreground h-10 transition-all"
          disabled={!signal || isProcessing}
          onClick={onGenerateBrief}
          data-testid="btn-generate-brief"
        >
          <FileText className="w-4 h-4 mr-2 text-primary" />
          GENERATE BRIEF
        </Button>

        <Button
          className="w-full justify-start font-mono text-xs bg-primary text-primary-foreground hover:bg-primary/90 h-10 transition-all shadow-[0_0_15px_hsl(var(--primary)/0.2)]"
          disabled={!signal || isProcessing || isBusy}
          onClick={handlePublish}
          data-testid="btn-publish"
        >
          <Share className="w-4 h-4 mr-2" />
          {publishSignal.isPending ? "PUBLISHING..." : "PUBLISH TO SITE"}
        </Button>

        <Button
          variant="ghost"
          className="w-full justify-start font-mono text-xs text-muted-foreground hover:text-foreground hover:bg-secondary h-10 border border-card-border border-dashed transition-all"
          disabled={!signal || isProcessing}
          onClick={handleExportJson}
          data-testid="btn-export-json"
        >
          <Download className="w-4 h-4 mr-2" />
          EXPORT JSON
        </Button>
      </div>

      <div className="mt-auto pt-4 flex flex-col gap-2">
        <h4 className="font-mono text-[10px] text-muted-foreground tracking-widest">SIGNAL PREVIEW</h4>
        <div className="bg-background border border-card-border rounded-md p-3 min-h-[80px] flex flex-col justify-center">
          {signal ? (
            <div className="flex flex-col gap-2" data-testid="preview-content">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-primary">{signal.id}</span>
                <span className="font-mono text-[9px] text-muted-foreground">{formatTimestamp(signal.timestamp)}</span>
              </div>
              <p className="font-sans text-xs text-foreground font-medium line-clamp-2">{signal.title}</p>
              <span className={`font-mono text-[9px] self-start ${
                signal.classification === "CRITICAL" ? "text-destructive" :
                signal.classification === "ELEVATED" ? "text-amber-500" :
                "text-primary"
              }`}>{signal.classification}</span>
            </div>
          ) : (
            <span className="font-mono text-xs text-muted-foreground/50 text-center">[NO SIGNAL]</span>
          )}
        </div>
      </div>
    </div>
  );
}
