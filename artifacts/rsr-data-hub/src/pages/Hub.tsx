import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useAnalyzeSignal,
  useSaveSignal,
  usePublishSignal,
  useAppendOpsLog,
  useListSignals,
  useListFeeds,
  useListOpsLog,
  useIngestFile,
  ingestRss,
  getListSignalsQueryKey,
  getListOpsLogQueryKey,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

import Header from "@/components/Header";
import IngestPanel from "@/components/IngestPanel";
import AnalysisPanel from "@/components/AnalysisPanel";
import OutputPanel from "@/components/OutputPanel";
import IntakeQueue from "@/components/IntakeQueue";
import RecentSignals from "@/components/RecentSignals";
import ActiveFeeds from "@/components/ActiveFeeds";
import SystemStatus from "@/components/SystemStatus";
import OpsLog from "@/components/OpsLog";
import BriefModal from "@/components/BriefModal";
import { Signal, FALLBACK_SIGNALS } from "@/lib/mock-data";

export default function Hub() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // ── Ingest form state ───────────────────────────────────────────────────
  const [rawText, setRawText] = useState("");
  const [source, setSource] = useState("");
  const [sourceType, setSourceType] = useState("News");
  const [engine, setEngine] = useState("axion");

  // ── Analysis state ──────────────────────────────────────────────────────
  const [currentSignal, setCurrentSignal] = useState<Signal | null>(null);
  const [briefOpen, setBriefOpen] = useState(false);

  // ── Intake queue (client-side staging area) ─────────────────────────────
  const [queuedSignals, setQueuedSignals] = useState<Signal[]>([]);
  const [isPulling, setIsPulling] = useState(false);

  // ── API queries ─────────────────────────────────────────────────────────
  const { data: signalsData, isLoading: signalsLoading } = useListSignals({
    query: { staleTime: 5000 },
  });
  const { data: feedsData, isLoading: feedsLoading } = useListFeeds({
    query: { staleTime: 30000 },
  });
  const { data: opsLogData, isLoading: opsLogLoading } = useListOpsLog({
    query: { staleTime: 5000 },
  });

  // ── API mutations ───────────────────────────────────────────────────────
  const analyzeSignal = useAnalyzeSignal();
  const saveSignal = useSaveSignal();
  const publishSignal = usePublishSignal();
  const appendLog = useAppendOpsLog();
  const ingestFileMutation = useIngestFile();

  // ── Resolved data ───────────────────────────────────────────────────────
  const signals = (signalsData ?? FALLBACK_SIGNALS) as Signal[];
  const feeds = feedsData ?? [];
  const opsEntries = opsLogData ?? [];

  // ── Helpers ─────────────────────────────────────────────────────────────

  function logAction(message: string, level: "info" | "warn" | "error" = "info") {
    appendLog.mutate(
      { data: { message, level } },
      { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListOpsLogQueryKey() }) },
    );
  }

  function addToQueue(items: Signal[]) {
    setQueuedSignals((prev) => {
      const existingIds = new Set(prev.map((s) => s.id));
      return [...items.filter((i) => !existingIds.has(i.id)), ...prev];
    });
  }

  function removeFromQueue(id: string) {
    setQueuedSignals((prev) => prev.filter((s) => s.id !== id));
  }

  // ── Manual analysis ─────────────────────────────────────────────────────

  const handleRunAnalysis = useCallback(() => {
    if (!rawText.trim()) return;
    setCurrentSignal(null);

    analyzeSignal.mutate(
      { data: { rawText, sourceType, engine, source: source || sourceType } },
      {
        onSuccess: (result) => {
          const signal = { ...result as Signal, sourceType: sourceType as Signal["sourceType"], status: "analyzed" as const };
          setCurrentSignal(signal);

          saveSignal.mutate(
            { data: signal },
            { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListSignalsQueryKey() }) },
          );

          logAction(`${String(signal.engine).toUpperCase()} engine completed — ${signal.id} — ${signal.confidence}% — ${signal.classification}`);
        },
        onError: (err) => {
          toast({ title: "Analysis Failed", description: err?.message ?? "Backend unreachable", variant: "destructive", className: "font-mono" });
          logAction("Analysis request failed — backend may be unavailable", "error");
        },
      },
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawText, source, sourceType, engine]);

  // ── Live pull ───────────────────────────────────────────────────────────

  const handlePullLive = useCallback(async (selectedSources: string[]) => {
    setIsPulling(true);
    toast({ title: "RSS Pull Started", description: `Fetching from ${selectedSources.length} source(s)...`, className: "font-mono" });
    logAction(`RSS ingest initiated — ${selectedSources.join(", ")}`);

    try {
      const sourcesParam = selectedSources.join(",");
      const results = await ingestRss({ sources: sourcesParam });
      const pulled = (results ?? []) as Signal[];

      addToQueue(pulled);
      queryClient.invalidateQueries({ queryKey: getListOpsLogQueryKey() });

      toast({
        title: "Pull Complete",
        description: `${pulled.length} signal candidate${pulled.length !== 1 ? "s" : ""} added to queue`,
        className: "font-mono",
      });
    } catch (err) {
      toast({ title: "Pull Failed", description: "Could not reach RSS sources", variant: "destructive", className: "font-mono" });
      logAction("RSS ingest failed — network or source error", "error");
    } finally {
      setIsPulling(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryClient]);

  // ── File ingest ─────────────────────────────────────────────────────────

  const handleFileIngest = useCallback(
    (content: string, fileName: string, fileType: "csv" | "json" | "txt", srcType: string) => {
      logAction(`File ingest started — ${fileName} (${fileType.toUpperCase()})`);

      ingestFileMutation.mutate(
        { data: { content, fileName, fileType, sourceType: srcType } },
        {
          onSuccess: (results) => {
            const candidates = (results ?? []) as Signal[];
            addToQueue(candidates);
            queryClient.invalidateQueries({ queryKey: getListOpsLogQueryKey() });
            toast({
              title: "File Parsed",
              description: `${candidates.length} candidate${candidates.length !== 1 ? "s" : ""} from ${fileName} added to queue`,
              className: "font-mono",
            });
          },
          onError: () => {
            toast({ title: "File Ingest Failed", description: "Could not parse file", variant: "destructive", className: "font-mono" });
            logAction(`File ingest failed — ${fileName}`, "error");
          },
        },
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ingestFileMutation, queryClient],
  );

  // ── Queue actions ───────────────────────────────────────────────────────

  const handleQueueAnalyze = useCallback((signal: Signal) => {
    const text = signal.rawText ?? signal.summary;
    if (!text) return;

    setCurrentSignal(null);

    analyzeSignal.mutate(
      {
        data: {
          rawText: text,
          sourceType: signal.sourceType ?? "News",
          engine,
          source: signal.source,
        },
      },
      {
        onSuccess: (result) => {
          const analyzed: Signal = {
            ...result as Signal,
            source: signal.source,
            sourceType: signal.sourceType,
            status: "analyzed",
          };
          setCurrentSignal(analyzed);

          // Save it and remove from queue
          saveSignal.mutate(
            { data: analyzed },
            {
              onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: getListSignalsQueryKey() });
                removeFromQueue(signal.id);
                logAction(`Queue item analyzed — ${analyzed.id} — ${analyzed.confidence}% — ${analyzed.classification}`);
              },
            },
          );
        },
        onError: () => {
          toast({ title: "Analysis Failed", description: "Could not analyze queue item", variant: "destructive", className: "font-mono" });
        },
      },
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine]);

  const handleQueueSave = useCallback((signal: Signal) => {
    const toSave: Signal = {
      ...signal,
      status: "saved",
      id: signal.id.startsWith("C-") ? `SG-${Math.floor(Math.random() * 9000 + 1000)}` : signal.id,
    };

    saveSignal.mutate(
      { data: toSave },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListSignalsQueryKey() });
          removeFromQueue(signal.id);
          logAction(`Signal saved from queue — ${toSave.id} — ${toSave.source}`);
          toast({ title: "Signal Saved", description: `${toSave.id} archived`, className: "font-mono" });
        },
      },
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleQueuePublish = useCallback((signal: Signal) => {
    const toPublish: Signal = {
      ...signal,
      status: "published",
      id: signal.id.startsWith("C-") ? `SG-${Math.floor(Math.random() * 9000 + 1000)}` : signal.id,
    };

    publishSignal.mutate(
      { data: toPublish },
      {
        onSuccess: () => {
          removeFromQueue(signal.id);
          logAction(`Queue item published — ${toPublish.id}`);
          toast({ title: "Published", description: `${toPublish.id} sent to output`, className: "font-mono" });
        },
      },
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleQueueLoad = useCallback((signal: Signal) => {
    setRawText(signal.rawText ?? signal.summary ?? "");
    setSource(signal.source);
    if (signal.sourceType) setSourceType(signal.sourceType);
    removeFromQueue(signal.id);
    toast({ title: "Signal Loaded", description: "Paste area populated — ready to run analysis", className: "font-mono" });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isProcessing = analyzeSignal.isPending;

  return (
    <div className="flex flex-col min-h-screen max-w-[1600px] mx-auto p-4 gap-4" data-testid="page-hub">
      <Header />

      {/* ── Three-column workspace ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1">
        <IngestPanel
          rawText={rawText}
          onRawTextChange={setRawText}
          source={source}
          onSourceChange={setSource}
          sourceType={sourceType}
          onSourceTypeChange={setSourceType}
          engine={engine}
          onEngineChange={setEngine}
          isProcessing={isProcessing}
          isPulling={isPulling}
          onRunAnalysis={handleRunAnalysis}
          onPullLive={handlePullLive}
          onFileIngest={handleFileIngest}
        />
        <AnalysisPanel signal={currentSignal} isProcessing={isProcessing} />
        <OutputPanel
          signal={currentSignal}
          isProcessing={isProcessing}
          onGenerateBrief={() => setBriefOpen(true)}
        />
      </div>

      {/* ── Intake Queue (shows when populated) ──────────────────────────── */}
      {queuedSignals.length > 0 && (
        <IntakeQueue
          items={queuedSignals}
          isAnalyzing={isProcessing}
          onAnalyze={handleQueueAnalyze}
          onSave={handleQueueSave}
          onPublish={handleQueuePublish}
          onLoad={handleQueueLoad}
          onDismiss={removeFromQueue}
        />
      )}

      {/* ── Signal archive + Source lanes ────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7 xl:col-span-8">
          <RecentSignals signals={signals} isLoading={signalsLoading} />
        </div>
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-4">
          <ActiveFeeds feeds={feeds} isLoading={feedsLoading} />
          <SystemStatus totalSignals={signals.length} />
        </div>
      </div>

      <OpsLog entries={opsEntries} isLoading={opsLogLoading} />

      <BriefModal
        signal={currentSignal}
        open={briefOpen}
        onClose={() => setBriefOpen(false)}
      />
    </div>
  );
}
