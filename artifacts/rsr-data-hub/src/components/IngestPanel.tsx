import { useRef, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity, Upload, Radio, Cpu } from "lucide-react";

// ── Source config ────────────────────────────────────────────────────────────

const ALL_SOURCES = [
  { id: "reuters-world",    label: "Reuters World",           sourceType: "News",     active: true },
  { id: "nyt-world",        label: "NYT World",               sourceType: "News",     active: true },
  { id: "reddit-worldnews", label: "Reddit /r/WorldNews",     sourceType: "Social",   active: true },
  { id: "sec-edgar",        label: "SEC EDGAR 8-K",           sourceType: "Filing",   active: true },
  { id: "coindesk-btc",     label: "Coindesk BTC/USD",        sourceType: "Market",   active: true },
  { id: "usaspending",      label: "USAspending Contracts",   sourceType: "Contract", active: true },
];

const SOURCE_TYPE_LABELS: Record<string, string> = {
  News: "text-blue-400",
  Social: "text-purple-400",
  Filing: "text-rose-400",
  Market: "text-emerald-400",
  Contract: "text-orange-400",
};

const SOURCE_TYPES = [
  "News", "Social", "Document", "Contract", "Dataset", "Filing", "Market", "Manual",
];

const ENGINES = [
  { value: "axion", label: "AXION" },
  { value: "sentrix", label: "SENTRIX" },
  { value: "sage", label: "SAGE" },
  { value: "intel_board", label: "INTEL BOARD" },
];

// ── Types ────────────────────────────────────────────────────────────────────

