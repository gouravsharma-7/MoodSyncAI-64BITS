import { useState } from "react";
import { useJournalEntries, useCreateJournalEntry, getSentimentColor, getSentimentLabel } from "@/hooks/use-journal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Book, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function JournalEntry() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const { toast } = useToast();

  const { data: journalEntries, isLoading } = useJournalEntries(5);
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
      
      toast({
        title: "Journal entry saved",
        description: "Your thoughts have been recorded with sentiment analysis",
      });
    } catch (error) {
      toast({
        title: "Failed to save entry",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

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
              className="h-32 resize-none"
              placeholder="Write about your day, thoughts, or feelings..."
              disabled={createJournalEntry.isPending}
              data-testid="textarea-journal-content"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-chart-4 rounded-full"></div>
              <span className="text-xs text-muted-foreground">
                AI sentiment analysis enabled
              </span>
            </div>
            <Button 
              onClick={handleSaveEntry}
              disabled={!content.trim() || createJournalEntry.isPending}
              data-testid="button-save-entry"
            >
              <Save className="w-4 h-4 mr-2" />
              {createJournalEntry.isPending ? "Saving..." : "Save Entry"}
            </Button>
          </div>
          
          <div className="border-t border-border pt-4">
            <h4 className="text-sm font-medium text-foreground mb-3">Recent Entries</h4>
            <div className="space-y-2">
              {journalEntries?.length ? (
                journalEntries.map((entry) => (
                  <div key={entry.id} className="p-3 bg-muted rounded-lg" data-testid={`journal-entry-${entry.id}`}>
                    {entry.title && (
                      <h5 className="text-sm font-medium text-foreground mb-1">{entry.title}</h5>
                    )}
                    <p className="text-sm text-foreground line-clamp-2 mb-2">
                      {entry.content}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {new Date(entry.createdAt).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </span>
                      <div className="flex items-center gap-1">
                        <div className={`w-1.5 h-1.5 bg-${getSentimentColor(entry.sentiment)} rounded-full`}></div>
                        <span className="text-xs text-muted-foreground">
                          {getSentimentLabel(entry.sentiment)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-3 bg-muted rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">
                    No journal entries yet. Start writing to track your thoughts and emotions.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
