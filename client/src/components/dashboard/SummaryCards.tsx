import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProcessedReportData } from '@/types/report';
import { TrendingUp, AlertTriangle, Shield, Target } from 'lucide-react';

interface SummaryCardsProps {
  data: ProcessedReportData[];
}

export function SummaryCards({ data }: SummaryCardsProps) {
  const totalPosts = data.length;
  const flaggedPosts = data.filter(item => item.dangerous).length;
  const proIndiaCount = data.filter(item => 
    item.nature.toLowerCase().includes('pro-india')
  ).length;
  const antiIndiaCount = data.filter(item => 
    item.nature.toLowerCase().includes('anti-india')
  ).length;
  
  const cards = [
    {
      title: 'Total Posts',
      value: totalPosts,
      icon: TrendingUp,
      color: 'text-chart-primary'
    },
    {
      title: 'Flagged Posts',
      value: flaggedPosts,
      icon: AlertTriangle,
      color: 'text-chart-danger'
    },
    {
      title: 'Pro-India',
      value: proIndiaCount,
      icon: Shield,
      color: 'text-chart-success'
    },
    {
      title: 'Anti-India',
      value: antiIndiaCount,
      icon: Target,
      color: 'text-chart-accent'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <Card key={index} className="bg-dashboard-card border-border shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <card.icon className={`h-4 w-4 ${card.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {card.value.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {card.title === 'Flagged Posts' && totalPosts > 0 && 
                `${((flaggedPosts / totalPosts) * 100).toFixed(1)}% of total`
              }
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}