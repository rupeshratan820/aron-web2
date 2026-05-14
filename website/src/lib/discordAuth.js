const DISCORD_API = "https://discord.com/api";
const SESSION_KEY = "aron.discordSession";
const OAUTH_STATE_KEY = "aron.discordOAuthState";

function getRedirectUri() {
  return import.meta.env.VITE_DISCORD_REDIRECT_URI || `${window.location.origin}${window.location.pathname}`;
}

function randomState() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function avatarUrl(user) {
  if (user?.avatar) {
    return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`;
  }
  const index = Number(user?.discriminator || 0) % 5;
  return `https://cdn.discordapp.com/embed/avatars/${index}.png`;
}

function normalizeUser(user) {
  return {
    discordId: String(user?.id || ""),
    username: user?.global_name || user?.username || "Aron Player",
    avatar: avatarUrl(user),
    raw: user
  };
}

function currentRoute() {
  const hash = window.location.hash || "#/";
  if (hash.startsWith("#access_token") || hash.startsWith("#error")) return "/";
  return hash.slice(1) || "/";
}

function restoreRoute(route = "/") {
  const target = route.startsWith("/") ? route : "/";
  window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#${target}`);
}

function parseOAuthHash() {
  const hash = window.location.hash.replace(/^#/, "");
  if (!hash.includes("access_token") && !hash.includes("error")) return null;
  return Object.fromEntries(new URLSearchParams(hash));
}

export function getStoredDiscordSession() {
  try {
    const session = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
    if (!session?.accessToken || !session?.user?.discordId) return null;
    if (session.expiresAt && session.expiresAt <= Date.now()) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function startDiscordLogin() {
  const clientId = import.meta.env.VITE_DISCORD_CLIENT_ID;
  if (!clientId) throw new Error("Discord OAuth client ID is not configured.");

  const state = randomState();
  sessionStorage.setItem(OAUTH_STATE_KEY, JSON.stringify({ state, returnTo: currentRoute() }));

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getRedirectUri(),
    response_type: "token",
    scope: "identify",
    state
  });

  window.location.assign(`https://discord.com/oauth2/authorize?${params.toString()}`);
}

export async function fetchDiscordUser(accessToken, tokenType = "Bearer") {
  const response = await fetch(`${DISCORD_API}/users/@me`, {
    headers: { Authorization: `${tokenType} ${accessToken}` }
  });
  if (!response.ok) throw new Error("Discord login succeeded, but fetching your profile failed.");
  return normalizeUser(await response.json());
}

export async function finishDiscordLogin() {
  const callback = parseOAuthHash();
  if (!callback) return getStoredDiscordSession();

  const storedState = JSON.parse(sessionStorage.getItem(OAUTH_STATE_KEY) || "{}");
  sessionStorage.removeItem(OAUTH_STATE_KEY);
  const returnTo = storedState.returnTo || "/";

  if (callback.error) {
    restoreRoute(returnTo);
    throw new Error(callback.error_description || callback.error || "Discord login was cancelled.");
  }

  if (!callback.access_token) {
    restoreRoute(returnTo);
    throw new Error("Discord did not return an access token.");
  }

  if (!storedState.state || callback.state !== storedState.state) {
    restoreRoute(returnTo);
    throw new Error("Discord login state did not match. Please try again.");
  }

  const user = await fetchDiscordUser(callback.access_token, callback.token_type || "Bearer");
  const session = {
    accessToken: callback.access_token,
    tokenType: callback.token_type || "Bearer",
    expiresAt: Date.now() + Number(callback.expires_in || 0) * 1000,
    user
  };

  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  restoreRoute(returnTo);
  return session;
}

export function clearDiscordSession() {
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(OAUTH_STATE_KEY);
}
