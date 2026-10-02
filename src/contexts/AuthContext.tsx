// @ts-nocheck
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isDeveloper: boolean;
  isAdmin: boolean;
  adminPhones: string[];
  checkAccess: (phone: string) => boolean;
  platformSettings: any;
  setPlatformSettings: (settings: any) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isDeveloper: false,
  isAdmin: false,
  adminPhones: [],
  checkAccess: () => false,
  platformSettings: {
    platformAds: false,
    counselingWidget: true,
    maintenanceMode: false,
    aiAdviser: true,
    strictCutoffs: false,
  },
  setPlatformSettings: () => {},
});

const DEVELOPER_PHONES = (import.meta.env.VITE_DEVELOPER_PHONES || "")
  .split(",")
  .map((p) => p.trim());
const IS_LOCALHOST = 
  typeof window !== "undefined" 
    ? (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") 
    : false;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminPhones, setAdminPhones] = useState<string[]>([]);
  const [platformSettings, setPlatformSettings] = useState<any>({
    platformAds: false,
    counselingWidget: true,
    maintenanceMode: false,
    aiAdviser: true,
    strictCutoffs: false,
  });

  useEffect(() => {
    // 1. Listen to Firebase Auth
    let unsubscribe = () => {};
    if (auth) {
      unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }

    // 2. Fetch initial settings from Supabase
    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from("app_settings")
        .select("setting_key, setting_value")
        .in("setting_key", ["admin_phones", "platform_settings"]);
      
      if (!error && data) {
        data.forEach(row => {
          try {
            const parsed = typeof row.setting_value === "string" 
              ? JSON.parse(row.setting_value) 
              : row.setting_value;
              
            if (row.setting_key === "admin_phones" && Array.isArray(parsed)) {
              setAdminPhones(parsed);
            } else if (row.setting_key === "platform_settings" && parsed) {
              setPlatformSettings(parsed);
            }
          } catch (e) {
            console.error("Failed to parse setting:", row.setting_key, e);
          }
        });
      }
    };

    fetchSettings();

    // 3. Listen for Realtime updates
    const channel = supabase
      .channel("app_settings_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "app_settings",
        },
        (payload) => {
          if (payload.new && "setting_key" in payload.new && "setting_value" in payload.new) {
            const val = payload.new.setting_value;
            const parsed = typeof val === "string" ? JSON.parse(val) : val;
            
            if (payload.new.setting_key === "admin_phones" && Array.isArray(parsed)) {
              setAdminPhones(parsed);
            } else if (payload.new.setting_key === "platform_settings" && parsed) {
              setPlatformSettings(parsed);
            }
          }
        }
      )
      .subscribe();

    return () => {
      unsubscribe();
      supabase.removeChannel(channel);
    };
  }, []);

  const normalizedCurrent = user?.phoneNumber?.replace(/\D/g, "").slice(-10) || "";

  const isDeveloper = IS_LOCALHOST || DEVELOPER_PHONES.some(
    (p) => p.replace(/\D/g, "").slice(-10) === normalizedCurrent && normalizedCurrent !== ""
  );

  const isAdmin = isDeveloper || adminPhones.some(
    (p) => p.replace(/\D/g, "").slice(-10) === normalizedCurrent && normalizedCurrent !== ""
  );

  const checkAccess = (phone: string) => {
    if (IS_LOCALHOST) return true;
    const normalized = phone.replace(/\D/g, "").slice(-10);
    if (!normalized) return false;
    
    const devMatch = DEVELOPER_PHONES.some(
      (p) => p.replace(/\D/g, "").slice(-10) === normalized
    );
    const adminMatch = adminPhones.some(
      (p) => p.replace(/\D/g, "").slice(-10) === normalized
    );
    
    return devMatch || adminMatch;
  };

  return (
    <AuthContext.Provider value={{ user, loading, isDeveloper, isAdmin, adminPhones, checkAccess, platformSettings, setPlatformSettings }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

