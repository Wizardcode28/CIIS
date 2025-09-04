import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PDFPreviewProps {
  pdfUrl?: string;
  onDownload: () => void;
}

export function PDFPreview({ pdfUrl, onDownload }: PDFPreviewProps) {
  if (!pdfUrl) {
    return (
      <Card className="bg-dashboard-card border-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Report Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-96 text-center">
            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-foreground mb-2">No Report Available</p>
            <p className="text-sm text-muted-foreground">
              Generate a report to view the PDF preview
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-dashboard-card border-border">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Report Preview
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onDownload}
            className="flex items-center gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            Open in New Tab
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="border border-border rounded-lg overflow-hidden bg-white">
          <iframe
            src={pdfUrl}
            className="w-full h-[500px]"
            title="Report PDF Preview"
            style={{
              border: 'none',
              display: 'block'
            }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          PDF preview may take a moment to load. If the preview doesn't appear, try downloading the file directly.
        </p>
      </CardContent>
    </Card>
  );
}