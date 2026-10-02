// @ts-nocheck
import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

// Helper to create a service role client for server functions
function serviceClient() {
  const url = process.env["SUPABASE_URL"]!;
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"] || process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  
  return createClient<Database>(url, key, {
    auth: { persistSession: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
          h.delete("Authorization");
        }
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

// Admin Phones
export const addAdminPhone = createServerFn({ method: "POST" })
  .inputValidator((input: { phone: string }) => ({
    phone: String(input.phone).replace(/\D/g, "").slice(-10),
  }))
  .handler(async ({ data }) => {
    const supabase = serviceClient();
    
    const { data: currentData } = await supabase
      .from("app_settings" as any)
      .select("setting_value")
      .eq("setting_key", "admin_phones")
      .single();
      
    let phones: string[] = [];
    if (currentData?.setting_value) {
      const parsed = typeof currentData.setting_value === "string" 
        ? JSON.parse(currentData.setting_value) 
        : currentData.setting_value;
      if (Array.isArray(parsed)) phones = parsed;
    }
    
    if (!phones.includes(data.phone)) {
      phones.push(data.phone);
    }
    
    const { error } = await supabase
      .from("app_settings" as any)
      .update({ setting_value: phones as any })
      .eq("setting_key", "admin_phones");
      
    if (error) throw new Error("Failed to add admin phone: " + error.message);
    return { success: true, phones };
  });

export const removeAdminPhone = createServerFn({ method: "POST" })
  .inputValidator((input: { phone: string }) => ({
    phone: String(input.phone).replace(/\D/g, "").slice(-10),
  }))
  .handler(async ({ data }) => {
    const supabase = serviceClient();
    
    const { data: currentData } = await supabase
      .from("app_settings" as any)
      .select("setting_value")
      .eq("setting_key", "admin_phones")
      .single();
      
    let phones: string[] = [];
    if (currentData?.setting_value) {
      const parsed = typeof currentData.setting_value === "string" 
        ? JSON.parse(currentData.setting_value) 
        : currentData.setting_value;
      if (Array.isArray(parsed)) phones = parsed;
    }
    
    phones = phones.filter(p => p !== data.phone);
    
    const { error } = await supabase
      .from("app_settings" as any)
      .update({ setting_value: phones as any })
      .eq("setting_key", "admin_phones");
      
    if (error) throw new Error("Failed to remove admin phone: " + error.message);
    return { success: true, phones };
  });

// Platform Settings
export const getPlatformSettingsServer = createServerFn({ method: "GET" })
  .handler(async () => {
    const supabase = serviceClient();
    const { data } = await supabase
      .from("app_settings" as any)
      .select("setting_value")
      .eq("setting_key", "platform_settings")
      .single();
    
    if (data?.setting_value) {
      return typeof data.setting_value === "string" ? JSON.parse(data.setting_value) : data.setting_value;
    }
    return null;
  });

export const updatePlatformSettingsServer = createServerFn({ method: "POST" })
  .inputValidator((input: any) => input)
  .handler(async ({ data }) => {
    const supabase = serviceClient();
    
    // UPSERT style logic
    const { data: currentData } = await supabase
      .from("app_settings" as any)
      .select("setting_value")
      .eq("setting_key", "platform_settings")
      .maybeSingle();
      
    if (!currentData) {
      await supabase.from("app_settings" as any).insert({ setting_key: "platform_settings", setting_value: data as any });
    } else {
      await supabase.from("app_settings" as any).update({ setting_value: data as any }).eq("setting_key", "platform_settings");
    }
    return { success: true };
  });

export const getAdminPhonesServer = createServerFn({ method: "GET" })
  .handler(async () => {
    const supabase = serviceClient();
    const { data } = await supabase
      .from("app_settings" as any)
      .select("setting_value")
      .eq("setting_key", "admin_phones")
      .maybeSingle();
      
    if (data?.setting_value) {
      const parsed = typeof data.setting_value === "string" ? JSON.parse(data.setting_value) : data.setting_value;
      if (Array.isArray(parsed)) return parsed as string[];
    }
    return [] as string[];
  });

