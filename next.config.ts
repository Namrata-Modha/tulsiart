import type { NextConfig } from "next";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

// In a git worktree the project root differs from the repo root.
// Load the repo root's .env.local when there's no local copy.
const localEnv = resolve(process.cwd(), ".env.local");
const repoRootEnv = resolve(process.cwd(), "../../../.env.local");
if (!existsSync(localEnv) && existsSync(repoRootEnv)) {
  readFileSync(repoRootEnv, "utf8")
    .split("\n")
    .forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return;
      const eq = trimmed.indexOf("=");
      if (eq === -1) return;
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
      if (!(key in process.env)) process.env[key] = val;
    });
}

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // allow multi-image uploads (compressed ~400 KB each)
    },
  },
};

export default nextConfig;
