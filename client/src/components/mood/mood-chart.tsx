import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { useMoodEntries, getMoodEmoji } from "@/hooks/use-mood";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo } from "react";

export default function MoodChart() {
  const { data: moodEntries, isLoading } = useMoodEntries('week');

  // Process data for chart - group by day and average mood
  const chartData = useMemo(() => {
    if (!moodEntries?.length) return [];

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const last7Days = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayName = dayNames[date.getDay()];
      
      const dayEntries = moodEntries.filter(entry => {
        const entryDate = new Date(entry.timestamp);
        return entryDate.toDateString() === date.toDateString();
      });
      
      const averageMood = dayEntries.length > 0 
        ? dayEntries.reduce((sum, entry) => sum + entry.mood, 0) / dayEntries.length
        : null;
      
      last7Days.push({
        day: dayName,
        mood: averageMood,
        emoji: averageMood ? getMoodEmoji(Math.round(averageMood)) : null,
      });
    }
    
    return last7Days;
  }, [moodEntries]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload[0]) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm text-foreground font-medium">{label}</p>
          {data.mood && (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-lg">{data.emoji}</span>
              <span className="text-sm text-muted-foreground">
                Mood: {data.mood.toFixed(1)}/5
              </span>
            </div>
          )}
          {!data.mood && (
            <p className="text-xs text-muted-foreground">No mood entries</p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="lg:col-span-2" data-testid="mood-chart">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Weekly Mood Tracker</CardTitle>
          <button className="text-primary hover:text-primary/80 text-sm font-medium">
            View Details
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64 mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis 
                dataKey="day" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(45, 15%, 46%)', fontSize: 12 }}
              />
              <YAxis 
                domain={[0, 5]}
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(45, 15%, 46%)', fontSize: 12 }}
                tickFormatter={(value) => getMoodEmoji(value)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="mood" 
                stroke="hsl(9, 75%, 61%)"
                strokeWidth={3}
                dot={{ fill: 'hsl(9, 75%, 61%)', strokeWidth: 2, r: 6 }}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
