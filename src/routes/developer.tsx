import { useState, useEffect, useRef } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Users,
  UserPlus,
  Trash2,
  CheckCircle2,
  Lock,
  Unlock,
  Shield,
  AlertTriangle,
  ArrowRight,
  LogOut,
  Phone,
  RefreshCw,
  ChevronLeft,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { getCurrentUser } from "@/lib/auth";
import { firebaseAuth } from "@/lib/firebase";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from "firebase/auth";
import {
  isAuthorizedDeveloperPhone,
  unlockDeveloperSession,
  isDeveloperUnlocked,
  lockDeveloperSession,
  type PlatformSettings,
} from "@/lib/admin-access";
import { useAuth } from "@/contexts/AuthContext";
import { 
  updatePlatformSettingsServer,
  getAdminPhonesServer,
  addAdminPhone,
  removeAdminPhone
} from "@/lib/admin.functions";

export const Route = createFileRoute("/developer")({
  head: () => ({
    meta: [
      { title: "Developer Dashboard — METRO RANK Nepal CEE" },
      {
        name: "description",
        content: "Platform configuration, admin access management, and developer settings.",
      },
    ],
  }),
  component: DeveloperDashboard,
});

const COUNTRY_CODES = [
  { code: "+91", flag: "🇮🇳", name: "India" },
  { code: "+977", flag: "🇳🇵", name: "Nepal" },
  { code: "+1", flag: "🇺🇸", name: "USA" },
];

