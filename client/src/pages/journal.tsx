import Header from "@/components/layout/header";
import JournalEntry from "@/components/journal/journal-entry";

export default function Journal() {
  return (
    <div data-testid="journal-page">
      <Header />
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <JournalEntry />
        </div>
      </div>
    </div>
  );
}
