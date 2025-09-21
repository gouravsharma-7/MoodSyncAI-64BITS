import { useCreateMoodEntry, getMoodEmoji } from "@/hooks/use-mood";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function MoodLogger() {
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const createMoodEntry = useCreateMoodEntry();
  const { toast } = useToast();

  const moods = [
    { value: 1, emoji: "😢", label: "Very Sad" },
    { value: 2, emoji: "😔", label: "Sad" },
    { value: 3, emoji: "😐", label: "Neutral" },
    { value: 4, emoji: "😊", label: "Good" },
    { value: 5, emoji: "😄", label: "Great" },
  ];

  const handleMoodSelect = async (mood: number) => {
    setSelectedMood(mood);
    
    try {
      await createMoodEntry.mutateAsync({ mood });
      toast({
        title: "Mood logged successfully",
        description: `You're feeling ${moods.find(m => m.value === mood)?.label.toLowerCase()}`,
      });
      
      // Visual feedback
      setTimeout(() => setSelectedMood(null), 1000);
    } catch (error) {
      toast({
        title: "Failed to log mood",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="border-t border-border pt-4" data-testid="mood-logger">
      <p className="text-sm text-muted-foreground mb-3">How are you feeling right now?</p>
      <div className="flex gap-3">
        {moods.map((mood) => (
          <button
            key={mood.value}
            onClick={() => handleMoodSelect(mood.value)}
            className={`mood-emoji hover:bg-accent p-2 rounded-md transition-all duration-200 ${
              selectedMood === mood.value ? 'scale-125 bg-accent' : ''
            } ${createMoodEntry.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={createMoodEntry.isPending}
            title={mood.label}
            data-testid={`mood-button-${mood.value}`}
          >
            {mood.emoji}
          </button>
        ))}
      </div>
      {createMoodEntry.isPending && (
        <p className="text-xs text-muted-foreground mt-2">Logging your mood...</p>
      )}
    </div>
  );
}
