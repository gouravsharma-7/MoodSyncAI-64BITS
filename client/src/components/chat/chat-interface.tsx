import { useState, useRef, useEffect } from "react";
import { useChatMessages, useSendMessage, formatMessageTime } from "@/hooks/use-chat";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Send, Mic, Bot, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ChatInterface() {
  const [message, setMessage] = useState("");
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const { data: messages, isLoading } = useChatMessages(20);
  const sendMessage = useSendMessage();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!message.trim() || sendMessage.isPending) return;
    
    const messageToSend = message;
    setMessage("");
    
    try {
      await sendMessage.mutateAsync(messageToSend);
    } catch (error) {
      toast({
        title: "Failed to send message",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window)) {
      toast({
        title: "Voice input not supported",
        description: "Your browser doesn't support voice recognition",
        variant: "destructive",
      });
      return;
    }

    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setMessage(transcript);
    };

    recognition.onerror = () => {
      toast({
        title: "Voice recognition error",
        description: "Please try again",
        variant: "destructive",
      });
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (isLoading) {
    return (
      <Card data-testid="chat-interface-loading">
        <CardHeader>
          <CardTitle>AI Companion Chat</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="w-8 h-8 rounded-full" />
                <Skeleton className="h-16 flex-1 rounded-lg" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="chat-interface">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5" />
            AI Companion Chat
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-chart-2 rounded-full tone-indicator"></div>
            <span className="text-xs text-muted-foreground">Empathetic Mode</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64 overflow-y-auto mb-4 space-y-3 p-4 bg-muted rounded-lg" data-testid="chat-messages">
          {messages?.length ? (
            messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}
                data-testid={`message-${msg.role}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <Bot className="text-primary-foreground text-sm" />
                  </div>
                )}
                
                <div className={`chat-bubble p-3 rounded-lg ${
                  msg.role === 'user' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-accent text-accent-foreground'
                }`}>
                  <p className="text-sm">{msg.content}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {msg.tone && (
                      <span className="text-xs opacity-70">
                        Tone: {msg.tone.detected}
                      </span>
                    )}
                    <span className="text-xs opacity-70">
                      {formatMessageTime(msg.timestamp.toString())}
                    </span>
                  </div>
                </div>

                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                    <User className="text-secondary-foreground text-sm" />
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p className="text-sm">Start a conversation with your AI companion</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <div className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1"
            disabled={sendMessage.isPending}
            data-testid="input-chat-message"
          />
          <Button 
            onClick={handleSendMessage}
            disabled={!message.trim() || sendMessage.isPending}
            data-testid="button-send-message"
          >
            <Send className="w-4 h-4" />
          </Button>
          <Button 
            variant="secondary"
            onClick={handleVoiceInput}
            disabled={isListening || sendMessage.isPending}
            data-testid="button-voice-input"
          >
            <Mic className={`w-4 h-4 ${isListening ? 'text-primary' : ''}`} />
          </Button>
        </div>
        
        {sendMessage.isPending && (
          <p className="text-xs text-muted-foreground mt-2">Sending message...</p>
        )}
        {isListening && (
          <p className="text-xs text-muted-foreground mt-2">Listening...</p>
        )}
      </CardContent>
    </Card>
  );
}
