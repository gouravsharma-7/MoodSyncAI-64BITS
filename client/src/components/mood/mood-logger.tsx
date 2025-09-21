import { useCreateMoodEntry, getMoodEmoji } from "@/hooks/use-mood";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function MoodLogger() {
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const createMoodEntry = useCreateMoodEntry();
  const { toast } = useToast();

  const moods = [
    { value: 1, emoji: "😢", label: "Very Sad", color: "text-red-500" },
    { value: 2, emoji: "😔", label: "Sad", color: "text-orange-500" },
    { value: 3, emoji: "😐", label: "Neutral", color: "text-yellow-500" },
    { value: 4, emoji: "😊", label: "Good", color: "text-green-500" },
    { value: 5, emoji: "😄", label: "Great", color: "text-emerald-500" },
  ];

  const handleMoodSelect = (mood: number) => {
    setSelectedMood(mood);
    setShowNotes(true);
  };

  const handleSaveMood = async () => {
    if (!selectedMood) return;
    
    try {
      await createMoodEntry.mutateAsync({ 
        mood: selectedMood,
        notes: notes.trim() || undefined 
      });
      
      toast({
        title: "Mood logged successfully! 🎉",
        description: `You're feeling ${moods.find(m => m.value === selectedMood)?.label.toLowerCase()}${notes ? ' with notes' : ''}`,
      });
      
      // Reset form
      setSelectedMood(null);
      setNotes("");
      setShowNotes(false);
    } catch (error) {
      toast({
        title: "Failed to log mood",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    setSelectedMood(null);
    setNotes("");
    setShowNotes(false);
  };

  return (
    <Card data-testid="mood-logger" className="bg-gradient-to-br from-background to-muted/20">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <span className="text-2xl">💭</span>
          How are you feeling right now?
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3 justify-center">
          {moods.map((mood) => (
            <button
              key={mood.value}
              onClick={() => handleMoodSelect(mood.value)}
              className={`mood-emoji relative hover:bg-accent p-3 rounded-lg transition-all duration-300 group ${
                selectedMood === mood.value 
                  ? 'scale-110 bg-accent ring-2 ring-primary/50 shadow-lg' 
                  : 'hover:scale-105'
              } ${createMoodEntry.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={createMoodEntry.isPending}
              title={mood.label}
              data-testid={`mood-button-${mood.value}`}
            >
              <div className="text-3xl mb-1">{mood.emoji}</div>
              <div className={`text-xs font-medium ${mood.color} opacity-0 group-hover:opacity-100 transition-opacity`}>
                {mood.label}
              </div>
            </button>
          ))}
        </div>
        
        {showNotes && selectedMood && (
          <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                You selected: <span className="font-medium">
                  {moods.find(m => m.value === selectedMood)?.emoji} {moods.find(m => m.value === selectedMood)?.label}
                </span>
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="mood-notes" className="text-sm font-medium">
                Add a note (optional)
              </Label>
              <Textarea
                id="mood-notes"
                placeholder="What's on your mind? How are you feeling about this mood?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[80px] resize-none"
                maxLength={500}
              />
              <div className="text-xs text-muted-foreground text-right">
                {notes.length}/500 characters
              </div>
            </div>
            
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={createMoodEntry.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveMood}
                disabled={createMoodEntry.isPending}
                className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
              >
                {createMoodEntry.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </div>
                ) : (
                  'Save Mood'
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
