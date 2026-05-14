import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

function normalizeBasePath(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";
  if (trimmed === "/") return "/";
  return `/${trimmed.replace(/^\/+|\/+$/g, "")}/`;
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const repositoryName = env.GITHUB_REPOSITORY?.split("/")[1] || "";
  const explicitBase = normalizeBasePath(env.VITE_BASE_PATH);
  const githubPagesBase = env.GITHUB_ACTIONS && repositoryName ? `/${repositoryName}/` : "";
  const base = explicitBase || githubPagesBase || "/";

  return {
    base,
    plugins: [react()],
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            firebase: ["firebase/app", "firebase/database"],
            motion: ["framer-motion"],
            react: ["react", "react-dom", "react-router-dom"]
          }
        }
      }
    }
  };
});
