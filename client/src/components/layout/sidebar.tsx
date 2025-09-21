import { Link, useLocation } from "wouter";
import { Brain, ChartLine, MessageCircle, Book, Lightbulb, Palette } from "lucide-react";

export default function Sidebar() {
  const [location] = useLocation();

  const navItems = [
    { path: "/", icon: ChartLine, label: "Dashboard" },
    { path: "/chat", icon: MessageCircle, label: "AI Chat" },
    { path: "/journal", icon: Book, label: "Journal" },
    { path: "/recommendations", icon: Lightbulb, label: "Recommendations" },
    { path: "/activities", icon: Palette, label: "Activities" },
  ];

  return (
    <aside className="w-64 bg-card border-r border-border flex-shrink-0" data-testid="sidebar">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <Brain className="text-primary-foreground text-lg" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">MoodWise</h1>
            <p className="text-xs text-muted-foreground">AI Wellness Companion</p>
          </div>
        </div>
        
        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            
            return (
              <Link key={item.path} href={item.path}>
                <a 
                  className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                    isActive 
                      ? "bg-accent text-accent-foreground" 
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
                  data-testid={`nav-${item.label.toLowerCase()}`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </a>
              </Link>
            );
          })}
        </nav>
        
        <div className="mt-8 p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-chart-2 rounded-full tone-indicator"></div>
            <span className="text-sm font-medium">Tone: Calm</span>
          </div>
          <p className="text-xs text-muted-foreground">AI adapting to your emotional state</p>
        </div>
      </div>
    </aside>
  );
}
