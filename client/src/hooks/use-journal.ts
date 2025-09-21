import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { JournalEntry } from "@shared/schema";

export function useJournalEntries(limit?: number) {
  return useQuery<JournalEntry[]>({
    queryKey: ['/api/journal', { limit }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (limit) params.append('limit', limit.toString());
      
      const response = await fetch(`/api/journal?${params}`);
      if (!response.ok) throw new Error('Failed to fetch journal entries');
      return response.json();
    },
  });
}

export function useCreateJournalEntry() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { title?: string; content: string }) => {
      const response = await apiRequest('POST', '/api/journal', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/journal'] });
      queryClient.invalidateQueries({ queryKey: ['/api/insights'] });
    },
  });
}

export function useJournalPrompts(mood?: number) {
  return useQuery({
    queryKey: ['/api/journal/prompts', { mood }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (mood) params.append('mood', mood.toString());
      
      const response = await fetch(`/api/journal/prompts?${params}`);
      if (!response.ok) throw new Error('Failed to fetch journal prompts');
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

export function getSentimentColor(sentiment: any): string {
  if (!sentiment) return "hsl(var(--muted))";
  
  const rating = sentiment.rating;
  if (rating >= 4) return "hsl(142, 76%, 36%)"; // Positive - green
  if (rating <= 2) return "hsl(0, 84%, 60%)"; // Negative - red  
  return "hsl(47, 96%, 53%)"; // Neutral - yellow
}

export function getSentimentLabel(sentiment: any): string {
  if (!sentiment) return "Neutral";
  
  const rating = sentiment.rating;
  if (rating >= 4) return "Positive";
  if (rating <= 2) return "Negative";
  return "Neutral";
}

export function getSentimentEmoji(sentiment: any): string {
  if (!sentiment) return "😐";
  
  const rating = sentiment.rating;
  if (rating >= 4.5) return "😄";
  if (rating >= 4) return "😊";
  if (rating >= 3) return "😐";
  if (rating >= 2) return "😔";
  return "😢";
}
