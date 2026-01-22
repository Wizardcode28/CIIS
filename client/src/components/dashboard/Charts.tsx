import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartDataPoint,
  TimelineDataPoint,
  StackedChartDataPoint,
  HeatmapDataPoint,
  ScatterDataPoint,
  NatureSentimentDataPoint
} from '@/types/report';
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
  Line,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  ZAxis,
  Legend
} from 'recharts';

interface ChartsProps {
  sentimentData: ChartDataPoint[];
  natureData: ChartDataPoint[];
  topicsData: ChartDataPoint[];
  timelineData: TimelineDataPoint[];
  topWords: ChartDataPoint[];
  sentimentTrend: StackedChartDataPoint[];
  activityHeatmap: HeatmapDataPoint[];
  engagementScatter: ScatterDataPoint[];
  dangerousData: ChartDataPoint[];
  subredditEngagement: ChartDataPoint[];
  natureSentiment: NatureSentimentDataPoint[];
  riskySubreddits: ChartDataPoint[];
  onChartClick?: (filterType: string, value: string) => void;
}

const COLORS = ['#4F81BD', '#F28B82', '#A2C181', '#FFB366', '#9D7AD2', '#67C5D1'];
const TOPIC_LABELS = {
  0: "Public Protests",
  1: "Governance & Elections",
  2: "Kashmir Issues"
}

const SENTIMENT_COLORS: Record<string, string> = {
  "Positive": "#4CAF50", // Green
  "Neutral": "#9E9E9E",  // Grey
  "Negative": "#EF5350", // Red
  "Pro-India": "#4CAF50",
  "Anti-India": "#EF5350",
  "pro-india": "#4CAF50",
  "anti-india": "#EF5350"
};

export function Charts({
  sentimentData,
  natureData,
  topicsData,
  timelineData,
  topWords,
  sentimentTrend,
  activityHeatmap,
  engagementScatter,
  dangerousData,
  subredditEngagement,
  natureSentiment,
  riskySubreddits,
  onChartClick
}: ChartsProps) {
  // Helper for Heatmap
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const getHeatmapValue = (day: string, hour: number) => {
    return activityHeatmap.find(h => h.day === day && h.hour === hour)?.value || 0;
  };
  const maxHeatmapValue = Math.max(...activityHeatmap.map(h => h.value), 1);

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
            <BarChart
              data={sentimentData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="name"
                stroke="hsl(var(--muted-foreground))"
                interval={0}
                angle={-25}
                textAnchor="end"
                height={80}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                allowDecimals={false}
              />
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
                  <Cell
                    key={`cell-${index}`}
                    fill={SENTIMENT_COLORS[entry.name] || SENTIMENT_COLORS[entry.name.replace(' ', '-')] || COLORS[index % COLORS.length]}
                  />
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
                innerRadius={40}
                outerRadius={70}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) =>
                  percent > 0.05 ? `${name.length > 15 ? name.substring(0, 15) + '...' : name} (${(percent * 100).toFixed(0)}%)` : ''
                }
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
            <BarChart data={mappedTopicsData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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


      {/* Sentiment Trend (Stacked Area) */}
      <Card className="bg-dashboard-card border-border lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">
            Sentiment Trends Over Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={sentimentTrend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorNeu" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorNeg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ff8042" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#ff8042" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" tickFormatter={(date) => new Date(date).toLocaleDateString()} />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--dashboard-card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Area type="monotone" dataKey="positive" stackId="1" stroke="#82ca9d" fill="url(#colorPos)" />
              <Area type="monotone" dataKey="neutral" stackId="1" stroke="#8884d8" fill="url(#colorNeu)" />
              <Area type="monotone" dataKey="negative" stackId="1" stroke="#ff8042" fill="url(#colorNeg)" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Activity Heatmap */}
      <Card className="bg-dashboard-card border-border lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">
            Post Activity Heatmap (Day vs Hour)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-x-auto">
            <div className="min-w-[600px]">
              <div className="grid gap-1" style={{ gridTemplateColumns: 'auto repeat(24, minmax(0, 1fr))' }}>
                <div className="h-8"></div> {/* Corner spacer */}
                {hours.map(h => (
                  <div key={h} className="text-xs text-muted-foreground text-center">{h}</div>
                ))}

                {days.map(day => (
                  <>
                    <div key={day} className="text-xs text-muted-foreground pr-2 flex items-center">{day}</div>
                    {hours.map(hour => {
                      const val = getHeatmapValue(day, hour);
                      const opacity = val / maxHeatmapValue;
                      return (
                        <div
                          key={`${day}-${hour}`}
                          className="h-8 rounded-sm transition-all hover:ring-2 ring-primary relative group"
                          style={{
                            backgroundColor: val > 0 ? `rgba(79, 129, 189, ${0.1 + (opacity * 0.9)})` : 'hsl(var(--muted)/0.3)'
                          }}
                        >
                          {val > 0 && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-popover text-popover-foreground text-[10px] px-1 rounded border shadow-sm whitespace-nowrap z-10">
                              {val} posts
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subreddit Engagement Bar Chart */}
      <Card className="bg-dashboard-card border-border lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">
            Top Subreddits by Engagement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={subredditEngagement}
              layout="vertical"
              margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
              <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
              <YAxis
                dataKey="name"
                type="category"
                width={100}
                stroke="hsl(var(--muted-foreground))"
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--dashboard-card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="value" fill="#8884d8" radius={[0, 4, 4, 0]}>
                {subredditEngagement.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Nature vs Sentiment Stacked Bar */}
      <Card className="bg-dashboard-card border-border lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">
            Sentiment by Nature (Discussion Type)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart
              data={natureSentiment}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="nature" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{ backgroundColor: 'hsl(var(--dashboard-card))', borderColor: 'hsl(var(--border))' }}
              />
              <Legend />
              <Bar dataKey="positive" stackId="a" fill="#6baed6" name="Positive" />
              <Bar dataKey="neutral" stackId="a" fill="#9e9ac8" name="Neutral" />
              <Bar dataKey="negative" stackId="a" fill="#fd8d3c" name="Negative" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Words - Moved back here */}
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