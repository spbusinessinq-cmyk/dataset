import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity } from "lucide-react";

interface IngestPanelProps {
  isProcessing: boolean;
  onRunAnalysis: () => void;
}

export default function IngestPanel({ isProcessing, onRunAnalysis }: IngestPanelProps) {
  return (
    <div className="glass-panel p-4 flex flex-col gap-4" data-testid="panel-ingest">
      <div className="flex items-center justify-between border-b border-card-border pb-2 mb-2">
        <h2 className="font-mono text-sm font-bold tracking-wide text-foreground">SIGNAL INGEST</h2>
        <Activity className="w-4 h-4 text-primary" />
      </div>

      <div className="flex-1 flex flex-col gap-4">
        <div className="flex flex-col gap-2 flex-1">
          <Label className="font-mono text-xs text-muted-foreground">RAW TEXT / SIGNAL</Label>
          <Textarea 
            className="flex-1 min-h-[150px] font-mono text-sm bg-background border-card-border focus-visible:ring-primary text-foreground resize-none"
            placeholder="Paste raw text, intel report, or intercepted signal here..."
            data-testid="input-raw-signal"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label className="font-mono text-xs text-muted-foreground">SOURCE TYPE</Label>
            <Select defaultValue="news">
              <SelectTrigger className="font-mono text-xs bg-background border-card-border focus:ring-primary" data-testid="select-source-type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="news" className="font-mono text-xs">News</SelectItem>
                <SelectItem value="social" className="font-mono text-xs">Social</SelectItem>
                <SelectItem value="dataset" className="font-mono text-xs">Dataset</SelectItem>
                <SelectItem value="contract" className="font-mono text-xs">Contract</SelectItem>
                <SelectItem value="manual" className="font-mono text-xs">Manual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label className="font-mono text-xs text-muted-foreground">ENGINE</Label>
            <Select defaultValue="axion">
              <SelectTrigger className="font-mono text-xs bg-background border-card-border focus:ring-primary" data-testid="select-engine">
                <SelectValue placeholder="Select engine" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sentrix" className="font-mono text-xs">Sentrix</SelectItem>
                <SelectItem value="axion" className="font-mono text-xs">AXION</SelectItem>
                <SelectItem value="sage" className="font-mono text-xs">SAGE</SelectItem>
                <SelectItem value="intel_board" className="font-mono text-xs">Intel Board</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col gap-2 mt-4">
          <Button 
            className="w-full font-mono font-bold tracking-widest border border-primary/50 hover:bg-primary/20 bg-background text-primary hover:text-primary transition-all duration-200"
            onClick={onRunAnalysis}
            disabled={isProcessing}
            data-testid="button-run-analysis"
          >
            {isProcessing ? "PROCESSING..." : "RUN ANALYSIS"}
          </Button>
          <div className="flex justify-between items-center px-1">
            <span className="font-mono text-[10px] text-muted-foreground">STATUS</span>
            <span className="font-mono text-[10px] text-primary">{isProcessing ? "ANALYZING SIGNAL" : "READY"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}