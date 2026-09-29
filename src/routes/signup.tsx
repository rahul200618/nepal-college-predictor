import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  GraduationCap,
  Eye,
  EyeOff,
  ArrowRight,
  Mail,
  Lock,
  User,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { ThemeToggle } from "@/components/ThemeToggle";

const TITLE = "Sign up — METRO RANK";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: TITLE },
      {
        name: "description",
        content:
          "Create your free METRO RANK account to save predictions and track your CEE college chances.",
      },
    ],
  }),
  component: SignupPage,
});

function BenefitItem({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3">
      <CheckCircle2 className="size-5 text-emerald-400 mt-0.5 shrink-0" />
      <span className="text-sm text-white/75">{text}</span>
    </div>
  );
}

function SignupPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [emailVerificationSent, setEmailVerificationSent] = useState(false);

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

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) {
        setErrorMessage(error.message);
        setLoading(false);
        return;
      }

      if (data.session) {
        // Logged in immediately (email confirmation disabled in Supabase)
        setSuccessMessage("Account created successfully! Redirecting...");
        setTimeout(() => {
          navigate({ to: "/" });
        }, 800);
      } else if (data.user) {
        // Confirmation email dispatched
        setEmailVerificationSent(true);
        setLoading(false);
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
          <div className="absolute top-32 right-20 size-72 rounded-full bg-accent/10 blur-3xl" />
          <div className="absolute bottom-16 left-16 size-64 rounded-full bg-white/5 blur-3xl" />
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
            Start your journey
            <br />
            to the right
            <br />
            <span className="text-white/80">medical college.</span>
          </h2>

          <div className="mt-10 space-y-4">
            <BenefitItem text="Save and compare multiple predictions across programs" />
            <BenefitItem text="Get notified when new cutoff data is published by MEC" />
            <BenefitItem text="Personalized college recommendations based on your rank" />
            <BenefitItem text="Track admission rounds and counseling schedule updates" />
            <BenefitItem text="100% free for all Nepali medical and nursing aspirants" />
          </div>
        </div>
      </div>

      {/* Right: Signup form */}
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
          {emailVerificationSent ? (
            <div className="rounded-2xl border border-success/30 bg-card p-6 shadow-md text-center space-y-4">
              <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-success/15 text-success">
                <Mail className="size-7" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Check your email</h2>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  We've sent a confirmation link to <strong className="text-foreground">{email}</strong>. Click the link in your email to activate your METRO RANK account.
                </p>
              </div>
              <div className="pt-2 flex flex-col gap-2">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center rounded-xl bg-accent px-5 py-2.5 text-sm font-bold text-accent-foreground shadow-sm hover:shadow-md transition-all"
                >
                  Proceed to Log in
                </Link>
                <Link
                  to="/"
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Back to homepage
                </Link>
              </div>
            </div>
          ) : (
            <>
              <h1 className="text-3xl font-extrabold text-foreground">
                Create your account
              </h1>
              <p className="mt-2 text-muted-foreground text-sm">
                Get started free — save and track your CEE college chances
              </p>

              {/* Feedback alerts */}
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
                    htmlFor="signup-name"
                    className="text-xs font-bold text-foreground uppercase tracking-wider"
                  >
                    Full name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="e.g. Aayush Sharma"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      autoComplete="name"
                      className="pl-10 rounded-xl h-11 border-border/60 focus:border-accent focus:ring-accent/20 bg-card"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="signup-email"
                    className="text-xs font-bold text-foreground uppercase tracking-wider"
                  >
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="signup-email"
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
                  <label
                    htmlFor="signup-password"
                    className="text-xs font-bold text-foreground uppercase tracking-wider"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="At least 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      autoComplete="new-password"
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
                      Creating account...
                    </span>
                  ) : (
                    <>
                      Create Free Account
                      <ArrowRight className="ml-2 size-4" />
                    </>
                  )}
                </Button>
              </form>

              <p className="mt-7 text-center text-xs text-muted-foreground">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-bold text-accent hover:underline"
                >
                  Log in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
