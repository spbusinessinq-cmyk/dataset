import { useState } from "react";
import Header from "@/components/Header";
import IngestPanel from "@/components/IngestPanel";
import AnalysisPanel from "@/components/AnalysisPanel";
import OutputPanel from "@/components/OutputPanel";
import RecentSignals from "@/components/RecentSignals";
import ActiveFeeds from "@/components/ActiveFeeds";
import SystemStatus from "@/components/SystemStatus";
import OpsLog from "@/components/OpsLog";
import { INITIAL_LOGS, Signal, MOCK_SIGNAL } from "@/lib/mock-data";

export default function Hub() {
  const [signal, setSignal] = useState<Signal | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState<string[]>(INITIAL_LOGS);

  const handleRunAnalysis = () => {
    setIsProcessing(true);
    setSignal(null);
    
    // Simulate loading
    setTimeout(() => {
      setIsProcessing(false);
      setSignal(MOCK_SIGNAL);
      
      const newLog = `[04:17:33] AXION engine completed analysis on signal #SG-0042 — confidence 91%`;
      setLogs(prev => [newLog, ...prev]);
    }, 1500);
  };

  return (
    <div className="flex flex-col min-h-screen max-w-[1600px] mx-auto p-4 gap-4" data-testid="page-hub">
      <Header />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1">
        <IngestPanel isProcessing={isProcessing} onRunAnalysis={handleRunAnalysis} />
        <AnalysisPanel signal={signal} isProcessing={isProcessing} />
        <OutputPanel signal={signal} isProcessing={isProcessing} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7 xl:col-span-8">
          <RecentSignals />
        </div>
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-4">
          <ActiveFeeds />
          <SystemStatus />
        </div>
      </div>

      <OpsLog logs={logs} />
    </div>
  );
}