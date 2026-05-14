import { create } from "zustand";
import { syncWebUser } from "../lib/data.js";
import { useEffect } from "react";
import { clearDiscordSession, finishDiscordLogin, getStoredDiscordSession, startDiscordLogin } from "../lib/discordAuth.js";

export const useAuthStore = create((set, get) => ({
  user: null,
  identity: null,
  loading: true,
  error: "",
  login: () => {
    try {
      set({ error: "" });
      startDiscordLogin();
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },
  logout: () => {
    clearDiscordSession();
    set({ user: null, identity: null, error: "", loading: false });
  },
  setSession: async (session) => {
    const identity = session?.user || null;
    set({ user: session, identity, loading: false });
    if (session && identity?.discordId) {
      await syncWebUser(identity).catch((error) => set({ error: error.message }));
    }
  },
  setError: (error) => set({ error, loading: false }),
  getDiscordId: () => get().identity?.discordId || ""
}));

let bootstrapped = false;

export function useAuthBootstrap() {
  const setSession = useAuthStore((state) => state.setSession);
  const setError = useAuthStore((state) => state.setError);
  useEffect(() => {
    if (bootstrapped) return undefined;
    bootstrapped = true;
    finishDiscordLogin()
      .then((session) => setSession(session || getStoredDiscordSession()))
      .catch((error) => setError(error.message));
  }, [setSession, setError]);
}
