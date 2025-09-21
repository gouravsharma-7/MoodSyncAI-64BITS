import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { MoodEntry } from "@shared/schema";

export function useMoodEntries(range?: 'week' | 'all', limit?: number) {
  return useQuery<MoodEntry[]>({
    queryKey: ['/api/mood', { range, limit }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (range) params.append('range', range);
      if (limit) params.append('limit', limit.toString());
      
      const response = await fetch(`/api/mood?${params}`);
      if (!response.ok) throw new Error('Failed to fetch mood entries');
      return response.json();
    },
  });
}

export function useCreateMoodEntry() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { mood: number; notes?: string }) => {
      const response = await apiRequest('POST', '/api/mood', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/mood'] });
      queryClient.invalidateQueries({ queryKey: ['/api/insights'] });
    },
  });
}

export function getMoodEmoji(mood: number): string {
  const emojis = {
    1: "😢",
    2: "😔", 
    3: "😐",
    4: "😊",
    5: "😄"
  };
  return emojis[mood as keyof typeof emojis] || "😐";
}

export function getMoodLabel(mood: number): string {
  const labels = {
    1: "Very Sad",
    2: "Sad",
    3: "Neutral",
    4: "Good", 
    5: "Great"
  };
  return labels[mood as keyof typeof labels] || "Neutral";
}
