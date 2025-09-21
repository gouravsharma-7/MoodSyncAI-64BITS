interface HeaderProps {
  userName?: string;
  currentMood?: string;
  moodEmoji?: string;
}

export default function Header({ 
  userName = "Sarah", 
  currentMood = "Good", 
  moodEmoji = "😊" 
}: HeaderProps) {
  const userInitials = userName.charAt(0).toUpperCase();

  return (
    <header className="bg-card border-b border-border p-6" data-testid="header">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground" data-testid="welcome-message">
            Welcome back, {userName}
          </h2>
          <p className="text-muted-foreground">How are you feeling today?</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Today's Mood</p>
            <div className="flex items-center gap-2">
              <span className="mood-emoji" data-testid="mood-emoji">{moodEmoji}</span>
              <span className="text-lg font-semibold text-primary" data-testid="current-mood">
                {currentMood}
              </span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-semibold" data-testid="user-avatar">
              {userInitials}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
