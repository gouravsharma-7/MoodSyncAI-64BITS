import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Headphones, BookOpen, Play, Music, Lightbulb } from "lucide-react";

interface ContentRecommendation {
  title: string;
  description: string;
  type: 'article' | 'meditation' | 'podcast' | 'music' | 'video';
  url?: string;
  mood_match: string;
  benefits: string[];
}

export default function ContentCards() {
  const { data: recommendations, isLoading } = useQuery<ContentRecommendation[]>({
    queryKey: ['/api/recommendations', { mood: 4 }], // Default to mood 4 (good)
    queryFn: async () => {
      const response = await fetch('/api/recommendations?mood=4');
      if (!response.ok) throw new Error('Failed to fetch recommendations');
      return response.json();
    },
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'meditation': return Headphones;
      case 'article': return BookOpen;
      case 'podcast': return Play;
      case 'music': return Music;
      default: return BookOpen;
    }
  };

  const getColor = (index: number) => {
    const colors = ["chart-1", "chart-3", "chart-5", "chart-2"];
    return colors[index % colors.length];
  };

  const getBenefit = (benefits: string[]) => {
    return benefits?.[0] || "Relaxing";
  };

  if (isLoading) {
    return (
      <Card data-testid="content-recommendations-loading">
        <CardHeader>
          <CardTitle>Personalized Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-4 bg-muted rounded-lg">
                <div className="flex items-start gap-3">
                  <Skeleton className="w-10 h-10 rounded-lg" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="content-recommendations">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5" />
            Personalized Recommendations
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Based on your current mood:</span>
            <span className="mood-emoji">😊</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {recommendations?.length ? (
            recommendations.map((item, index) => {
              const Icon = getIcon(item.type);
              const color = getColor(index);
              
              return (
                <div 
                  key={index}
                  className="p-4 bg-muted rounded-lg hover:bg-accent transition-colors cursor-pointer"
                  data-testid={`recommendation-${index}`}
                  onClick={() => item.url && window.open(item.url, '_blank')}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg bg-${color} flex items-center justify-center flex-shrink-0`}>
                      <Icon className="text-white text-sm" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-foreground">{item.title}</h4>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                      <div className="flex items-center gap-1 mt-2">
                        <div className={`w-1.5 h-1.5 bg-${color} rounded-full`}></div>
                        <span className="text-xs text-muted-foreground">{getBenefit(item.benefits)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full p-8 text-center bg-muted rounded-lg">
              <Lightbulb className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h4 className="text-sm font-medium text-foreground mb-2">No recommendations yet</h4>
              <p className="text-xs text-muted-foreground">
                Track your mood and journal entries to receive personalized content suggestions.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
