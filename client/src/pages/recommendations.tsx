import Header from "@/components/layout/header";
import ContentCards from "@/components/recommendations/content-cards";

export default function Recommendations() {
  return (
    <div data-testid="recommendations-page">
      <Header />
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <ContentCards />
        </div>
      </div>
    </div>
  );
}
