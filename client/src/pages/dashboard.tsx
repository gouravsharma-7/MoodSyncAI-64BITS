import Header from "@/components/layout/header";
import MoodChart from "@/components/mood/mood-chart";
import MoodLogger from "@/components/mood/mood-logger";
import AIInsights from "@/components/insights/ai-insights";
import ChatInterface from "@/components/chat/chat-interface";
import JournalEntry from "@/components/journal/journal-entry";
import ContentCards from "@/components/recommendations/content-cards";
import ActivitySuggestions from "@/components/activities/activity-suggestions";

export default function Dashboard() {
  return (
    <div data-testid="dashboard">
      <Header />
      
      <div className="p-6 space-y-6">
        {/* Mood tracking section */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-card rounded-lg p-6">
              <MoodChart />
              <MoodLogger />
            </div>
          </div>
          <AIInsights />
        </div>

        {/* Chat and Journal section */}
        <div className="grid lg:grid-cols-2 gap-6">
          <ChatInterface />
          <JournalEntry />
        </div>

        {/* Content recommendations */}
        <ContentCards />

        {/* Activity suggestions */}
        <ActivitySuggestions />
      </div>
    </div>
  );
}
