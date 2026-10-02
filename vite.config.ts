// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import fs from "node:fs";

function loadLocalEnv() {
  const env: Record<string, string> = {};
  try {
    const content = fs.readFileSync(".env", "utf-8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx > 0) {
        const key = trimmed.slice(0, idx).trim();
        let val = trimmed.slice(idx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        env[key] = val;
      }
    }
  } catch {}
  return env;
}

const localEnv = loadLocalEnv();

export default defineConfig({
  vite: {
    define: {
      "import.meta.env.VITE_DEV_PHONE_1": JSON.stringify(localEnv["VITE_DEV_PHONE_1"] || ""),
      "import.meta.env.VITE_DEV_PHONE_2": JSON.stringify(localEnv["VITE_DEV_PHONE_2"] || ""),
    },
  },
  nitro: {
    preset: "cloudflare-pages",
  },
  tanstackStart: {
    server: { entry: "server" },
  },
});

