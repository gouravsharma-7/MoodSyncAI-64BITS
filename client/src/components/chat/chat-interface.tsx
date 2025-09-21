import { useState, useRef, useEffect } from "react";
import { useChatMessages, useSendMessage, formatMessageTime } from "@/hooks/use-chat";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Mic, Bot, User, Heart, Brain, MessageCircle, MicOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const TypingIndicator = () => (
  <div className="flex items-start gap-3">
    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
      <Bot className="text-primary-foreground w-4 h-4" />
    </div>
    <div className="bg-accent text-accent-foreground p-3 rounded-lg">
      <div className="flex items-center gap-1">
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-current rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-current rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 bg-current rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        </div>
        <span className="text-xs ml-2 opacity-70">MoodWise is thinking...</span>
      </div>
    </div>
  </div>
);

export default function ChatInterface() {
  const [message, setMessage] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const { data: messages, isLoading, error } = useChatMessages(50);
  const sendMessage = useSendMessage();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, sendMessage.isPending]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSendMessage = async () => {
    if (!message.trim() || sendMessage.isPending) return;
    
    const messageToSend = message;
    setMessage("");
    
    try {
      await sendMessage.mutateAsync(messageToSend);
    } catch (error) {
      toast({
        title: "Failed to send message",
        description: "Please check your connection and try again",
        variant: "destructive",
      });
    }
  };

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast({
        title: "Voice input not supported",
        description: "Your browser doesn't support speech recognition",
        variant: "destructive",
      });
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      toast({
        title: "Listening...",
        description: "Speak now, I'm listening",
      });
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setMessage(prev => prev + (prev ? ' ' : '') + transcript);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      toast({
        title: "Voice recognition error",
        description: "Please try again or check microphone permissions",
        variant: "destructive",
      });
    };

    recognition.onend = () => {
      setIsListening(false);
      setRecognition(null);
    };

    setRecognition(recognition);
    recognition.start();
  };

  const stopListening = () => {
    if (recognition) {
      recognition.stop();
      setRecognition(null);
      setIsListening(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getToneColor = (tone?: any) => {
    if (!tone) return 'bg-muted';
    const detected = tone.detected?.toLowerCase() || '';
    if (detected.includes('happy') || detected.includes('joy')) return 'bg-green-500';
    if (detected.includes('sad') || detected.includes('down')) return 'bg-blue-500';
    if (detected.includes('angry') || detected.includes('frustrated')) return 'bg-red-500';
    if (detected.includes('anxious') || detected.includes('worried')) return 'bg-yellow-500';
    if (detected.includes('calm') || detected.includes('peaceful')) return 'bg-emerald-500';
    return 'bg-purple-500';
  };

  if (error) {
    return (
      <Card data-testid="chat-interface-error">
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <MessageCircle className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-2">Failed to load chat</p>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card data-testid="chat-interface-loading">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5" />
            AI Companion Chat
          </CardTitle>
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
    <Card data-testid="chat-interface" className="h-[600px] flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <div className="relative">
              <Bot className="w-5 h-5" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></div>
            </div>
            MoodWise AI
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              <Heart className="w-3 h-3 mr-1" />
              Empathetic
            </Badge>
            <Badge variant="outline" className="text-xs">
              <Brain className="w-3 h-3 mr-1" />
              Gemini + OpenRouter
            </Badge>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Your AI companion for mental wellness support and emotional guidance
        </p>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-4">
        <ScrollArea className="flex-1 h-0">
          <div className="space-y-4 pr-4">
            {messages?.length ? (
              messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}
                  data-testid={`message-${msg.role}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center flex-shrink-0 shadow-sm">
                      <Bot className="text-primary-foreground w-4 h-4" />
                    </div>
                  )}
                  
                  <div className={`max-w-[80%] ${msg.role === 'user' ? 'order-first' : ''}`}>
                    <div className={`p-3 rounded-lg shadow-sm ${
                      msg.role === 'user' 
                        ? 'bg-primary text-primary-foreground ml-auto' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                    </div>
                    
                    <div className={`flex items-center gap-2 mt-1 text-xs opacity-70 ${
                      msg.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}>
                      {msg.tone && (
                        <div className="flex items-center gap-1">
                          <div className={`w-2 h-2 rounded-full ${getToneColor(msg.tone)}`}></div>
                          <span className="capitalize">{msg.tone.detected}</span>
                        </div>
                      )}
                      <span>{formatMessageTime(msg.timestamp.toString())}</span>
                    </div>
                  </div>

                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-secondary to-secondary/80 flex items-center justify-center flex-shrink-0 shadow-sm">
                      <User className="text-secondary-foreground w-4 h-4" />
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center h-full text-center">
                <div>
                  <Bot className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Welcome! I'm MoodWise, your AI companion
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Share your thoughts, feelings, or just say hello to get started
                  </p>
                </div>
              </div>
            )}
            
            {sendMessage.isPending && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        
        <div className="flex gap-2 mt-4 pt-3 border-t">
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Share your thoughts, ask for advice, or just chat..."
              className="pr-20"
              disabled={sendMessage.isPending}
              data-testid="input-chat-message"
              maxLength={1000}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              {message.length}/1000
            </div>
          </div>
          
          <Button 
            variant={isListening ? "destructive" : "secondary"}
            size="icon"
            onClick={isListening ? stopListening : startListening}
            disabled={sendMessage.isPending}
            data-testid="button-voice-input"
            title={isListening ? "Stop listening" : "Voice input"}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </Button>
          
          <Button 
            onClick={handleSendMessage}
            disabled={!message.trim() || sendMessage.isPending}
            data-testid="button-send-message"
            className="bg-gradient-to-r from-primary to-primary/80"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        
        {isListening && (
          <div className="flex items-center justify-center gap-2 mt-2 text-xs text-muted-foreground">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            Listening... Speak clearly into your microphone
          </div>
        )}
      </CardContent>
    </Card>
  );
}
