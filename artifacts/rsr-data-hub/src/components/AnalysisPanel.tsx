import { Signal } from "@/lib/mock-data";
import { Cpu, Tag, AlertTriangle, ActivitySquare, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AnalysisPanelProps {
  signal: Signal | null;
  isProcessing: boolean;
}

export default function AnalysisPanel({ signal, isProcessing }: AnalysisPanelProps) {
  return (
    <div className="glass-panel p-4 flex flex-col gap-4 relative overflow-hidden" data-testid="panel-analysis">
      <div className="flex items-center justify-between border-b border-card-border pb-2 mb-2 z-10">
        <h2 className="font-mono text-sm font-bold tracking-wide text-foreground">ANALYSIS RESULT</h2>
        <Cpu className="w-4 h-4 text-primary" />
      </div>

      {isProcessing ? (
        <div className="flex-1 flex items-center justify-center flex-col gap-4 z-10" data-testid="state-processing">
          <div className="w-12 h-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin"></div>
          <span className="font-mono text-xs text-primary animate-pulse tracking-widest">RUNNING AXION ENGINE...</span>
        </div>
      ) : !signal ? (
        <div className="flex-1 flex items-center justify-center z-10" data-testid="state-empty">
          <span className="font-mono text-xs text-muted-foreground tracking-widest">[AWAITING SIGNAL INPUT]</span>
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-5 overflow-y-auto pr-2 z-10" data-testid="content-analysis">
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-start">
              <Badge 
                variant="outline" 
                className={`font-mono text-xs rounded-sm px-2 py-0 border-opacity-50 ${
                  signal.classification === 'CRITICAL' ? 'text-destructive border-destructive bg-destructive/10' :
                  signal.classification === 'ELEVATED' ? 'text-amber-500 border-amber-500 bg-amber-500/10' :
                  'text-primary border-primary bg-primary/10'
                }`}
                data-testid="badge-classification"
              >
                {signal.classification}
              </Badge>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-muted-foreground">CONFIDENCE</span>
                <div className="flex items-center gap-1">
                  <div className="w-16 h-1.5 bg-background rounded-full overflow-hidden border border-card-border">
                    <div 
                      className="h-full bg-primary transition-all duration-1000 ease-out" 
                      style={{ width: `${signal.confidence}%` }}
                    />
                  </div>
                  <span className="font-mono text-xs text-primary font-bold">{signal.confidence}%</span>
                </div>
              </div>
            </div>
            
            <h3 className="font-sans font-bold text-lg leading-tight text-foreground" data-testid="text-signal-title">
              {signal.title}
            </h3>
            
            <p className="font-sans text-sm text-secondary-foreground leading-relaxed" data-testid="text-summary">
              {signal.summary}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <h4 className="font-mono text-[10px] text-primary tracking-widest">WHY IT MATTERS</h4>
            <p className="font-sans text-sm text-foreground leading-relaxed border-l-2 border-primary/50 pl-3 py-1">
              {signal.whyItMatters}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <h4 className="font-mono text-[10px] text-muted-foreground tracking-widest flex items-center gap-1">
                <Tag className="w-3 h-3" /> IMPACT TAGS
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {signal.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="font-mono text-[9px] rounded-sm bg-secondary text-secondary-foreground hover:bg-secondary/80">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <h4 className="font-mono text-[10px] text-muted-foreground tracking-widest flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> EXTRACTED ENTITIES
              </h4>
              <div className="flex flex-col gap-1">
                {signal.entities.map(entity => (
                  <span key={entity} className="font-sans text-xs text-foreground font-medium flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-muted-foreground"></span>
                    {entity}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 mt-auto">
            <h4 className="font-mono text-[10px] text-muted-foreground tracking-widest flex items-center gap-1">
              <ShieldAlert className="w-3 h-3" /> SYSTEM IMPACT
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {signal.systemImpact.map(impact => (
                <div key={impact} className="flex items-center gap-2 bg-background border border-card-border p-1.5 rounded">
                  <ActivitySquare className="w-3.5 h-3.5 text-primary" />
                  <span className="font-sans text-xs text-secondary-foreground">{impact}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Decorative scan line that appears when processing */}
      {isProcessing && (
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-primary/50 shadow-[0_0_10px_hsl(var(--primary))] animate-[scan_2s_ease-in-out_infinite] z-0"></div>
      )}
    </div>
  );
}