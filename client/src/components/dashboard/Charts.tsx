import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartDataPoint, TimelineDataPoint } from '@/types/report';
import { apiService } from '@/services/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';

interface ChartsProps {
  sentimentData: ChartDataPoint[];
  natureData: ChartDataPoint[];
  topicsData: ChartDataPoint[];
  timelineData: TimelineDataPoint[];
  topWords: ChartDataPoint[];
  onChartClick?: (filterType: string, value: string) => void;
}

const COLORS = ['#4F81BD', '#F28B82', '#A2C181', '#FFB366', '#9D7AD2', '#67C5D1'];
const TOPIC_LABELS = {
  0: "Public Protests",
  1: "Governance & Elections",
  2: "Kashmir Issues"
}

export function Charts({
  sentimentData,
  natureData,
  topicsData,
  timelineData,
  topWords,
  onChartClick
}: ChartsProps) {
  const mappedTopicsData = topicsData.map((item) => ({
    name: TOPIC_LABELS[Number(item.name)] ?? `Topic ${item.name}`,
    value: item.value,
  }));
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Sentiment Distribution */}
      <Card className="bg-dashboard-card border-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">
            Sentiment Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={sentimentData}
            // margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--dashboard-card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Bar
                dataKey="value"
                radius={[4, 4, 0, 0]}
                cursor="pointer"
                onClick={(data) => onChartClick?.('sentiment', data.name)}
              >
                {sentimentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Nature Distribution */}
      <Card className="bg-dashboard-card border-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">
            Nature Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={natureData}
                cx="50%"
                cy="50%"
                // outerRadius={80}
                innerRadius={50}
                outerRadius={90}
                fill="#8884d8"
                dataKey="value"
                // label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                label={({ name, percent }) =>
                  percent > 0.05 ? `${name.length > 10 ? name.substring(0, 10) + '...' : name} (${(percent * 100).toFixed(0)}%)` : ''
                }
                labelLine={false}
              >
                {natureData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                    cursor="pointer"
                    onClick={() => onChartClick?.('nature', entry.name)}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--dashboard-card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>


      {/* Topics Distribution */}
      <Card className="bg-dashboard-card border-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">
            Topics Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={mappedTopicsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="name"
                interval={0}
                angle={-25}
                textAnchor="end"
                height={100}
                stroke="hsl(var(--muted-foreground))"
              />

              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--dashboard-card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Bar
                dataKey="value"
                fill="hsl(var(--chart-primary))"
                radius={[4, 4, 0, 0]}
                cursor="pointer"
                onClick={(data) => onChartClick?.('topic', data.name)}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Posts Timeline */}
      <Card className="bg-dashboard-card border-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">
            Posts Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                stroke="hsl(var(--muted-foreground))"
                tickFormatter={(date) => new Date(date).toLocaleDateString()}
              />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--dashboard-card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
                labelFormatter={(date) => new Date(date).toLocaleDateString()}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="hsl(var(--chart-primary))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--chart-primary))', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: 'hsl(var(--chart-primary))', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Word Cloud - Spans full width */}
      <Card className="bg-dashboard-card border-border lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">
            Word Cloud
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center">
          <div className="w-full max-w-2xl">
            <img
              src={apiService.getWordCloudUrl()}
              alt="Word Cloud Visualization"
              className="w-full h-auto rounded-lg shadow-sm"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  parent.innerHTML = '<div class="text-center py-8 text-muted-foreground">Word cloud not available</div>';
                }
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Top Words - Spans full width */}
      <Card className="bg-dashboard-card border-border lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">
            Top 20 Words
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {topWords.map((word, index) => (
              <div
                key={index}
                className="flex flex-col items-center p-3 bg-muted rounded-lg hover:bg-accent transition-colors cursor-pointer"
                onClick={() => onChartClick?.('word', word.name)}
              >
                <span className="font-medium text-sm text-foreground">{word.name}</span>
                <span className="text-xs text-muted-foreground">{word.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}