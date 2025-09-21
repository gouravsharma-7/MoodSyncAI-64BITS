import { useState, useEffect } from "react";
import { useJournalEntries, useCreateJournalEntry, useJournalPrompts, getSentimentColor, getSentimentLabel, getSentimentEmoji } from "@/hooks/use-journal";
import { useMoodEntries } from "@/hooks/use-mood";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Book, Save, Lightbulb, Sparkles, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function JournalEntry() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: journalEntries, isLoading } = useJournalEntries(5);
  const { data: recentMoods } = useMoodEntries('week', 3);
  const currentMood = recentMoods?.[0]?.mood || 3;
  const { data: journalPrompts, isLoading: promptsLoading, refetch: refetchPrompts } = useJournalPrompts(currentMood);
  const createJournalEntry = useCreateJournalEntry();

  const handleSaveEntry = async () => {
    if (!content.trim()) {
      toast({
        title: "Content required",
        description: "Please write something in your journal entry",
        variant: "destructive",
      });
      return;
    }

    try {
      await createJournalEntry.mutateAsync({ 
        title: title.trim() || undefined, 
        content: content.trim() 
      });
      
      setTitle("");
      setContent("");
      setSelectedPrompt(null);
      
      toast({
        title: "Journal entry saved! ✨",
        description: "Your thoughts have been recorded with AI sentiment analysis",
      });
    } catch (error) {
      toast({
        title: "Failed to save entry",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const usePrompt = (prompt: string) => {
    setSelectedPrompt(prompt);
    if (!content.trim()) {
      setContent(prompt + "\n\n");
    } else {
      setContent(content + "\n\n" + prompt + "\n\n");
    }
  };

  const wordCount = content.trim().split(/\s+/).filter(word => word.length > 0).length;

  if (isLoading) {
    return (
      <Card data-testid="journal-entry-loading">
        <CardHeader>
          <CardTitle>Daily Journal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-32 w-full" />
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Writing Prompts */}
      <Card className="bg-gradient-to-br from-primary/5 to-secondary/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">Writing Prompts</CardTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchPrompts()}
              disabled={promptsLoading}
              className="h-8"
            >
              <RefreshCw className={`w-3 h-3 mr-1 ${promptsLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {promptsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground mb-3">
                {journalPrompts?.theme && (
                  <span>Theme: <span className="font-medium capitalize">{journalPrompts.theme}</span> • </span>
                )}
                Choose a prompt to get started or write freely below
              </p>
              {journalPrompts?.prompts?.map((prompt: string, index: number) => (
                <Button
                  key={index}
                  variant={selectedPrompt === prompt ? "default" : "outline"}
                  className="h-auto p-3 text-left justify-start text-wrap"
                  onClick={() => usePrompt(prompt)}
                >
                  <Sparkles className="w-4 h-4 mr-2 flex-shrink-0" />
                  {prompt}
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Journal Entry */}
      <Card data-testid="journal-entry">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Book className="w-5 h-5" />
            Daily Journal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="journal-title" className="text-sm text-muted-foreground block mb-2">
                Title (optional)
              </Label>
              <Input
                id="journal-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give your entry a title..."
                disabled={createJournalEntry.isPending}
                data-testid="input-journal-title"
              />
            </div>
            
            <div>
              <Label htmlFor="journal-content" className="text-sm text-muted-foreground block mb-2">
                Today's Entry
              </Label>
              <Textarea
                id="journal-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[200px] resize-none"
                placeholder="Write about your day, thoughts, or feelings..."
                disabled={createJournalEntry.isPending}
                data-testid="textarea-journal-content"
              />
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span className="text-xs text-muted-foreground">
                      AI sentiment analysis enabled
                    </span>
                  </div>
                  {wordCount > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {wordCount} words
                    </Badge>
                  )}
                </div>
                <Button 
                  onClick={handleSaveEntry}
                  disabled={!content.trim() || createJournalEntry.isPending}
                  data-testid="button-save-entry"
                  className="bg-gradient-to-r from-primary to-primary/80"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {createJournalEntry.isPending ? "Saving..." : "Save Entry"}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Entries */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Entries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {journalEntries?.length ? (
              journalEntries.map((entry) => (
                <div key={entry.id} className="p-4 bg-muted/50 rounded-lg border" data-testid={`journal-entry-${entry.id}`}>
                  <div className="flex items-start justify-between mb-2">
                    {entry.title && (
                      <h5 className="text-sm font-semibold text-foreground">{entry.title}</h5>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getSentimentEmoji(entry.sentiment)}</span>
                      <Badge 
                        variant="outline" 
                        className="text-xs"
                        style={{ borderColor: getSentimentColor(entry.sentiment) }}
                      >
                        {getSentimentLabel(entry.sentiment)}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-foreground mb-3 line-clamp-3">
                    {entry.content}
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {new Date(entry.createdAt).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </span>
                    {entry.sentiment?.dominant_emotion && (
                      <span className="capitalize font-medium">
                        {entry.sentiment.dominant_emotion}
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 bg-muted/50 rounded-lg text-center">
                <Book className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-2">
                  No journal entries yet
                </p>
                <p className="text-xs text-muted-foreground">
                  Start writing to track your thoughts and emotions with AI insights
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
