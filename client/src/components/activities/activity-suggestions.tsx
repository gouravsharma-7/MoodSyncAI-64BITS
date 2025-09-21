import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PaintbrushVertical, PenTool, Utensils, Palette } from "lucide-react";

interface ActivitySuggestion {
  title: string;
  description: string;
  hobby: string;
  duration: string;
  difficulty: string;
  mood_target: string;
}

export default function ActivitySuggestions() {
  const { data: activities, isLoading } = useQuery<ActivitySuggestion[]>({
    queryKey: ['/api/activities', { mood: 4 }], // Default to mood 4 (good)
    queryFn: async () => {
      const response = await fetch('/api/activities?mood=4');
      if (!response.ok) throw new Error('Failed to fetch activities');
      return response.json();
    },
  });

  const getIcon = (hobby: string) => {
    const lowercaseHobby = hobby.toLowerCase();
    if (lowercaseHobby.includes('art') || lowercaseHobby.includes('draw')) return PaintbrushVertical;
    if (lowercaseHobby.includes('writ')) return PenTool;
    if (lowercaseHobby.includes('cook')) return Utensils;
    return Palette;
  };

  if (isLoading) {
    return (
      <Card data-testid="activity-suggestions-loading">
        <CardHeader>
          <CardTitle>Activity Suggestions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-6 bg-muted rounded-lg">
                <div className="flex items-center gap-3 mb-4">
                  <Skeleton className="w-12 h-12 rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <Skeleton className="h-16 w-full mb-4" />
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="activity-suggestions">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Activity Suggestions</CardTitle>
          <span className="text-xs text-muted-foreground">Tailored to your hobbies & mood</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-3 gap-6">
          {activities?.length ? (
            activities.map((activity, index) => {
              const Icon = getIcon(activity.hobby);
              
              return (
                <div 
                  key={index} 
                  className="p-6 bg-muted rounded-lg"
                  data-testid={`activity-${index}`}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-lg mood-gradient flex items-center justify-center">
                      <Icon className="text-primary-foreground text-lg" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-foreground">{activity.title}</h4>
                      <p className="text-xs text-muted-foreground capitalize">{activity.hobby}</p>
                    </div>
                  </div>
                  <p className="text-sm text-foreground mb-4">{activity.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground block">
                        {activity.duration}
                      </span>
                      <span className="text-xs text-muted-foreground block">
                        {activity.difficulty}
                      </span>
                    </div>
                    <Button 
                      size="sm"
                      className="hover:bg-primary/90 transition-colors"
                      data-testid={`button-start-activity-${index}`}
                    >
                      Start Activity
                    </Button>
                  </div>
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium">Target:</span> {activity.mood_target}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full p-8 text-center bg-muted rounded-lg">
              <Palette className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h4 className="text-sm font-medium text-foreground mb-2">No activities yet</h4>
              <p className="text-xs text-muted-foreground">
                Tell us about your hobbies in your preferences to get personalized activity suggestions.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
