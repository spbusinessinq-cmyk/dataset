import { Signal } from "@/lib/mock-data";
import { Share, Download, Save, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface OutputPanelProps {
  signal: Signal | null;
  isProcessing: boolean;
}

export default function OutputPanel({ signal, isProcessing }: OutputPanelProps) {
  const { toast } = useToast();

  const handleAction = (action: string) => {
    if (!signal) return;
    toast({
      title: "Action Executed",
      description: `${action} completed for ${signal.id}`,
      className: "font-mono border-primary bg-background text-foreground",
    });
  };

  return (
    <div className="glass-panel p-4 flex flex-col gap-4" data-testid="panel-output">
      <div className="flex items-center justify-between border-b border-card-border pb-2 mb-2">
        <h2 className="font-mono text-sm font-bold tracking-wide text-foreground">EXPORT & PUBLISH</h2>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${signal ? 'bg-primary' : isProcessing ? 'bg-amber-500 animate-pulse' : 'bg-muted-foreground'}`}></div>
          <span className="font-mono text-[10px] text-muted-foreground">
            {signal ? "SIGNAL READY" : isProcessing ? "PROCESSING..." : "AWAITING OUTPUT"}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Button 
          variant="outline" 
          className="w-full justify-start font-mono text-xs border-primary/40 bg-background hover:bg-primary/10 text-foreground h-10 transition-all"
          disabled={!signal || isProcessing}
          onClick={() => handleAction('Signal saved')}
          data-testid="btn-save"
        >
          <Save className="w-4 h-4 mr-2 text-primary" />
          SAVE SIGNAL
        </Button>
        
        <Button 
          variant="outline" 
          className="w-full justify-start font-mono text-xs border-primary/40 bg-background hover:bg-primary/10 text-foreground h-10 transition-all"
          disabled={!signal || isProcessing}
          onClick={() => handleAction('Brief generated')}
          data-testid="btn-generate-brief"
        >
          <FileText className="w-4 h-4 mr-2 text-primary" />
          GENERATE BRIEF
        </Button>
        
        <Button 
          className="w-full justify-start font-mono text-xs bg-primary text-primary-foreground hover:bg-primary/90 h-10 transition-all shadow-[0_0_15px_hsl(var(--primary)/0.2)]"
          disabled={!signal || isProcessing}
          onClick={() => handleAction('Published to site')}
          data-testid="btn-publish"
        >
          <Share className="w-4 h-4 mr-2" />
          PUBLISH TO SITE
        </Button>
        
        <Button 
          variant="ghost" 
          className="w-full justify-start font-mono text-xs text-muted-foreground hover:text-foreground hover:bg-secondary h-10 border border-card-border border-dashed transition-all"
          disabled={!signal || isProcessing}
          onClick={() => handleAction('JSON copied to clipboard')}
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
              <span className="font-mono text-[10px] text-primary">{signal.id}</span>
              <p className="font-sans text-xs text-foreground font-medium line-clamp-2">{signal.title}</p>
            </div>
          ) : (
            <span className="font-mono text-xs text-muted-foreground/50 text-center">[NO SIGNAL]</span>
          )}
        </div>
      </div>
    </div>
  );
}