function DeveloperDashboard() {
  const navigate = useNavigate();
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  const confirmationRef = useRef<ConfirmationResult | null>(null);

  // Authentication state for developer portal
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => isDeveloperUnlocked());
  const [authStep, setAuthStep] = useState<"phone" | "otp">("phone");
  const [countryCode, setCountryCode] = useState("+91");
  const [phoneInput, setPhoneInput] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const { platformSettings: settings, setPlatformSettings } = useAuth();

  // Access Management (Admin Phone Numbers) matching Screenshot 2
  const [adminPhones, setAdminPhones] = useState<string[]>([]);
  const [newAdminPhone, setNewAdminPhone] = useState("");
  const [addPhoneError, setAddPhoneError] = useState<string | null>(null);
  const [phoneSuccessMsg, setPhoneSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    void getCurrentUser().then(async (u) => {
      if (!u) {
        void navigate({ to: "/login" });
      } else if (u.phone && isAuthorizedDeveloperPhone(u.phone)) {
        setIsUnlocked(isDeveloperUnlocked());
        const phones = await getAdminPhonesServer();
        setAdminPhones(phones);
      } else {
        void navigate({ to: "/" });
      }
    });
  }, [navigate]);

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Initialize Recaptcha for Developer Portal
  useEffect(() => {
    if (!firebaseAuth) return;
    if (recaptchaVerifierRef.current) return;
    const timer = setTimeout(() => {
      if (!firebaseAuth || recaptchaVerifierRef.current) return;
      try {
        recaptchaVerifierRef.current = new RecaptchaVerifier(
          firebaseAuth,
          "recaptcha-developer",
          { size: "invisible" }
        );
      } catch (e) {
        console.warn("Developer RecaptchaVerifier init error:", e);
      }
    }, 100);
    return () => {
      clearTimeout(timer);
      try { recaptchaVerifierRef.current?.clear(); } catch {}
      recaptchaVerifierRef.current = null;
    };
  }, []);

  const getFullPhone = () => `${countryCode}${phoneInput.trim().replace(/\D/g, "")}`;

  // Step 1: Send OTP strictly to authorized developer numbers only
  const handleSendDeveloperOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);

    const full = getFullPhone();
    const cleanDigits = full.replace(/\D/g, "");
    if (cleanDigits.length < 8) {
      setAuthError("Please enter a valid phone number.");
      return;
    }

    // STRICT DEVELOPER GUARD: Normal users and admins are rejected immediately
    if (!isAuthorizedDeveloperPhone(full)) {
      setAuthError(
        "Access Denied: Restricted to authorized developer phone numbers only. Normal users and admins cannot access this portal."
      );
      return;
    }

    setLoading(true);
    try {
      if (!firebaseAuth) {
        throw new Error("Firebase Auth is not initialized. Please verify your Firebase environment variables.");
      }

      // Re-init verifier if cleared
      if (!recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current = new RecaptchaVerifier(
          firebaseAuth,
          "recaptcha-developer",
          { size: "invisible" }
        );
      }

      const confirmation = await signInWithPhoneNumber(
        firebaseAuth,
        full,
        recaptchaVerifierRef.current
      );
      confirmationRef.current = confirmation;
      setAuthStep("otp");
      setResendCooldown(60);
      setAuthSuccess(`Verification code sent to ${full}. Enter the 6-digit code below.`);
    } catch (err: unknown) {
      console.error("Developer OTP send error:", err);
      try {
        if (recaptchaVerifierRef.current) {
          recaptchaVerifierRef.current.render().then((widgetId) => {
            // @ts-expect-error grecaptcha global
            if (typeof window !== "undefined" && window.grecaptcha?.reset) {
              // @ts-expect-error grecaptcha global
              window.grecaptcha.reset(widgetId);
            }
          });
        }
      } catch {}

      const msg = err instanceof Error ? err.message : "Failed to send verification code.";
      if (msg.includes("region enabled") || msg.includes("operation-not-allowed")) {
        setAuthError(
          "Firebase SMS region not enabled. If using test phone numbers, configure them in Firebase Authentication > Phone > Phone numbers for testing."
        );
      } else {
        setAuthError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyDeveloperOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);

    const code = otp.join("");
    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
      setAuthError("Please enter the complete 6-digit OTP code.");
      return;
    }

    if (!confirmationRef.current) {
      setAuthError("Session expired. Please request a new verification code.");
      return;
    }

    setLoading(true);
    try {
      await confirmationRef.current.confirm(code);
      unlockDeveloperSession(getFullPhone());
      setIsUnlocked(true);
      setAuthSuccess("Developer verified successfully!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Verification failed.";
      if (msg.includes("invalid-verification-code") || msg.includes("code-expired")) {
        setAuthError("Invalid or expired OTP code. Please check and try again.");
      } else {
        setAuthError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[index] = val.slice(-1);
    setOtp(next);
    if (val && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleDeveloperLock = () => {
    lockDeveloperSession();
    setIsUnlocked(false);
    setAuthStep("phone");
    setOtp(["", "", "", "", "", ""]);
  };

  const handleToggle = async (key: keyof PlatformSettings) => {
    const updated = { ...settings, [key]: !settings[key] };
    
    // Optimistic UI Update
    setPlatformSettings(updated);
    
    try {
      await updatePlatformSettingsServer({ data: updated });
    } catch (e) {
      console.error(e);
      // Revert on failure
      setPlatformSettings(settings);
      alert("Failed to update settings. Please check your network or backend logs.");
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddPhoneError(null);
    setPhoneSuccessMsg(null);

    const clean = newAdminPhone.trim().replace(/\s+/g, "");
    if (!clean || clean.length < 8) {
      setAddPhoneError("Please enter a valid phone number with country code (e.g. +919876543210 or +9779876543210).");
      return;
    }

    if (adminPhones.includes(clean)) {
      setAddPhoneError("This phone number already has admin access.");
      return;
    }

    try {
      const res = await addAdminPhone({ data: { phone: clean } });
      setAdminPhones(res.phones);
      setPhoneSuccessMsg(`Admin access granted to ${clean}`);
      setNewAdminPhone("");
      setTimeout(() => setPhoneSuccessMsg(null), 3000);
    } catch (e: any) {
      setAddPhoneError(e.message || "Failed to add admin phone");
    }
  };

  const handleRemoveAdmin = async (phone: string) => {
    try {
      const res = await removeAdminPhone({ data: { phone } });
      setAdminPhones(res.phones);
    } catch (e) {}
  };

  // Locked Gate: Strictly requires 1 of the 2 developer phones + OTP
  if (!isUnlocked) {
    return (
      <main className="min-h-screen bg-[#f8fafc] dark:bg-background flex flex-col justify-center items-center px-4 relative">
        <div id="recaptcha-developer" />
        <div className="absolute top-6 right-6">
          <ThemeToggle />
        </div>

        <div className="w-full max-w-md animate-slide-up">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 mb-4">
              <div className="flex size-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-md">
                <Lock className="size-5" />
              </div>
              <span className="text-2xl font-extrabold tracking-tight text-foreground">
                METRO<span className="text-primary"> RANK</span>
              </span>
            </Link>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/10 dark:bg-white/10 text-slate-900 dark:text-white text-xs font-bold tracking-wide uppercase mb-2">
              <Shield className="size-3" />
              Developer Verification
            </div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">Developer Portal</h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Strictly restricted to designated engineering phone numbers.
            </p>
          </div>

          <div className="rounded-2xl border border-border/80 bg-card p-6 sm:p-8 shadow-xl">
            {authStep === "phone" ? (
              <form onSubmit={handleSendDeveloperOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Authorized Developer Phone Number
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="rounded-xl border border-input bg-background px-3 py-2.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-primary"
                    >
                      {COUNTRY_CODES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.flag} {c.code}
                        </option>
                      ))}
                    </select>
                    <div className="relative flex-1">
                      <input
                        type="tel"
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(e.target.value)}
                        placeholder="Enter phone number"
                        className="w-full rounded-xl border border-input bg-background px-4 py-2.5 pl-10 text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-primary"
                        required
                        autoFocus
                        autoComplete="off"
                      />
                      <Phone className="absolute left-3 top-3 size-4 text-muted-foreground" />
                    </div>
                  </div>
                  <p className="mt-1.5 text-[11px] text-muted-foreground">
                    Only authorized engineering phones configured in system environment can receive verification.
                  </p>
                </div>

                {authError && (
                  <div className="rounded-xl border border-danger/30 bg-danger/10 p-3 text-xs text-danger font-medium flex items-start gap-2">
                    <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                    <span>{authError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 dark:bg-primary hover:bg-slate-800 py-3 text-xs font-bold text-white shadow-md transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="size-4 animate-spin" />
                      Sending Verification Code...
                    </>
                  ) : (
                    <>
                      <Unlock className="size-4" />
                      Send Developer OTP
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyDeveloperOtp} className="space-y-5">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-foreground">
                      Enter 6-Digit OTP Code
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthStep("phone");
                        setAuthError(null);
                        setAuthSuccess(null);
                      }}
                      className="text-[11px] text-primary hover:underline flex items-center gap-0.5"
                    >
                      <ChevronLeft className="size-3" /> Change Phone
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3 font-mono">
                    Sent to: {getFullPhone()}
                  </p>

                  <div className="flex justify-between gap-2">
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
                        className="size-11 rounded-xl border border-input bg-background text-center font-mono text-base font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-primary shadow-xs"
                        autoFocus={idx === 0}
                      />
                    ))}
                  </div>
                </div>

                {authSuccess && (
                  <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="size-3.5" />
                    {authSuccess}
                  </p>
                )}

                {authError && (
                  <div className="rounded-xl border border-danger/30 bg-danger/10 p-3 text-xs text-danger font-medium flex items-start gap-2">
                    <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                    <span>{authError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 dark:bg-primary hover:bg-slate-800 py-3 text-xs font-bold text-white shadow-md transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="size-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <Unlock className="size-4" />
                      Verify & Unlock Developer Console
                    </>
                  )}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    disabled={resendCooldown > 0 || loading}
                    onClick={handleSendDeveloperOtp}
                    className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-40"
                  >
                    {resendCooldown > 0
                      ? `Resend code in ${resendCooldown}s`
                      : "Didn't receive code? Resend OTP"}
                  </button>
                </div>
              </form>
            )}

            <div className="mt-6 pt-5 border-t border-border/60 text-center">
              <Link to="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                ← Return to METRO RANK Home
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Authenticated Developer Portal matching Screenshot 2
  return (
    <main className="min-h-screen bg-[#f8fafc] dark:bg-background pb-16">
      {/* Top Header matching Screenshot 2 */}
      <header className="border-b border-border/60 bg-card/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="size-4" />
              Back to Home
            </Link>
            <div className="h-4 w-px bg-border/80" />
            <div>
              <h1 className="text-base font-extrabold text-foreground tracking-tight flex items-center gap-2">
                Developer Dashboard
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold">
                  Engineering
                </span>
              </h1>
              <p className="text-[11px] text-muted-foreground hidden sm:block">
                Platform feature toggles, admin access rights, and system settings
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/admin"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline bg-primary/10 px-3 py-1.5 rounded-lg transition-colors"
            >
              Open Admin Dashboard →
            </Link>
            <ThemeToggle />
            <button
              onClick={handleDeveloperLock}
              className="inline-flex items-center gap-1 rounded-lg border border-border/70 bg-card hover:bg-muted p-2 text-xs font-medium text-foreground transition-colors"
              title="Lock developer session"
            >
              <LogOut className="size-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fade-in">
        {/* Section 1: Platform Feature Toggles matching EXACT Screenshot 2 */}
        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-border/40">
            <div>
              <h2 className="text-base font-bold text-foreground">Platform Ads</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Enable AdSense or other advertisements across the platform.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.platformAds}
                onChange={() => handleToggle("platformAds")}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0f172a] dark:peer-checked:bg-primary"></div>
            </label>
          </div>

          <div className="flex items-center justify-between pb-4 border-b border-border/40">
            <div>
              <h2 className="text-base font-bold text-foreground">Counseling Floating Widget</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Display floating WhatsApp & counseling inquiry button on student prediction pages.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.counselingWidget}
                onChange={() => handleToggle("counselingWidget")}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0f172a] dark:peer-checked:bg-primary"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-foreground">Maintenance Mode</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Put predictor in read-only maintenance mode during MEC official list releases.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={() => handleToggle("maintenanceMode")}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0f172a] dark:peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>

        {/* Section 2: Access Management matching EXACT Screenshot 2 */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Users className="size-5 text-foreground" />
            <h2 className="text-lg font-black text-foreground tracking-tight">
              Access Management
            </h2>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-xs space-y-6">
            {/* Grant Admin Access */}
            <div>
              <h3 className="text-base font-bold text-foreground">Grant Admin Access</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Add phone numbers to grant them access to the Admin Analytics Dashboard. Normal users cannot access without being added here.
              </p>

              <form onSubmit={handleAddAdmin} className="mt-4 flex gap-3">
                <input
                  type="text"
                  value={newAdminPhone}
                  onChange={(e) => setNewAdminPhone(e.target.value)}
                  placeholder="+919876543210 or +9779876543210"
                  className="flex-1 rounded-xl border border-input bg-[#f8fafc] dark:bg-background px-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#0f172a] dark:bg-primary hover:bg-[#1e293b] px-5 py-2.5 text-xs font-bold text-white shadow-xs transition-colors"
                >
                  <UserPlus className="size-3.5" />
                  Add
                </button>
              </form>

              {addPhoneError && (
                <p className="mt-2 text-xs font-medium text-danger">{addPhoneError}</p>
              )}
              {phoneSuccessMsg && (
                <p className="mt-2 text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="size-3.5" />
                  {phoneSuccessMsg}
                </p>
              )}
            </div>

            {/* Current Admins List matching Screenshot 2 */}
            <div>
              <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-3">
                CURRENT ADMINS
              </h4>

              <div className="space-y-2.5">
                {adminPhones.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border/70 p-4 text-center">
                    <p className="text-xs text-muted-foreground">
                      No admin phone numbers added yet. Add a phone number above to grant access.
                    </p>
                  </div>
                ) : (
                  adminPhones.map((phone) => (
                    <div
                      key={phone}
                      className="flex items-center justify-between rounded-xl bg-[#f8fafc] dark:bg-background border border-border/50 px-4 py-3"
                    >
                      <span className="font-mono text-xs font-semibold text-foreground">
                        {phone}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAdmin(phone)}
                        className="text-red-400 hover:text-red-600 transition-colors p-1"
                        title="Remove admin access"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
