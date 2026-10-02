// Developer credentials loaded dynamically and strictly from .env
export function getDeveloperPhones(): string[] {
  const p1 = (
    import.meta.env.VITE_DEV_PHONE_1 ||
    (typeof process !== "undefined" ? process.env?.VITE_DEV_PHONE_1 : "") ||
    ""
  ).trim();
  const p2 = (
    import.meta.env.VITE_DEV_PHONE_2 ||
    (typeof process !== "undefined" ? process.env?.VITE_DEV_PHONE_2 : "") ||
    ""
  ).trim();
  return [p1, p2].filter((p) => Boolean(p && p.length > 0));
}

const ADMIN_STORAGE_KEY = "metro_admin_phones";
const SETTINGS_STORAGE_KEY = "metro_platform_settings";
const DEV_SESSION_KEY = "metro_dev_unlocked_session";
const ADMIN_SESSION_KEY = "metro_admin_unlocked_session";

export interface PlatformSettings {
  platformAds: boolean;
  counselingWidget: boolean;
  maintenanceMode: boolean;
  aiAdviser: boolean;
  strictCutoffs: boolean;
}

export const DEFAULT_SETTINGS: PlatformSettings = {
  platformAds: false,
  counselingWidget: true,
  maintenanceMode: false,
  aiAdviser: true,
  strictCutoffs: false,
};

// Flexible phone format comparator: matches digits regardless of "+", spaces, dashes or country code prefix
export function getPhoneDigits(phone: string): string {
  return phone.trim().replace(/\D/g, "");
}

export function phonesMatch(phoneA: string, phoneB: string): boolean {
  const a = getPhoneDigits(phoneA);
  const b = getPhoneDigits(phoneB);
  if (!a || !b) return false;
  if (a === b) return true;
  // Match if one ends with the other (e.g. 10-digit national number vs country code prefix)
  if (a.length >= 10 && b.length >= 10) {
    return a.slice(-10) === b.slice(-10);
  }
  return false;
}

// Check if phone matches one of the strictly configured developer phone numbers
export function isAuthorizedDeveloperPhone(phone: string): boolean {
  if (!phone) return false;
  const devPhones = getDeveloperPhones();
  if (devPhones.length === 0) return false;
  return devPhones.some((devPhone) => phonesMatch(devPhone, phone));
}

// Unlock Developer Portal after successful OTP verification
export function unlockDeveloperSession(phone: string): void {
  if (typeof window !== "undefined") {
    sessionStorage.setItem(DEV_SESSION_KEY, "true");
    sessionStorage.setItem("metro_dev_active_phone", phone.trim());
  }
}

export function isDeveloperUnlocked(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(DEV_SESSION_KEY) === "true";
}

export function lockDeveloperSession(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(DEV_SESSION_KEY);
  sessionStorage.removeItem("metro_dev_active_phone");
}

// Admin Access Verification (Managed exclusively via Developer Portal)
export function getAdminPhones(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ADMIN_STORAGE_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as string[];
    // Automatically filter out any legacy dummy demo numbers
    const legacyDummies = ["9779876543210", "919845026920"];
    const filtered = list.filter((p) => !legacyDummies.includes(p.replace(/\D/g, "")));
    if (filtered.length !== list.length) {
      localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(filtered));
    }
    return filtered;
  } catch {
    return [];
  }
}

export function normalizePhone(phone: string): string {
  return phone.trim().replace(/\D/g, "");
}

export function addAdminPhone(phone: string): string[] {
  const clean = phone.trim();
  if (!clean) return getAdminPhones();
  const current = getAdminPhones();
  if (current.some((p) => phonesMatch(p, clean))) return current;
  const updated = [clean, ...current];
  if (typeof window !== "undefined") {
    localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(updated));
  }
  return updated;
}

export function removeAdminPhone(phone: string): string[] {
  const current = getAdminPhones();
  const updated = current.filter((p) => !phonesMatch(p, phone));
  if (typeof window !== "undefined") {
    localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(updated));
  }
  return updated;
}

export function isPhoneGrantedAdmin(phone: string | undefined | null): boolean {
  if (!phone) return false;
  return getAdminPhones().some((admin) => phonesMatch(admin, phone));
}

export function verifyAdminAccess(phone: string): { success: boolean; error?: string } {
  // If active developer session is open, permit instant access
  if (isDeveloperUnlocked()) {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
    }
    return { success: true };
  }

  const granted = getAdminPhones().some((p) => phonesMatch(p, phone));
  if (!granted) {
    return {
      success: false,
      error: "Access Denied: This phone number has not been granted admin access in the Developer Dashboard.",
    };
  }
  if (typeof window !== "undefined") {
    sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
    sessionStorage.setItem("metro_admin_active_phone", phone.trim());
  }
  return { success: true };
}

export function isAdminUnlocked(): boolean {
  if (typeof window === "undefined") return false;
  if (isDeveloperUnlocked()) return true;
  return sessionStorage.getItem(ADMIN_SESSION_KEY) === "true";
}

export function lockAdminSession(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
  sessionStorage.removeItem("metro_admin_active_phone");
}

// Platform Settings (Ads, Widget, Maintenance)
export function getPlatformSettings(): PlatformSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function updatePlatformSettings(settings: Partial<PlatformSettings>): PlatformSettings {
  const current = getPlatformSettings();
  const updated = { ...current, ...settings };
  if (typeof window !== "undefined") {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
  }
  return updated;
}
