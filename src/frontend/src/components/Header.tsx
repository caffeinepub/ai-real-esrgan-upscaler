import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { Sparkles, Zap } from "lucide-react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetCallerProfile } from "../hooks/useQueries";

export default function Header() {
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const { data: profile } = useGetCallerProfile();

  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === "logging-in";

  const handleAuth = async () => {
    if (isAuthenticated) {
      await clear();
      queryClient.clear();
    } else {
      try {
        await login();
      } catch (error: any) {
        if (error?.message === "User is already authenticated") {
          await clear();
          setTimeout(() => login(), 300);
        }
      }
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3" data-ocid="nav.link">
            <div className="relative">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center neon-glow-cyan">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <Zap className="absolute -bottom-1 -right-1 w-3.5 h-3.5 text-accent" />
            </div>
            <div>
              <h1 className="font-display font-bold text-lg leading-tight">
                <span className="gradient-text">AI Real-ESRGAN</span>
              </h1>
              <p className="text-xs text-muted-foreground leading-none">
                Upscaler Service
              </p>
            </div>
          </div>

          {/* Nav items */}
          <nav className="hidden md:flex items-center gap-1">
            <Badge
              variant="outline"
              className="border-primary/30 text-primary bg-primary/10 text-xs"
            >
              v2.0
            </Badge>
            <Badge
              variant="outline"
              className="border-accent/30 text-accent bg-accent/10 text-xs ml-2"
            >
              GPU Optimized
            </Badge>
          </nav>

          {/* Auth */}
          <div className="flex items-center gap-3">
            {isAuthenticated && profile && (
              <span className="hidden sm:block text-sm text-muted-foreground">
                {profile.name}
              </span>
            )}
            <Button
              onClick={handleAuth}
              disabled={isLoggingIn}
              variant={isAuthenticated ? "outline" : "default"}
              size="sm"
              data-ocid="auth.button"
              className={
                isAuthenticated
                  ? "border-border/60 hover:border-destructive/60 hover:text-red-400"
                  : "bg-primary text-primary-foreground hover:bg-primary/90 neon-glow-cyan"
              }
            >
              {isLoggingIn
                ? "Connecting..."
                : isAuthenticated
                  ? "Disconnect"
                  : "Connect Wallet"}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
