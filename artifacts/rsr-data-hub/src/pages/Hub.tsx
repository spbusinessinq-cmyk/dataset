import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useAnalyzeSignal,
  useSaveSignal,
  useAppendOpsLog,
  useListSignals,
  useListFeeds,
  useListOpsLog,
  getListSignalsQueryKey,
  getListOpsLogQueryKey,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

import Header from "@/components/Header";
import IngestPanel from "@/components/IngestPanel";
import AnalysisPanel from "@/components/AnalysisPanel";
import OutputPanel from "@/components/OutputPanel";
import RecentSignals from "@/components/RecentSignals";
import ActiveFeeds from "@/components/ActiveFeeds";
import SystemStatus from "@/components/SystemStatus";
import OpsLog from "@/components/OpsLog";
import BriefModal from "@/components/BriefModal";
import { Signal, FALLBACK_SIGNALS } from "@/lib/mock-data";

export default function Hub() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Ingest form state (lifted from IngestPanel)
  const [rawText, setRawText] = useState("");
  const [source, setSource] = useState("");
  const [sourceType, setSourceType] = useState("News");
  const [engine, setEngine] = useState("axion");

  // Current analyzed signal
  const [currentSignal, setCurrentSignal] = useState<Signal | null>(null);
  const [briefOpen, setBriefOpen] = useState(false);

  // API hooks — queries
  const { data: signalsData, isLoading: signalsLoading } = useListSignals({
    query: { staleTime: 5000 },
  });
  const { data: feedsData, isLoading: feedsLoading } = useListFeeds({
    query: { staleTime: 30000 },
  });
  const { data: opsLogData, isLoading: opsLogLoading } = useListOpsLog({
    query: { staleTime: 5000 },
  });

  // API hooks — mutations
  const analyzeSignal = useAnalyzeSignal();
  const saveSignal = useSaveSignal();
  const appendLog = useAppendOpsLog();

  // Resolve signals list: prefer API data, fall back to mock
  const signals = (signalsData ?? FALLBACK_SIGNALS) as Signal[];
  const feeds = feedsData ?? [];
  const opsEntries = opsLogData ?? [];

  const handleRunAnalysis = useCallback(() => {
    if (!rawText.trim()) return;

    setCurrentSignal(null);

    analyzeSignal.mutate(
      {
        data: {
          rawText,
          sourceType,
          engine,
          source: source || sourceType,
        },
      },
      {
        onSuccess: (result) => {
          const signal = result as Signal;
          setCurrentSignal(signal);

          // Auto-save signal to backend
          saveSignal.mutate(
            { data: signal },
            {
              onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: getListSignalsQueryKey() });
              },
            },
          );

          // Log the analysis completion
          appendLog.mutate(
            {
              data: {
                message: `${signal.engine} engine completed analysis on ${signal.id} — confidence ${signal.confidence}% — ${signal.classification}`,
                level: "info",
              },
            },
            {
              onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: getListOpsLogQueryKey() });
              },
            },
          );
        },
        onError: (err) => {
          toast({
            title: "Analysis Failed",
            description: err?.message ?? "Backend unreachable — check server status",
            variant: "destructive",
            className: "font-mono",
          });

          // Log the failure
          appendLog.mutate(
            {
              data: {
                message: `Analysis request failed — backend may be unavailable`,
                level: "error",
              },
            },
            {
              onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: getListOpsLogQueryKey() });
              },
            },
          );
        },
      },
    );
  }, [rawText, source, sourceType, engine, analyzeSignal, saveSignal, appendLog, queryClient, toast]);

  const isProcessing = analyzeSignal.isPending;

  return (
    <div className="flex flex-col min-h-screen max-w-[1600px] mx-auto p-4 gap-4" data-testid="page-hub">
      <Header />

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
          onRunAnalysis={handleRunAnalysis}
        />
        <AnalysisPanel signal={currentSignal} isProcessing={isProcessing} />
        <OutputPanel
          signal={currentSignal}
          isProcessing={isProcessing}
          onGenerateBrief={() => setBriefOpen(true)}
        />
      </div>

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
