import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Brain, TrendingUp, Lightbulb } from "lucide-react";

export default function AIInsights() {
  const { data: insights, isLoading } = useQuery<{ insights: string[] }>({
    queryKey: ['/api/insights'],
    queryFn: async () => {
      const response = await fetch('/api/insights');
      if (!response.ok) throw new Error('Failed to fetch insights');
      return response.json();
    },
  });

  const getInsightIcon = (index: number) => {
    const icons = [Brain, TrendingUp, Lightbulb];
    const Icon = icons[index % icons.length];
    return <Icon className="w-4 h-4" />;
  };

  const getInsightColor = (index: number) => {
    const colors = ["chart-1", "chart-3", "chart-2"];
    return colors[index % colors.length];
  };

  if (isLoading) {
    return (
      <Card data-testid="ai-insights-loading">
        <CardHeader>
          <CardTitle>AI Insights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 bg-muted rounded-lg">
              <div className="flex items-start gap-3">
                <Skeleton className="w-2 h-2 rounded-full mt-2" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="ai-insights">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5" />
          AI Insights
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {insights?.insights?.length ? (
            insights.insights.map((insight, index) => (
              <div key={index} className="p-4 bg-muted rounded-lg" data-testid={`insight-${index}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 bg-${getInsightColor(index)} rounded-full mt-2 tone-indicator`}></div>
                  <div>
                    <p className="text-sm text-foreground">{insight}</p>
                    <div className="flex items-center gap-2 mt-2">
                      {getInsightIcon(index)}
                      <span className="text-xs text-muted-foreground">
                        AI Analysis • Just now
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-chart-1 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm text-foreground">
                    Start tracking your mood and journaling to receive personalized insights.
                  </p>
                  <span className="text-xs text-muted-foreground">AI Analysis • Ready to help</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
