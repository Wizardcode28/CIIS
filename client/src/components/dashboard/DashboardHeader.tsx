import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Download, FileText, AlertTriangle } from 'lucide-react';
import { DashboardStatus } from '@/types/report';
import { apiService } from '@/services/api';
interface DashboardHeaderProps {
  status: DashboardStatus;
  onRerun: () => void;
  onDownloadPdf: () => void;
  onDownloadCsv: () => void;
  lastGenerated?: string;
  disabled?: boolean;
}

const statusConfig = {
  idle: { text: 'Ready', variant: 'secondary' as const, icon: null },
  processing: { text: 'Processing...', variant: 'default' as const, icon: RefreshCw },
  success: { text: 'Complete', variant: 'default' as const, icon: null },
  error: { text: 'Error', variant: 'destructive' as const, icon: AlertTriangle }
};

export function DashboardHeader({ 
  status, 
  onRerun, 
  onDownloadPdf, 
  onDownloadCsv, 
  lastGenerated,
  disabled 
}: DashboardHeaderProps) {
  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6 bg-dashboard-card border-b border-border">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-foreground">Auto Report Dashboard</h1>
        <div className="flex items-center gap-3">
          <Badge variant={config.variant} className="flex items-center gap-1">
            {StatusIcon && (
              <StatusIcon 
                className={`h-3 w-3 ${status === 'processing' ? 'animate-spin' : ''}`} 
              />
            )}
            {config.text}
          </Badge>
          {lastGenerated && (
            <span className="text-sm text-muted-foreground">
              Last updated: {new Date(lastGenerated).toLocaleString()}
            </span>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          onClick={onDownloadCsv}
          disabled={disabled}
          className="flex items-center gap-2"
        >
          <FileText className="h-4 w-4" />
          Download CSV
        </Button>
        
        {/* <Button
          variant="outline"
          onClick={onDownloadPdf}
          disabled={disabled}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Download PDF
        </Button> */}
        <Button asChild variant="outline" disabled={disabled} className="flex items-center gap-2">
      <a href={apiService.getPdfDownloadUrl("report.pdf")} download>
        <Download className="h-4 w-4" />
        Download PDF
      </a>
      </Button>
        
        <Button
          onClick={onRerun}
          disabled={status === 'processing'}
          className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-primary-foreground"
        >
          <RefreshCw className={`h-4 w-4 ${status === 'processing' ? 'animate-spin' : ''}`} />
          Rerun Live & Rebuild Report
        </Button>
      </div>
    </div>
  );
}