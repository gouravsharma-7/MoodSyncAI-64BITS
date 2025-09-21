import Header from "@/components/layout/header";
import ActivitySuggestions from "@/components/activities/activity-suggestions";

export default function Activities() {
  return (
    <div data-testid="activities-page">
      <Header />
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <ActivitySuggestions />
        </div>
      </div>
    </div>
  );
}
