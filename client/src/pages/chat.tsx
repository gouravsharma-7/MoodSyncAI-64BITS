import Header from "@/components/layout/header";
import ChatInterface from "@/components/chat/chat-interface";

export default function Chat() {
  return (
    <div data-testid="chat-page">
      <Header />
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <ChatInterface />
        </div>
      </div>
    </div>
  );
}
