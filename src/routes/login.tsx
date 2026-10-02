import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import {
  GraduationCap,
  ArrowRight,
  Phone,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  Shield,
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
  getAdditionalUserInfo
} from "firebase/auth";

const TITLE = "Log in — METRO RANK";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: TITLE },
      {
        name: "description",
        content:
          "Log in to METRO RANK with your phone number to predict your CEE rank and access personalized college recommendations.",
      },
    ],
  }),
  component: LoginPage,
});

// Country codes for Nepal + common countries
const COUNTRY_CODES = [
  { code: "+977", flag: "🇳🇵", name: "Nepal" },
  { code: "+91", flag: "🇮🇳", name: "India" },
  { code: "+1", flag: "🇺🇸", name: "USA" },
  { code: "+44", flag: "🇬🇧", name: "UK" },
];

function LoginPage() {
  const navigate = useNavigate();
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  const confirmationRef = useRef<ConfirmationResult | null>(null);

  const [step, setStep] = useState<"phone" | "otp">("phone");
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
    // Small delay to ensure the DOM element is painted before Firebase accesses it
    const timer = setTimeout(() => {
      if (!firebaseAuth || recaptchaVerifierRef.current) return;
      try {
        recaptchaVerifierRef.current = new RecaptchaVerifier(
          firebaseAuth,
          "recaptcha-login", // Use ID string — Firebase looks it up at render time
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
      setSuccessMessage(`OTP sent to ${fullPhone}. Please check your messages.`);
    } catch (err: unknown) {
      console.error("Firebase send OTP error:", err);
      // Reset reCAPTCHA so subsequent attempts do not crash or reuse stale token
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
      } else if (msg.includes("billing")) {
        setErrorMessage("SMS service is temporarily unavailable. Please try again later.");
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
      setErrorMessage("Please enter the complete 6-digit OTP.");
      return;
    }

    if (!confirmationRef.current) {
      setErrorMessage("Session expired. Please go back and request a new OTP.");
      return;
    }

    setLoading(true);
    try {
      const result = await confirmationRef.current.confirm(code);
      const user = result.user;
      
      const additionalInfo = getAdditionalUserInfo(result);
      if (additionalInfo?.isNewUser) {
        // They tried to login but didn't have an account
        await user.delete().catch(() => {});
        await firebaseAuth.signOut();
        setErrorMessage("No account found for this phone number. Please sign up first.");
        setLoading(false);
        return;
      }

      setStoredUser({
        id: user.uid,
        phone: user.phoneNumber ?? getFullPhoneNumber(),
        user_metadata: {
          ...(user.displayName ? { full_name: user.displayName } : {}),
        },
      });

      setSuccessMessage("Phone verified! Redirecting...");
      setTimeout(() => navigate({ to: "/" }), 800);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "OTP verification failed.";
      if (msg.includes("invalid-verification-code") || msg.includes("code-expired")) {
        setErrorMessage("Invalid or expired OTP. Please check the code and try again.");
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
      setSuccessMessage("New OTP sent successfully.");
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
      const msg = err instanceof Error ? err.message : "Failed to resend OTP.";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background flex relative">
      {/* Invisible reCAPTCHA container — ID must match what RecaptchaVerifier uses */}
      <div id="recaptcha-login" suppressHydrationWarning />

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

          {/* Security note */}
          <div className="mt-10 flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 p-3.5">
            <Shield className="size-5 text-emerald-400 shrink-0" />
            <p className="text-xs text-white/60 leading-relaxed">
              Phone verification powered by <strong className="text-white/80">Firebase OTP</strong>. Your number is never stored or shared.
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
          {step === "phone" ? (
            <>
              <h1 className="text-3xl font-extrabold text-foreground">
                Welcome back
              </h1>
              <p className="mt-2 text-muted-foreground text-sm">
                Enter your phone number — we'll send you a one-time verification code
              </p>

              {/* Feedback messages */}
              {errorMessage && (
                <div className="mt-4 rounded-xl border border-danger/30 bg-danger/10 p-3.5 flex items-start gap-2.5 text-danger text-sm animate-fade-in">
                  <AlertCircle className="size-4.5 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSendOtp} className="mt-6 space-y-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="phone-input"
                    className="text-xs font-bold text-foreground uppercase tracking-wider"
                  >
                    Phone Number
                  </label>
                  <div className="flex gap-2">
                    {/* Country code selector */}
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

                    {/* Phone number */}
                    <div className="relative flex-1">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                      <Input
                        id="phone-input"
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
                      Sending OTP...
                    </span>
                  ) : (
                    <>
                      Send OTP
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
                  setStep("phone");
                  setOtp(["", "", "", "", "", ""]);
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className="mb-5 flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft className="size-4" />
                Change number
              </button>

              <h1 className="text-3xl font-extrabold text-foreground">
                Enter OTP
              </h1>
              <p className="mt-2 text-muted-foreground text-sm">
                We sent a 6-digit code to{" "}
                <strong className="text-foreground font-semibold">
                  {getFullPhoneNumber()}
                </strong>
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

              <form onSubmit={handleVerifyOtp} className="mt-6 space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                    6-Digit Code
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
                        aria-label={`OTP digit ${idx + 1}`}
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
                      Verify & Log in
                      <ArrowRight className="ml-2 size-4" />
                    </>
                  )}
                </Button>

                {/* Resend OTP */}
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
                        Resend OTP
                      </button>
                    )}
                  </p>
                </div>
              </form>
            </>
          )}



          <p className="mt-6 text-center text-xs text-muted-foreground">
            New to METRO RANK?{" "}
            <Link
              to="/signup"
              className="font-bold text-accent hover:underline"
            >
              Create a free account
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
