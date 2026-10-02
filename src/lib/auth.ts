import { supabase } from "@/integrations/supabase/client";
import { firebaseAuth } from "@/lib/firebase";

export interface MetroUser {
  id: string;
  phone: string;
  email?: string;
  user_metadata: {
    full_name?: string;
  };
}

const STORAGE_KEY = "metro_user_profile";
const AUTH_EVENT = "metro-auth-change";

export function getStoredUser(): MetroUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as MetroUser;
  } catch {
    return null;
  }
}

export function setStoredUser(user: MetroUser | null) {
  if (typeof window === "undefined") return;
  try {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch (e) {
    console.warn("Failed to persist user to localStorage", e);
  }
  window.dispatchEvent(new Event(AUTH_EVENT));
}

export async function getCurrentUser(): Promise<MetroUser | null> {
  // 1. Check Firebase phone auth session (client-only)
  if (firebaseAuth) {
    const fbUser = firebaseAuth.currentUser;
    if (fbUser) {
      const stored = getStoredUser();
      const fullName = fbUser.displayName ?? stored?.user_metadata?.full_name ?? (fbUser.phoneNumber ?? undefined);
      return {
        id: fbUser.uid,
        phone: fbUser.phoneNumber ?? stored?.phone ?? "",
        user_metadata: {
          ...(fullName ? { full_name: fullName } : {}),
        },
      };
    }
  }

  // 2. Check Supabase session (legacy / fallback)
  try {
    const { data } = await supabase.auth.getSession();
    if (data.session?.user) {
      const sbFullName =
        (data.session.user.user_metadata?.["full_name"] as string | undefined) ||
        data.session.user.phone ||
        data.session.user.email?.split("@")[0];
      const sbEmail = data.session.user.email;
      return {
        id: data.session.user.id,
        phone: data.session.user.phone ?? data.session.user.email ?? "",
        ...(sbEmail ? { email: sbEmail } : {}),
        user_metadata: {
          ...(sbFullName ? { full_name: sbFullName } : {}),
        },
      };
    }
  } catch (e) {
    console.warn("Supabase session check fallback", e);
  }

  // 3. Local storage fallback
  return getStoredUser();
}

export async function signOutUser() {
  if (firebaseAuth) {
    try {
      await firebaseAuth.signOut();
    } catch (e) {
      console.warn("Firebase signOut error", e);
    }
  }
  try {
    await supabase.auth.signOut();
  } catch (e) {
    console.warn("Supabase signOut error", e);
  }
  
  if (typeof window !== "undefined") {
    sessionStorage.removeItem("metro_admin_unlocked_session");
    sessionStorage.removeItem("metro_admin_active_phone");
    sessionStorage.removeItem("metro_dev_unlocked_session");
    sessionStorage.removeItem("metro_dev_active_phone");
  }
  
  setStoredUser(null);
}

export function subscribeToAuth(callback: (user: MetroUser | null) => void) {
  // Server-side: immediately return no-op
  if (typeof window === "undefined") {
    return () => {};
  }

  // 1. Listen to Firebase auth state changes (primary — phone OTP, client-only)
  let fbUnsub: (() => void) | null = null;
  if (firebaseAuth) {
    import("firebase/auth")
      .then(({ onAuthStateChanged }) => {
        if (!firebaseAuth) return;
        fbUnsub = onAuthStateChanged(firebaseAuth, (fbUser) => {
          if (fbUser) {
            const stored = getStoredUser();
            const fullName = fbUser.displayName ?? stored?.user_metadata?.full_name ?? (fbUser.phoneNumber ?? undefined);
            callback({
              id: fbUser.uid,
              phone: fbUser.phoneNumber ?? stored?.phone ?? "",
              user_metadata: {
                ...(fullName ? { full_name: fullName } : {}),
              },
            });
          } else {
            // Fallback to Supabase / local
            void getCurrentUser().then(callback);
          }
        });
      })
      .catch(() => {
        void getCurrentUser().then(callback);
      });
  } else {
    void getCurrentUser().then(callback);
  }

  // 2. Listen to Supabase auth state changes (legacy fallback)
  const {
    data: { subscription: sbSubscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.user && !firebaseAuth?.currentUser) {
      const sbFullName =
        (session.user.user_metadata?.["full_name"] as string | undefined) ||
        session.user.phone ||
        session.user.email?.split("@")[0];
      const sbEmail = session.user.email;
      callback({
        id: session.user.id,
        phone: session.user.phone ?? session.user.email ?? "",
        ...(sbEmail ? { email: sbEmail } : {}),
        user_metadata: {
          ...(sbFullName ? { full_name: sbFullName } : {}),
        },
      });
    }
  });

  // 3. Listen to custom local auth change events and cross-tab storage
  const handleLocalChange = () => {
    void getCurrentUser().then(callback);
  };
  window.addEventListener(AUTH_EVENT, handleLocalChange);
  window.addEventListener("storage", handleLocalChange);

  return () => {
    fbUnsub?.();
    sbSubscription.unsubscribe();
    window.removeEventListener(AUTH_EVENT, handleLocalChange);
    window.removeEventListener(AUTH_EVENT, handleLocalChange);
    window.removeEventListener("storage", handleLocalChange);
  };
}
