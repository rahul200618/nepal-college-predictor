import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { User, LogOut, ChevronDown, Phone, Shield, Code } from "lucide-react";
import { subscribeToAuth, signOutUser, type MetroUser } from "@/lib/auth";
import { isPhoneGrantedAdmin, isDeveloperUnlocked } from "@/lib/admin-access";
import { cn } from "@/lib/utils";

export function UserNav() {
  const [user, setUser] = useState<MetroUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToAuth((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await signOutUser();
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
    user.phone ||
    "Aspirant";

  // Format phone for display: +977 98XXXXXXXX → +977 98XX XXXX
  const displayPhone = user.phone
    ? user.phone.replace(/(\+\d{1,4})(\d{4})(\d+)/, "$1 $2 $3")
    : "";

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
        <span className="text-xs font-semibold text-foreground max-w-[100px] truncate">
          {displayName}
        </span>
        <ChevronDown className={cn("size-3 text-muted-foreground transition-transform", menuOpen && "rotate-180")} />
      </button>

      {menuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setMenuOpen(false)}
          />
          <div
            className="absolute right-0 mt-2 w-60 rounded-2xl border border-border/60 bg-card p-2 shadow-xl z-50 animate-scale-in"
          >
            <div className="px-3 py-2.5 border-b border-border/40">
              <p className="text-xs font-bold text-foreground truncate">{displayName}</p>
              {displayPhone && (
                <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                  <Phone className="size-3 shrink-0" />
                  {displayPhone}
                </p>
              )}
            </div>

            {(isPhoneGrantedAdmin(user.phone) || isDeveloperUnlocked()) && (
              <div className="py-1 border-b border-border/40 space-y-0.5">
                <Link
                  to="/admin"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-foreground hover:bg-secondary transition-colors"
                >
                  <Shield className="size-3.5 text-accent" />
                  <span>Admin Console</span>
                </Link>
                {isDeveloperUnlocked() && (
                  <Link
                    to="/developer"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-foreground hover:bg-secondary transition-colors"
                  >
                    <Code className="size-3.5 text-primary" />
                    <span>Developer Portal</span>
                  </Link>
                )}
              </div>
            )}

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
        </>
      )}
    </div>
  );
}
