import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/services/api';
import { parseCSV, generateChartData, generateTopWords } from '@/utils/csvParser';
import { ProcessedReportData, DashboardStatus } from '@/types/report';

import { DashboardHeader } from './dashboard/DashboardHeader';
import { SummaryCards } from './dashboard/SummaryCards';
import { Charts } from './dashboard/Charts';
import { FlaggedPosts } from './dashboard/FlaggedPosts';
import { PDFPreview } from './dashboard/PDFPreview';
import { RerunConfirmDialog } from './dashboard/RerunConfirmDialog';

export function AutoReportDashboard() {
  const [status, setStatus] = useState<DashboardStatus>('idle');
  const [reportData, setReportData] = useState<ProcessedReportData[]>([]);
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [csvUrl, setCsvUrl] = useState<string>('');
  const [lastGenerated, setLastGenerated] = useState<string>('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [chartFilters, setChartFilters] = useState<{
    sentiment?: string;
    nature?: string;
    word?: string;
  }>({});
  
  const { toast } = useToast();

  // Load initial report data
  const loadReportData = useCallback(async () => {
    try {
      const report = await apiService.getReport();
      
      if (report.csv) {
        const csvContent = await apiService.getFile(report.csv.replace('/files/', ''));
        const parsedData = await parseCSV(csvContent);
        setReportData(parsedData);
        setCsvUrl(apiService.getFileUrl(report.csv.replace('/files/', '')));
      }
      
      if (report.pdf) {
        setPdfUrl(apiService.getFileUrl(report.pdf.replace('/files/', '')));
      }
      
      if (report.generated_at) {
        setLastGenerated(report.generated_at);
      }
      
      setStatus('success');
    } catch (error) {
      // if (error instanceof Error && error.message.includes('404')) {
      //   setStatus('idle');
      //   toast({
      //     title: 'No Report Available',
      //     description: 'Generate your first report to get started.',
      //     variant: 'default'
      //   });
      // } else {
      //   setStatus('error');
      //   toast({
      //     title: 'Error Loading Report',
      //     description: error instanceof Error ? error.message : 'Failed to load report',
      //     variant: 'destructive'
      //   });
      // }
      await loadSampleData();
      toast({
        title: "Using Sample Data",
        description: "Backend unavailable - loaded sample data for demonstration.",
        variant: 'default'
      })
    }
  }, [toast]);

  // Load sample data for development/testing
  const loadSampleData = useCallback(async () => {
    try {
      const response = await fetch('/sample.csv');
      const csvContent = await response.text();
      const parsedData = await parseCSV(csvContent);
      setReportData(parsedData);
      setStatus('success');
      
      toast({
        title: 'Sample Data Loaded',
        description: 'Using sample data for demonstration purposes.',
        variant: 'default'
      });
    } catch (error) {
      console.error('Failed to load sample data:', error);
    }
  }, [toast]);

  // Rerun report
  const handleRerun = useCallback(async () => {
    setShowConfirmDialog(false);
    setStatus('processing');
    
    toast({
      title: 'Starting Report Generation',
      description: 'Backend is scraping live data and processing...',
    });

    try {
      const result = await apiService.rerunReport();
      
      if (result.status === 'ok') {
        // Wait a moment then reload the data
        setTimeout(async () => {
          await loadReportData();
          toast({
            title: 'Report Generated Successfully',
            description: 'New report data has been loaded and displayed.',
          });
        }, 2000);
      } else {
        throw new Error('Rerun failed with status: ' + result.status);
      }
    } catch (error) {
      setStatus('error');
      
      // Fallback to sample data for demo purposes
      setTimeout(() => {
        loadSampleData();
        toast({
          title: 'Using Sample Data',
          description: 'Backend unavailable - loaded sample data for demonstration.',
          variant: 'default'
        });
      }, 1000);
    }
  }, [loadReportData, loadSampleData, toast]);

  // Download handlers
  const handleDownloadPdf = useCallback(() => {
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
    } else {
      toast({
        title: 'PDF Not Available',
        description: 'Generate a report to download the PDF.',
        variant: 'destructive'
      });
    }
  }, [pdfUrl, toast]);

  const handleDownloadCsv = useCallback(() => {
    if (csvUrl) {
      const link = document.createElement('a');
      link.href = csvUrl;
      link.download = 'analysis_output.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      toast({
        title: 'CSV Not Available',
        description: 'Generate a report to download the CSV.',
        variant: 'destructive'
      });
    }
  }, [csvUrl, toast]);

  // Chart click handlers for filtering
  const handleChartClick = useCallback((filterType: string, value: string) => {
    const newFilters = { ...chartFilters };
    
    if (filterType === 'sentiment') {
      newFilters.sentiment = newFilters.sentiment === value ? undefined : value;
    } else if (filterType === 'nature') {
      newFilters.nature = newFilters.nature === value ? undefined : value;
    } else if (filterType === 'word') {
      newFilters.word = newFilters.word === value ? undefined : value;
    }
    
    // Remove undefined values
    Object.keys(newFilters).forEach(key => {
      if (newFilters[key as keyof typeof newFilters] === undefined) {
        delete newFilters[key as keyof typeof newFilters];
      }
    });
    
    setChartFilters(newFilters);
    
    toast({
      title: 'Filter Applied',
      description: `Filtering posts by ${filterType}: ${value}`,
    });
  }, [chartFilters, toast]);

  // Load data on component mount
  useEffect(() => {
    loadReportData();
  }, [loadReportData]);

  // Generate chart data
  const chartData = reportData.length > 0 ? generateChartData(reportData) : {
    sentiment: [],
    nature: [],
    topics: [],
    timeline: []
  };

  const topWords = reportData.length > 0 ? generateTopWords(reportData) : [];

  return (
    <div className="min-h-screen bg-dashboard-bg">
      {/* Header */}
      <DashboardHeader
        status={status}
        onRerun={() => setShowConfirmDialog(true)}
        onDownloadPdf={handleDownloadPdf}
        onDownloadCsv={handleDownloadCsv}
        lastGenerated={lastGenerated}
        disabled={reportData.length === 0}
      />

      <div className="container mx-auto p-6 space-y-8">
        {/* Summary Cards */}
        {reportData.length > 0 && (
          <SummaryCards data={reportData} />
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left Column - Charts */}
          <div className="xl:col-span-2 space-y-8">
            {reportData.length > 0 ? (
              <Charts
                sentimentData={chartData.sentiment}
                natureData={chartData.nature}
                topicsData={chartData.topics}
                timelineData={chartData.timeline}
                topWords={topWords}
                onChartClick={handleChartClick}
              />
            ) : (
              <div className="text-center py-12">
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  No Data Available
                </h2>
                <p className="text-muted-foreground">
                  Generate a report to see analytics and visualizations.
                </p>
              </div>
            )}
          </div>

          {/* Right Column - PDF Preview */}
          <div className="space-y-8">
            <PDFPreview
              pdfUrl={pdfUrl}
              onDownload={handleDownloadPdf}
            />
          </div>
        </div>

        {/* Flagged Posts Section */}
        {reportData.length > 0 && (
          <FlaggedPosts data={reportData} filters={chartFilters} />
        )}
      </div>

      {/* Confirmation Dialog */}
      <RerunConfirmDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        onConfirm={handleRerun}
      />
    </div>
  );
}