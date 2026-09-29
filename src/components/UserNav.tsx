import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { User, LogOut, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { cn } from "@/lib/utils";

export function UserNav() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    // Get initial session
    void supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setMenuOpen(false);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <div className="size-8 rounded-full bg-secondary/80 animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2.5">
        <Link
          to="/login"
          className="hidden sm:inline-flex items-center px-3.5 py-1.5 text-xs font-semibold text-foreground hover:text-accent transition-colors"
        >
          Log in
        </Link>
        <Link
          to="/signup"
          className="inline-flex items-center px-4 py-1.5 text-xs font-semibold text-white rounded-lg gradient-nepal shadow-xs hover:shadow-sm transition-all hover:scale-105 active:scale-95"
        >
          Sign up
        </Link>
      </div>
    );
  }

  const displayName =
    (user.user_metadata?.["full_name"] as string | undefined) ||
    user.email?.split("@")[0] ||
    "Aspirant";

  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="relative">
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="flex items-center gap-2 rounded-xl border border-border/60 bg-card/80 py-1 pl-1.5 pr-2.5 shadow-xs transition-all hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        aria-label="User menu"
      >
        <div className="flex size-7 items-center justify-center rounded-lg gradient-nepal text-white text-xs font-bold shadow-xs">
          {initial}
        </div>
        <span className="text-xs font-semibold text-foreground max-w-[100px] truncate hidden sm:inline-block">
          {displayName}
        </span>
        <ChevronDown className="size-3 text-muted-foreground" />
      </button>

      {menuOpen && (
        <div
          className="absolute right-0 mt-2 w-56 rounded-2xl border border-border/60 bg-card p-2 shadow-xl z-50 animate-scale-in"
          onClick={() => setMenuOpen(false)}
        >
          <div className="px-3 py-2 border-b border-border/40">
            <p className="text-xs font-bold text-foreground truncate">{displayName}</p>
            <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
          </div>

          <div className="pt-1">
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-danger hover:bg-danger/10 transition-colors"
            >
              <LogOut className="size-3.5" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
