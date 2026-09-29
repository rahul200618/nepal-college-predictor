import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { GraduationCap, Eye, EyeOff, ArrowRight, Mail, Lock, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { ThemeToggle } from "@/components/ThemeToggle";

const TITLE = "Log in — METRO RANK";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: TITLE },
      {
        name: "description",
        content:
          "Log in to METRO RANK to access your saved predictions and personalized college recommendations.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Check if already logged in
  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        navigate({ to: "/" });
      }
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setErrorMessage(error.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        setSuccessMessage("Logged in successfully! Redirecting...");
        setTimeout(() => {
          navigate({ to: "/" });
        }, 800);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setErrorMessage(msg);
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background flex relative">
      {/* Dark mode toggle top right */}
      <div className="absolute top-5 right-5 z-50">
        <ThemeToggle />
      </div>

      {/* Left: Decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 gradient-hero relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 size-64 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute bottom-20 right-10 size-80 rounded-full bg-accent/10 blur-3xl" />
        </div>

        <div className="relative flex flex-col justify-center px-16 py-12 z-10">
          <Link to="/" className="flex items-center gap-3 mb-12 group">
            <div className="flex size-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 transition-transform group-hover:scale-105">
              <GraduationCap className="size-7 text-white" />
            </div>
            <div>
              <span className="text-2xl font-extrabold text-white tracking-tight">
                METRO RANK
              </span>
              <div className="text-xs font-medium text-white/50 tracking-wider uppercase">
                Nepal CEE Predictor
              </div>
            </div>
          </Link>

          <h2 className="text-4xl font-extrabold text-white leading-tight">
            Your medical
            <br />
            career starts with
            <br />
            <span className="text-white/80">the right prediction.</span>
          </h2>

          <p className="mt-6 text-lg text-white/60 max-w-md leading-relaxed">
            Join thousands of Nepali CEE aspirants who trust METRO RANK for
            accurate rank estimation and college matching.
          </p>

          <div className="mt-12 flex items-center gap-8">
            <div>
              <div className="text-3xl font-bold text-white">6,000+</div>
              <div className="text-sm text-white/50">Students</div>
            </div>
            <div className="w-px h-12 bg-white/15" />
            <div>
              <div className="text-3xl font-bold text-white">82</div>
              <div className="text-sm text-white/50">Colleges</div>
            </div>
            <div className="w-px h-12 bg-white/15" />
            <div>
              <div className="text-3xl font-bold text-white">16</div>
              <div className="text-sm text-white/50">Programs</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Login form */}
      <div className="flex flex-1 flex-col justify-center px-6 py-12 sm:px-12 lg:px-20">
        {/* Mobile logo */}
        <div className="lg:hidden mb-10">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="flex size-9 items-center justify-center rounded-lg gradient-nepal shadow-md">
              <GraduationCap className="size-5 text-white" />
            </div>
            <span className="text-lg font-extrabold tracking-tight text-foreground">
              METRO<span className="text-gradient"> RANK</span>
            </span>
          </Link>
        </div>

        <div className="w-full max-w-md mx-auto animate-slide-up">
          <h1 className="text-3xl font-extrabold text-foreground">
            Welcome back
          </h1>
          <p className="mt-2 text-muted-foreground text-sm">
            Log in to your METRO RANK account to access your saved predictions
          </p>

          {/* Feedback messages */}
          {errorMessage && (
            <div className="mt-4 rounded-xl border border-danger/30 bg-danger/10 p-3.5 flex items-start gap-2.5 text-danger text-sm animate-fade-in">
              <AlertCircle className="size-4.5 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mt-4 rounded-xl border border-success/30 bg-success/10 p-3.5 flex items-start gap-2.5 text-success text-sm animate-fade-in">
              <CheckCircle2 className="size-4.5 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="login-email"
                className="text-xs font-bold text-foreground uppercase tracking-wider"
              >
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="login-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="pl-10 rounded-xl h-11 border-border/60 focus:border-accent focus:ring-accent/20 bg-card"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="login-password"
                  className="text-xs font-bold text-foreground uppercase tracking-wider"
                >
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="pl-10 pr-12 rounded-xl h-11 border-border/60 focus:border-accent focus:ring-accent/20 bg-card"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={loading}
              className="w-full rounded-xl h-11 bg-accent text-accent-foreground font-bold text-sm shadow-md transition-all hover:shadow-lg hover:scale-[1.01] active:scale-95 disabled:opacity-60 mt-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Authenticating...
                </span>
              ) : (
                <>
                  Log in to METRO RANK
                  <ArrowRight className="ml-2 size-4" />
                </>
              )}
            </Button>
          </form>

          <p className="mt-7 text-center text-xs text-muted-foreground">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="font-bold text-accent hover:underline"
            >
              Sign up for free
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
