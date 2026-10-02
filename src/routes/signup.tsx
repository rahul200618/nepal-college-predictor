import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import {
  GraduationCap,
  ArrowRight,
  Phone,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  Shield,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ThemeToggle";
import { getCurrentUser, setStoredUser } from "@/lib/auth";
import { firebaseAuth } from "@/lib/firebase";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
  updateProfile,
  getAdditionalUserInfo
} from "firebase/auth";

const TITLE = "Sign up — METRO RANK";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: TITLE },
      {
        name: "description",
        content:
          "Create your free METRO RANK account with your phone number to predict your CEE rank and track your college chances.",
      },
    ],
  }),
  component: SignupPage,
});

const COUNTRY_CODES = [
  { code: "+977", flag: "🇳🇵", name: "Nepal" },
  { code: "+91", flag: "🇮🇳", name: "India" },
  { code: "+1", flag: "🇺🇸", name: "USA" },
  { code: "+44", flag: "🇬🇧", name: "UK" },
];

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
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  const confirmationRef = useRef<ConfirmationResult | null>(null);

  const [step, setStep] = useState<"details" | "otp">("details");
  const [fullName, setFullName] = useState("");
  const [countryCode, setCountryCode] = useState("+977");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Check if already logged in
  useEffect(() => {
    void getCurrentUser().then((user) => {
      if (user) navigate({ to: "/" });
    });
  }, [navigate]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const getFullPhoneNumber = () => `${countryCode}${phoneNumber.replace(/\s/g, "")}`;

  // Initialize RecaptchaVerifier ONCE on mount using element ID (more stable than ref)
  useEffect(() => {
    if (!firebaseAuth) return;
    if (recaptchaVerifierRef.current) return;
    const timer = setTimeout(() => {
      if (!firebaseAuth || recaptchaVerifierRef.current) return;
      try {
        recaptchaVerifierRef.current = new RecaptchaVerifier(
          firebaseAuth,
          "recaptcha-signup", // Use ID string — Firebase looks it up at render time
          { size: "invisible" },
        );
      } catch (e) {
        console.warn("RecaptchaVerifier init error:", e);
      }
    }, 100);
    return () => {
      clearTimeout(timer);
      try { recaptchaVerifierRef.current?.clear(); } catch {}
      recaptchaVerifierRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const trimmedName = fullName.trim();
    if (trimmedName.length < 2) {
      setErrorMessage("Please enter your full name (at least 2 characters).");
      return;
    }

    const cleanPhone = phoneNumber.replace(/[\s\-()]/g, "");
    if (cleanPhone.length < 7 || cleanPhone.length > 15 || !/^\d+$/.test(cleanPhone)) {
      setErrorMessage("Please enter a valid phone number (digits only, 7–15 digits).");
      return;
    }

    setLoading(true);
    try {
      if (!recaptchaVerifierRef.current) {
        throw new Error("reCAPTCHA not ready. Please refresh and try again.");
      }

      const fullPhone = getFullPhoneNumber();
      const confirmationResult = await signInWithPhoneNumber(
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        firebaseAuth!,
        fullPhone,
        recaptchaVerifierRef.current,
      );
      confirmationRef.current = confirmationResult;
      setStep("otp");
      setResendCooldown(60);
      setSuccessMessage(`Verification code sent to ${fullPhone}.`);
    } catch (err: unknown) {
      console.error("Firebase send OTP error:", err);
      // Reset reCAPTCHA so the user can retry without reloading the page
      try {
        if (recaptchaVerifierRef.current) {
          recaptchaVerifierRef.current.render().then((widgetId) => {
            // @ts-expect-error grecaptcha is on window
            if (typeof window !== "undefined" && window.grecaptcha?.reset) {
              // @ts-expect-error grecaptcha is on window
              window.grecaptcha.reset(widgetId);
            }
          });
        }
      } catch {}

      const msg = err instanceof Error ? err.message : "Failed to send OTP.";
      if (msg.includes("region enabled") || msg.includes("operation-not-allowed")) {
        setErrorMessage("Firebase SMS Region blocked. In Firebase Console, go to Authentication > Settings > SMS Region Policy and allow Nepal (+977), or use your registered test phone number.");
      } else if (msg.includes("invalid-phone-number")) {
        setErrorMessage("Invalid phone number format. Please check and try again.");
      } else if (msg.includes("too-many-requests")) {
        setErrorMessage("Too many attempts. Please wait a few minutes before trying again.");
      } else {
        setErrorMessage(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const code = otp.join("");
    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
      setErrorMessage("Please enter the complete 6-digit verification code.");
      return;
    }

    if (!confirmationRef.current) {
      setErrorMessage("Session expired. Please go back and request a new code.");
      return;
    }

    setLoading(true);
    try {
      const result = await confirmationRef.current.confirm(code);
      const user = result.user;
      
      const additionalInfo = getAdditionalUserInfo(result);
      if (!additionalInfo?.isNewUser) {
        await firebaseAuth.signOut();
        setErrorMessage("An account with this phone number already exists. Please log in instead.");
        setLoading(false);
        return;
      }

      // Update display name in Firebase
      try {
        await updateProfile(user, { displayName: fullName.trim() });
      } catch {}

      // Save to Supabase profiles table
      try {
        const { supabase } = await import("@/integrations/supabase/client");
        await supabase.from("profiles" as any).upsert({
          id: user.uid,
          phone: user.phoneNumber ?? getFullPhoneNumber(),
          full_name: fullName.trim(),
        });
      } catch (err) {
        console.error("Failed to save profile to database", err);
      }

      setStoredUser({
        id: user.uid,
        phone: user.phoneNumber ?? getFullPhoneNumber(),
        user_metadata: {
          full_name: fullName.trim(),
        },
      });

      setSuccessMessage("Account created! Redirecting...");
      setTimeout(() => navigate({ to: "/" }), 800);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Verification failed.";
      if (msg.includes("invalid-verification-code") || msg.includes("code-expired")) {
        setErrorMessage("Invalid or expired code. Please check and try again.");
      } else {
        setErrorMessage(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (text.length > 0) {
      e.preventDefault();
      const newOtp = [...otp];
      for (let i = 0; i < 6; i++) newOtp[i] = text[i] ?? "";
      setOtp(newOtp);
      otpRefs.current[Math.min(text.length, 5)]?.focus();
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setOtp(["", "", "", "", "", ""]);
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);
    try {
      if (!recaptchaVerifierRef.current) throw new Error("reCAPTCHA not ready. Please refresh the page.");
      const fullPhone = getFullPhoneNumber();
      const confirmationResult = await signInWithPhoneNumber(
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        firebaseAuth!,
        fullPhone,
        recaptchaVerifierRef.current,
      );
      confirmationRef.current = confirmationResult;
      setResendCooldown(60);
      setSuccessMessage("New code sent successfully.");
    } catch (err: unknown) {
      console.error("Firebase resend OTP error:", err);
      try {
        if (recaptchaVerifierRef.current) {
          recaptchaVerifierRef.current.render().then((widgetId) => {
            // @ts-expect-error grecaptcha is on window
            if (typeof window !== "undefined" && window.grecaptcha?.reset) {
              // @ts-expect-error grecaptcha is on window
              window.grecaptcha.reset(widgetId);
            }
          });
        }
      } catch {}
      const msg = err instanceof Error ? err.message : "Failed to resend code.";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background flex relative">
      {/* Invisible reCAPTCHA container — ID must match what RecaptchaVerifier uses */}
      <div id="recaptcha-signup" suppressHydrationWarning />

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
            Start predicting
            <br />
            your rank today —
            <br />
            <span className="text-white/80">it's completely free.</span>
          </h2>

          <div className="mt-8 space-y-4">
            <BenefitItem text="Instant rank estimation from your CEE marks" />
            <BenefitItem text="All 82+ Nepali medical colleges covered" />
            <BenefitItem text="All 14 reservation quotas supported" />
            <BenefitItem text="Scholarship vs. paying seat comparison" />
          </div>

          <div className="mt-10 flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 p-3.5">
            <Shield className="size-5 text-emerald-400 shrink-0" />
            <p className="text-xs text-white/60 leading-relaxed">
              Secure sign-up with <strong className="text-white/80">Firebase Phone OTP</strong> — no password needed.
            </p>
          </div>
        </div>
      </div>

      {/* Right: Form panel */}
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
          {step === "details" ? (
            <>
              <h1 className="text-3xl font-extrabold text-foreground">
                Create account
              </h1>
              <p className="mt-2 text-muted-foreground text-sm">
                Sign up with your phone number — we'll send a verification code
              </p>

              {errorMessage && (
                <div className="mt-4 rounded-xl border border-danger/30 bg-danger/10 p-3.5 flex items-start gap-2.5 text-danger text-sm animate-fade-in">
                  <AlertCircle className="size-4.5 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSendOtp} className="mt-6 space-y-4">
                {/* Full name */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="signup-name"
                    className="text-xs font-bold text-foreground uppercase tracking-wider"
                  >
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Aarav Sharma"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      autoComplete="name"
                      className="pl-10 rounded-xl h-11 border-border/60 focus:border-accent focus:ring-accent/20 bg-card"
                    />
                  </div>
                </div>

                {/* Phone number */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="signup-phone"
                    className="text-xs font-bold text-foreground uppercase tracking-wider"
                  >
                    Phone Number
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="shrink-0 rounded-xl h-11 px-2 border border-border/60 bg-card text-foreground text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 cursor-pointer"
                      aria-label="Country code"
                    >
                      {COUNTRY_CODES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.flag} {c.code}
                        </option>
                      ))}
                    </select>
                    <div className="relative flex-1">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                      <Input
                        id="signup-phone"
                        type="tel"
                        inputMode="numeric"
                        placeholder="98XXXXXXXX"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        required
                        autoComplete="tel"
                        className="pl-10 rounded-xl h-11 border-border/60 focus:border-accent focus:ring-accent/20 bg-card"
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground pl-1">
                    Nepal numbers: start with 98 or 97 (without leading 0)
                  </p>
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
                      Sending code...
                    </span>
                  ) : (
                    <>
                      Send Verification Code
                      <ArrowRight className="ml-2 size-4" />
                    </>
                  )}
                </Button>
              </form>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  setStep("details");
                  setOtp(["", "", "", "", "", ""]);
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className="mb-5 flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft className="size-4" />
                Change details
              </button>

              <h1 className="text-3xl font-extrabold text-foreground">
                Verify your number
              </h1>
              <p className="mt-2 text-muted-foreground text-sm">
                Enter the 6-digit code sent to{" "}
                <strong className="text-foreground font-semibold">
                  {getFullPhoneNumber()}
                </strong>
              </p>

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

              <form onSubmit={handleVerifyOtp} className="mt-6 space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                    Verification Code
                  </label>
                  <div
                    className="flex gap-2.5 justify-center"
                    onPaste={handleOtpPaste}
                  >
                    {otp.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => { otpRefs.current[idx] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        className="w-11 h-14 text-center text-xl font-bold rounded-xl border border-border/60 bg-card text-foreground focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all"
                        aria-label={`Code digit ${idx + 1}`}
                        autoFocus={idx === 0}
                      />
                    ))}
                  </div>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  disabled={loading || otp.join("").length !== 6}
                  className="w-full rounded-xl h-11 bg-accent text-accent-foreground font-bold text-sm shadow-md transition-all hover:shadow-lg hover:scale-[1.01] active:scale-95 disabled:opacity-60"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Verifying...
                    </span>
                  ) : (
                    <>
                      Create Account
                      <ArrowRight className="ml-2 size-4" />
                    </>
                  )}
                </Button>

                <div className="text-center">
                  <p className="text-xs text-muted-foreground">
                    Didn't receive the code?{" "}
                    {resendCooldown > 0 ? (
                      <span className="font-semibold text-muted-foreground">
                        Resend in {resendCooldown}s
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResend}
                        disabled={loading}
                        className="font-bold text-accent hover:underline disabled:opacity-50 transition-colors"
                      >
                        Resend Code
                      </button>
                    )}
                  </p>
                </div>
              </form>
            </>
          )}



          <p className="mt-6 text-center text-xs text-muted-foreground">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-bold text-accent hover:underline"
            >
              Log in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
