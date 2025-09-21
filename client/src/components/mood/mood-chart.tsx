import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Area, AreaChart } from "recharts";
import { useMoodEntries, getMoodEmoji, getMoodLabel } from "@/hooks/use-mood";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { TrendingUp, Calendar } from "lucide-react";
import { useMemo, useState } from "react";

export default function MoodChart() {
  const [timeRange, setTimeRange] = useState<'week' | 'month'>('week');
  const { data: moodEntries, isLoading, error } = useMoodEntries(timeRange);

  // Process data for chart
  const chartData = useMemo(() => {
    if (!moodEntries?.length) return [];

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const daysToShow = timeRange === 'week' ? 7 : 30;
    const dataPoints = [];
    
    for (let i = daysToShow - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayName = timeRange === 'week' 
        ? dayNames[date.getDay()]
        : `${date.getMonth() + 1}/${date.getDate()}`;
      
      const dayEntries = moodEntries.filter(entry => {
        const entryDate = new Date(entry.timestamp);
        return entryDate.toDateString() === date.toDateString();
      });
      
      const averageMood = dayEntries.length > 0 
        ? dayEntries.reduce((sum, entry) => sum + entry.mood, 0) / dayEntries.length
        : null;
      
      dataPoints.push({
        day: dayName,
        mood: averageMood,
        emoji: averageMood ? getMoodEmoji(Math.round(averageMood)) : null,
        entries: dayEntries.length,
        date: date.toISOString().split('T')[0],
      });
    }
    
    return dataPoints;
  }, [moodEntries, timeRange]);

  const averageMood = useMemo(() => {
    if (!moodEntries?.length) return null;
    const sum = moodEntries.reduce((acc, entry) => acc + entry.mood, 0);
    return sum / moodEntries.length;
  }, [moodEntries]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload[0]) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium">{timeRange === 'week' ? label : `Day ${label}`}</p>
          {data.mood ? (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-lg">{data.emoji}</span>
              <div>
                <span className="text-sm font-medium">
                  {getMoodLabel(Math.round(data.mood))}
                </span>
                <p className="text-xs text-muted-foreground">
                  Average: {data.mood.toFixed(1)}/5 ({data.entries} entries)
                </p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground mt-1">No mood entries</p>
          )}
        </div>
      );
    }
    return null;
  };

  if (error) {
    return (
      <Card className="lg:col-span-2" data-testid="mood-chart">
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Failed to load mood data</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="lg:col-span-2" data-testid="mood-chart">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg font-semibold">Mood Tracker</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-muted rounded-lg p-1">
              <Button
                variant={timeRange === 'week' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setTimeRange('week')}
                className="h-7 px-3 text-xs"
              >
                Week
              </Button>
              <Button
                variant={timeRange === 'month' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setTimeRange('month')}
                className="h-7 px-3 text-xs"
              >
                Month
              </Button>
            </div>
          </div>
        </div>
        {averageMood && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Average mood:</span>
            <span className="font-medium flex items-center gap-1">
              {getMoodEmoji(Math.round(averageMood))} {averageMood.toFixed(1)}/5
            </span>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="h-64">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Calendar className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-2">
                  No mood data for the selected period
                </p>
                <p className="text-xs text-muted-foreground">
                  Start logging your mood to see trends here
                </p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="day" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                />
                <YAxis 
                  domain={[1, 5]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  tickFormatter={(value) => getMoodEmoji(value)}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="mood"
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  fill="url(#moodGradient)"
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: 'hsl(var(--primary))' }}
                  connectNulls={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
