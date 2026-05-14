import {
  getRedirectResult,
  OAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut
} from "firebase/auth";
import { auth } from "./firebase.js";

const RETURN_ROUTE_KEY = "aron.firebaseAuthReturnTo";
const DISCORD_PROVIDER_ID = "oidc.discord";

function currentRoute() {
  const hash = window.location.hash || "#/";
  return hash.startsWith("#/") ? hash.slice(1) || "/" : "/";
}

function restoreRoute(route = "/") {
  const target = route.startsWith("/") ? route : "/";
  window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#${target}`);
}

function avatarUrl(firebaseUser, providerProfile) {
  if (firebaseUser?.photoURL) return firebaseUser.photoURL;
  if (providerProfile?.photoURL) return providerProfile.photoURL;
  return "";
}

function providerProfile(firebaseUser) {
  return firebaseUser?.providerData?.find((profile) => profile.providerId === DISCORD_PROVIDER_ID)
    || firebaseUser?.providerData?.[0]
    || null;
}

function normalizeFirebaseUser(firebaseUser) {
  if (!firebaseUser) return null;

  const profile = providerProfile(firebaseUser);
  const discordId = String(profile?.uid || "").trim();
  return {
    discordId,
    username: profile?.displayName || firebaseUser.displayName || "Aron Player",
    avatar: avatarUrl(firebaseUser, profile),
    raw: {
      uid: firebaseUser.uid,
      providerId: profile?.providerId || DISCORD_PROVIDER_ID,
      email: firebaseUser.email || profile?.email || ""
    }
  };
}

function createDiscordProvider() {
  const provider = new OAuthProvider(DISCORD_PROVIDER_ID);
  provider.addScope("identify");
  return provider;
}

export function getStoredDiscordSession() {
  return auth?.currentUser ? { user: normalizeFirebaseUser(auth.currentUser) } : null;
}

export async function startDiscordLogin() {
  if (!auth) throw new Error("Firebase Auth is not configured.");

  const provider = createDiscordProvider();
  sessionStorage.setItem(RETURN_ROUTE_KEY, currentRoute());

  try {
    const credential = await signInWithPopup(auth, provider);
    const returnTo = sessionStorage.getItem(RETURN_ROUTE_KEY) || "/";
    sessionStorage.removeItem(RETURN_ROUTE_KEY);
    restoreRoute(returnTo);
    return { user: normalizeFirebaseUser(credential.user) };
  } catch (error) {
    if (["auth/popup-blocked", "auth/popup-closed-by-user", "auth/cancelled-popup-request"].includes(error?.code)) {
      await signInWithRedirect(auth, provider);
      return null;
    }
    sessionStorage.removeItem(RETURN_ROUTE_KEY);
    throw error;
  }
}

export async function finishDiscordLogin() {
  if (!auth) return null;

  const credential = await getRedirectResult(auth).catch((error) => {
    sessionStorage.removeItem(RETURN_ROUTE_KEY);
    throw error;
  });

  const returnTo = sessionStorage.getItem(RETURN_ROUTE_KEY);
  if (returnTo) {
    sessionStorage.removeItem(RETURN_ROUTE_KEY);
    restoreRoute(returnTo);
  }

  if (credential?.user) return { user: normalizeFirebaseUser(credential.user) };

  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      unsubscribe();
      resolve(firebaseUser ? { user: normalizeFirebaseUser(firebaseUser) } : null);
    });
  });
}

export async function clearDiscordSession() {
  sessionStorage.removeItem(RETURN_ROUTE_KEY);
  if (auth) await signOut(auth);
}
