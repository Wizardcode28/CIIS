import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartDataPoint, ScatterDataPoint } from '@/types/report';
import { apiService } from '@/services/api';
import {
    PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
    ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
    BarChart, Bar
} from 'recharts';

interface SideChartsProps {
    engagementScatter: ScatterDataPoint[];
    dangerousData: ChartDataPoint[];
    riskySubreddits: ChartDataPoint[];
    onChartClick?: (filterType: string, value: string) => void;
}

export function SideCharts({
    engagementScatter,
    dangerousData,
    riskySubreddits,
    onChartClick
}: SideChartsProps) {
    return (
        <div className="space-y-8">

            {/* Engagement vs Sentiment Scatter */}
            <Card className="bg-dashboard-card border-border mt-44">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold text-foreground">
                        Engagement vs. Sentiment
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={280}>
                        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis
                                type="number"
                                dataKey="x"
                                name="Sentiment"
                                domain={[-1, 1]}
                                stroke="hsl(var(--muted-foreground))"
                                label={{ value: 'Sentiment', position: 'bottom', offset: 0, fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                                tick={{ fontSize: 10 }}
                            />
                            <YAxis
                                type="number"
                                dataKey="y"
                                name="Engagement"
                                stroke="hsl(var(--muted-foreground))"
                                label={{ value: 'Score', angle: -90, position: 'insideLeft', fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                                tick={{ fontSize: 10 }}
                            />
                            <Tooltip
                                cursor={{ strokeDasharray: '3 3' }}
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        const data = payload[0].payload;
                                        return (
                                            <div className="bg-popover border border-border p-2 rounded shadow-sm text-xs max-w-[200px]">
                                                <p className="font-semibold mb-1 truncate">{data.title}</p>
                                                <p>Subreddit: r/{data.name}</p>
                                                <p>Sentiment: {data.x.toFixed(2)}</p>
                                                <p>Score: {data.y}</p>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Scatter name="Posts" data={engagementScatter} fill="#8884d8" fillOpacity={0.6} />
                        </ScatterChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Dangerous/Flagged Posts Distribution */}
            <Card className="bg-dashboard-card border-border">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold text-foreground">
                        Safety & Flagged Content
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                            <Pie
                                data={dangerousData}
                                cx="50%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={70}
                                paddingAngle={5}
                                dataKey="value"
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                                {dangerousData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
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

            {/* Top Risky Subreddits */}
            <Card className="bg-dashboard-card border-border">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold text-foreground">
                        Top Risky Sources
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={320}>
                        <BarChart
                            data={riskySubreddits}
                            layout="vertical"
                            margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                            <XAxis type="number" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} />
                            <YAxis
                                dataKey="name"
                                type="category"
                                width={80}
                                stroke="hsl(var(--muted-foreground))"
                                tick={{ fontSize: 10 }}
                            />
                            <Tooltip
                                cursor={{ fill: 'transparent' }}
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--dashboard-card))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: '8px'
                                }}
                            />
                            <Bar dataKey="value" fill="#E57373" radius={[0, 4, 4, 0]} name="Dangerous Count" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}