interface IngestPanelProps {
  rawText: string;
  onRawTextChange: (v: string) => void;
  source: string;
  onSourceChange: (v: string) => void;
  sourceType: string;
  onSourceTypeChange: (v: string) => void;
  engine: string;
  onEngineChange: (v: string) => void;
  isProcessing: boolean;
  isPulling: boolean;
  onRunAnalysis: () => void;
  onPullLive: (sourceIds: string[]) => void;
  onPullAndAnalyze: (sourceIds: string[]) => void;
  onFileIngest: (content: string, fileName: string, fileType: "csv" | "json" | "txt", sourceType: string) => void;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function IngestPanel({
  rawText,
  onRawTextChange,
  source,
  onSourceChange,
  sourceType,
  onSourceTypeChange,
  engine,
  onEngineChange,
  isProcessing,
  isPulling,
  onRunAnalysis,
  onPullLive,
  onPullAndAnalyze,
  onFileIngest,
}: IngestPanelProps) {
  const [activeTab, setActiveTab] = useState<"manual" | "live">("manual");
  const [selectedSources, setSelectedSources] = useState<string[]>(ALL_SOURCES.map((s) => s.id));
  const [uploadedFile, setUploadedFile] = useState<{ name: string; type: "csv" | "json" | "txt"; content: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function toggleSource(id: string) {
    setSelectedSources((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !["csv", "json", "txt"].includes(ext)) {
      alert("Unsupported file type. Use CSV, JSON, or TXT.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      setUploadedFile({ name: file.name, type: ext as "csv" | "json" | "txt", content });
      onSourceChange(file.name);
      if (ext === "csv" || ext === "json") onSourceTypeChange("Dataset");
      else onSourceTypeChange("Document");
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  function handleIngestFile() {
    if (!uploadedFile) return;
    onFileIngest(uploadedFile.content, uploadedFile.name, uploadedFile.type, sourceType);
    setUploadedFile(null);
  }

  const canRunAnalysis = rawText.trim().length > 0 && !uploadedFile;
  const canIngestFile = !!uploadedFile;

  return (
    <div className="glass-panel p-4 flex flex-col gap-0" data-testid="panel-ingest">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-card-border pb-2 mb-3">
        <h2 className="font-mono text-sm font-bold tracking-wide text-foreground">SIGNAL INGEST</h2>
        <Activity className="w-4 h-4 text-primary" />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-card-border mb-4">
        <button
          className={`font-mono text-[10px] tracking-widest px-3 py-1.5 border-b-2 transition-colors ${
            activeTab === "manual"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setActiveTab("manual")}
        >
          MANUAL / UPLOAD
        </button>
        <button
          className={`font-mono text-[10px] tracking-widest px-3 py-1.5 border-b-2 transition-colors ${
            activeTab === "live"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setActiveTab("live")}
        >
          LIVE PULL
        </button>
      </div>

      {/* ── TAB A: MANUAL / UPLOAD ────────────────────────────────────────── */}
      {activeTab === "manual" && (
        <div className="flex flex-col gap-3 flex-1">
          <div className="flex flex-col gap-2">
            <Label className="font-mono text-xs text-muted-foreground">RAW TEXT / SIGNAL</Label>
            <Textarea
              className="min-h-[120px] font-mono text-xs bg-background border-card-border focus-visible:ring-primary text-foreground resize-none"
              placeholder="Paste raw text, intel report, contract excerpt, or intercepted signal here..."
              value={rawText}
              onChange={(e) => onRawTextChange(e.target.value)}
              data-testid="input-raw-signal"
              disabled={!!uploadedFile}
            />
          </div>

          {/* File upload zone */}
          <div
            className={`border border-dashed rounded p-3 flex flex-col items-center gap-1.5 cursor-pointer transition-colors ${
              uploadedFile
                ? "border-primary/60 bg-primary/5"
                : "border-card-border hover:border-primary/40"
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.json,.txt"
              className="hidden"
              onChange={handleFileChange}
            />
            <Upload className="w-3.5 h-3.5 text-muted-foreground" />
            {uploadedFile ? (
              <div className="text-center">
                <span className="font-mono text-[10px] text-primary">{uploadedFile.name}</span>
                <span className="font-mono text-[10px] text-muted-foreground ml-2">{uploadedFile.type.toUpperCase()}</span>
                <button
                  className="font-mono text-[9px] text-muted-foreground ml-2 hover:text-destructive"
                  onClick={(e) => { e.stopPropagation(); setUploadedFile(null); }}
                >
                  ✕ CLEAR
                </button>
              </div>
            ) : (
              <span className="font-mono text-[9px] text-muted-foreground tracking-widest">
                DROP CSV / JSON / TXT
              </span>
            )}
          </div>

          {/* Source + Type + Engine */}
          <div className="flex flex-col gap-2">
            <Label className="font-mono text-xs text-muted-foreground">SOURCE</Label>
            <Input
              className="font-mono text-xs bg-background border-card-border focus-visible:ring-primary text-foreground h-8"
              placeholder="Reuters, Internal, OSINT, Contract Ref..."
              value={source}
              onChange={(e) => onSourceChange(e.target.value)}
              data-testid="input-source"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label className="font-mono text-xs text-muted-foreground">SOURCE TYPE</Label>
              <Select value={sourceType} onValueChange={onSourceTypeChange}>
                <SelectTrigger className="font-mono text-xs bg-background border-card-border focus:ring-primary h-8" data-testid="select-source-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SOURCE_TYPES.map((t) => (
                    <SelectItem key={t} value={t} className="font-mono text-xs">{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label className="font-mono text-xs text-muted-foreground">ENGINE</Label>
              <Select value={engine} onValueChange={onEngineChange}>
                <SelectTrigger className="font-mono text-xs bg-background border-card-border focus:ring-primary h-8" data-testid="select-engine">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ENGINES.map((e) => (
                    <SelectItem key={e.value} value={e.value} className="font-mono text-xs">{e.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-2 mt-1">
            {canIngestFile ? (
              <Button
                className="w-full font-mono font-bold tracking-widest bg-primary/20 text-primary border border-primary/60 hover:bg-primary/30"
                onClick={handleIngestFile}
                data-testid="button-ingest-file"
              >
                <Upload className="w-3.5 h-3.5 mr-2" />
                INGEST {uploadedFile?.type.toUpperCase()} FILE
              </Button>
            ) : (
              <Button
                className="w-full font-mono font-bold tracking-widest border border-primary/50 hover:bg-primary/20 bg-background text-primary hover:text-primary"
                onClick={onRunAnalysis}
                disabled={isProcessing || !canRunAnalysis}
                data-testid="button-run-analysis"
              >
                {isProcessing ? "PROCESSING..." : "RUN ANALYSIS"}
              </Button>
            )}
            <div className="flex justify-between items-center px-1">
              <span className="font-mono text-[10px] text-muted-foreground">STATUS</span>
              <span className="font-mono text-[10px] text-primary">
                {isProcessing ? "ANALYZING SIGNAL" :
                 uploadedFile ? `FILE READY — ${uploadedFile.type.toUpperCase()}` :
                 rawText.trim() ? "READY" : "AWAITING INPUT"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB B: LIVE PULL ──────────────────────────────────────────────── */}
      {activeTab === "live" && (
        <div className="flex flex-col gap-3 flex-1">
          <div className="flex flex-col gap-2">
            <Label className="font-mono text-xs text-muted-foreground">SOURCE LANES</Label>
            <div className="flex flex-col gap-1">
              {ALL_SOURCES.map((src) => (
                <label
                  key={src.id}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded border transition-colors cursor-pointer ${
                    selectedSources.includes(src.id)
                      ? "border-primary/50 bg-primary/5"
                      : "border-card-border hover:border-primary/30"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="accent-green-500 w-3 h-3"
                    checked={selectedSources.includes(src.id)}
                    onChange={() => toggleSource(src.id)}
                  />
                  <span className="font-mono text-[11px] text-foreground flex-1">{src.label}</span>
                  <span className={`font-mono text-[9px] font-bold ${SOURCE_TYPE_LABELS[src.sourceType] ?? "text-muted-foreground"}`}>
                    {src.sourceType.toUpperCase()}
                  </span>
                  <span className="font-mono text-[9px] text-primary">ACTIVE</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2 mt-auto">
            {/* PULL LIVE SIGNALS */}
            <Button
              className="w-full font-mono font-bold tracking-widest border border-primary/50 hover:bg-primary/20 bg-background text-primary"
              onClick={() => typeof onPullLive === "function" && onPullLive(selectedSources)}
              disabled={isPulling || selectedSources.length === 0}
              data-testid="btn-pull-live"
            >
              <Radio className={`w-3.5 h-3.5 mr-2 ${isPulling ? "animate-pulse" : ""}`} />
              {isPulling ? "PULLING..." : "PULL LIVE SIGNALS"}
            </Button>

            {/* PULL + ANALYZE */}
            <Button
              className="w-full font-mono font-bold tracking-widest bg-primary/15 hover:bg-primary/25 border border-primary/60 text-primary"
              onClick={() => typeof onPullAndAnalyze === "function" && onPullAndAnalyze(selectedSources)}
              disabled={isPulling || selectedSources.length === 0}
              data-testid="btn-pull-analyze"
            >
              <Cpu className={`w-3.5 h-3.5 mr-2 ${isPulling ? "animate-pulse" : ""}`} />
              {isPulling ? "ANALYZING..." : "PULL + ANALYZE"}
            </Button>

            <div className="flex justify-between items-center px-1">
              <span className="font-mono text-[10px] text-muted-foreground">ACTIVE LANES</span>
              <span className="font-mono text-[10px] text-primary">
                {selectedSources.length} / {ALL_SOURCES.length} SELECTED
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
