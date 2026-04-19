import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useAnalyzeSignal,
  useSaveSignal,
  useAppendOpsLog,
  useListSignals,
  useListFeeds,
  useListOpsLog,
  useIngestFile,
  ingestAll,
  analyzeSignal,
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
  const [lastPullTime, setLastPullTime] = useState<string | null>(null);

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
  const analyzeSignalHook = useAnalyzeSignal();
  const saveSignalHook = useSaveSignal();
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

    analyzeSignalHook.mutate(
      { data: { rawText, sourceType, engine, source: source || sourceType } },
      {
        onSuccess: (result) => {
          const signal = { ...result as Signal, sourceType: sourceType as Signal["sourceType"], status: "analyzed" as const };
          setCurrentSignal(signal);
          saveSignalHook.mutate(
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

  // ── Live pull (queue only, no analysis) ─────────────────────────────────

  const handlePullLive = useCallback(async (selectedSources: string[]) => {
    setIsPulling(true);
    toast({ title: "Live Pull Started", description: "Fetching from all active sources...", className: "font-mono" });
    logAction("Live pull initiated — fetching all active sources");

    try {
      const results = await ingestAll();
      const pulled = (results ?? []) as Signal[];

      // Filter by selected source IDs if subset chosen
      const filtered = pulled.filter((s) => {
        const sourceMap: Record<string, string> = {
          "reuters-world": "Reuters World",
          "nyt-world": "NYT World",
          "reddit-worldnews": "Reddit /r/WorldNews",
          "sec-edgar": "SEC EDGAR",
          "coindesk-btc": "Coindesk",
          "usaspending": "USAspending.gov",
        };
        return selectedSources.some((id) => sourceMap[id] === s.source);
      });

      const toQueue = filtered.length > 0 ? filtered : pulled;
      addToQueue(toQueue);
      setLastPullTime(new Date().toISOString());
      queryClient.invalidateQueries({ queryKey: getListOpsLogQueryKey() });

      toast({
        title: "Pull Complete",
        description: `${toQueue.length} signal candidate${toQueue.length !== 1 ? "s" : ""} added to queue`,
        className: "font-mono",
      });
    } catch (err) {
      toast({ title: "Pull Failed", description: "Could not reach live sources", variant: "destructive", className: "font-mono" });
      logAction("Live pull failed — network or source error", "error");
    } finally {
      setIsPulling(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryClient]);

  // ── Pull + Analyze ──────────────────────────────────────────────────────

  const handlePullAndAnalyze = useCallback(async (selectedSources: string[]) => {
    setIsPulling(true);
    toast({ title: "Pull + Analyze Started", description: "Fetching and analyzing live signals...", className: "font-mono" });
    logAction("Pull + Analyze initiated — all active sources");

    try {
      const results = await ingestAll();
      const pulled = (results ?? []) as Signal[];

      if (pulled.length === 0) {
        toast({ title: "No Signals", description: "No candidates returned from sources", className: "font-mono" });
        return;
      }

      const sourceMap: Record<string, string> = {
        "reuters-world": "Reuters World",
        "nyt-world": "NYT World",
        "reddit-worldnews": "Reddit /r/WorldNews",
        "sec-edgar": "SEC EDGAR",
        "coindesk-btc": "Coindesk",
        "usaspending": "USAspending.gov",
      };

      const filtered = pulled.filter((s) =>
        selectedSources.some((id) => sourceMap[id] === s.source)
      );
      const toAnalyze = (filtered.length > 0 ? filtered : pulled).slice(0, 6);
      const remaining = pulled.slice(toAnalyze.length);

      setLastPullTime(new Date().toISOString());

      // Analyze top candidates sequentially to avoid overwhelming backend
      const analyzedResults: Signal[] = [];
      for (const candidate of toAnalyze) {
        try {
          const text = candidate.rawText ?? candidate.summary ?? candidate.title;
          const result = await analyzeSignal({
            data: {
              rawText: text,
              sourceType: candidate.sourceType ?? "News",
              engine,
              source: candidate.source,
            },
          });
          const analyzed: Signal = {
            ...(result as Signal),
            source: candidate.source,
            sourceType: candidate.sourceType,
            status: "analyzed",
          };
          analyzedResults.push(analyzed);
          saveSignalHook.mutate({ data: analyzed });
        } catch {
          analyzedResults.push({ ...candidate, status: "pulled" });
        }
      }

      addToQueue([
        ...analyzedResults,
        ...remaining.map((c) => ({ ...c, status: "pulled" as const })),
      ]);

      queryClient.invalidateQueries({ queryKey: getListSignalsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getListOpsLogQueryKey() });

      const analyzedCount = analyzedResults.filter((s) => s.status === "analyzed").length;
      toast({
        title: "Pull + Analyze Complete",
        description: `${analyzedCount} analyzed, ${remaining.length} queued for review`,
        className: "font-mono",
      });
      logAction(`Pull + Analyze complete — ${analyzedCount} analyzed and saved, ${remaining.length} candidates queued`);
    } catch (err) {
      toast({ title: "Pull + Analyze Failed", description: "Could not reach sources", variant: "destructive", className: "font-mono" });
      logAction("Pull + Analyze failed — network or source error", "error");
    } finally {
      setIsPulling(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine, queryClient]);

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

    analyzeSignalHook.mutate(
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
          saveSignalHook.mutate(
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

    saveSignalHook.mutate(
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
    removeFromQueue(signal.id);
    logAction(`Queue item dismissed — ${signal.id}`);
    toast({ title: "Dismissed", description: `${signal.id} removed from queue`, className: "font-mono" });
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

  // ── Signal archive click → load into analysis panel ────────────────────

  const handleSignalSelect = useCallback((signal: Signal) => {
    setCurrentSignal(signal);
    toast({ title: "Signal Loaded", description: `${signal.id} loaded into analysis panel`, className: "font-mono" });
  }, [toast]);

  const isProcessing = analyzeSignalHook.isPending;

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
          onPullAndAnalyze={handlePullAndAnalyze}
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
          <RecentSignals
            signals={signals}
            isLoading={signalsLoading}
            onSelect={handleSignalSelect}
          />
        </div>
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-4">
          <ActiveFeeds feeds={feeds} isLoading={feedsLoading} />
          <SystemStatus
            totalSignals={signals.length}
            queueDepth={queuedSignals.length}
            lastPullTime={lastPullTime}
          />
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
