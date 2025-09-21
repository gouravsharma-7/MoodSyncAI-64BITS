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

export function getSentimentColor(sentiment: any): string {
  if (!sentiment) return "chart-3";
  
  const rating = sentiment.rating;
  if (rating >= 4) return "chart-2"; // Positive - green
  if (rating <= 2) return "chart-5"; // Negative - red  
  return "chart-3"; // Neutral - yellow
}

export function getSentimentLabel(sentiment: any): string {
  if (!sentiment) return "Neutral";
  
  const rating = sentiment.rating;
  if (rating >= 4) return "Positive";
  if (rating <= 2) return "Negative";
  return "Neutral";
}
