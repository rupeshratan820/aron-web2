import { readFirst, readValue, transaction, updateValue, writeValue } from "./firebase.js";
import { getDeviceHash, scoreSecurity, sha256Hex } from "./security.js";

const CACHE_TTL = 60_000;
const cache = new Map();

async function cached(key, loader, ttl = CACHE_TTL) {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.at < ttl) return entry.value;
  const value = await loader();
  cache.set(key, { value, at: Date.now() });
  return value;
}

export function normalizeCollection(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

export async function getSiteStats() {
  return cached("siteStats", async () => {
    const [users, cards, codes, guilds] = await Promise.all([
      readFirst("users", 200),
      readFirst("cards", 200),
      readFirst("codes", 200),
      readFirst("guilds", 200)
    ]);
    return {
      players: Object.keys(normalizeCollection(users)).length,
      cards: Object.keys(normalizeCollection(cards)).length,
      copies: Object.keys(normalizeCollection(codes)).length,
      guilds: Object.keys(normalizeCollection(guilds)).length
    };
  });
}

export async function getDashboard(discordId) {
  if (!discordId) return null;
  return cached(`dashboard:${discordId}`, async () => {
    const [user, cards, guilds, security, wishlistLeaderboard] = await Promise.all([
      readValue(`users/${discordId}`),
      readFirst("cards", 80),
      readFirst("guilds", 40),
      readValue(`meta/accountSecurity/userStatuses/${discordId}`),
      readValue("meta/wishlistLeaderboard/counts", {})
    ]);
    const guild = user?.guildId ? guilds?.[user.guildId] : null;
    return { user, cards: normalizeCollection(cards), guild, security, wishlistLeaderboard: wishlistLeaderboard || {} };
  }, 20_000);
}

export async function getPublicProfile(discordId) {
  return getDashboard(discordId);
}

export async function getCardsPage(limit = 60) {
  return cached(`cards:${limit}`, () => readFirst("cards", limit), 45_000);
}

export async function getGuildsPage(limit = 50) {
  return cached(`guilds:${limit}`, () => readFirst("guilds", limit), 45_000);
}

export async function getWishlistData(discordId) {
  const [dashboard, allCards] = await Promise.all([getDashboard(discordId), getCardsPage(120)]);
  const wishlistIds = Array.isArray(dashboard?.user?.wishlist) ? dashboard.user.wishlist : [];
  return {
    ...dashboard,
    wishlistCards: wishlistIds.map((cardId) => allCards?.[cardId]).filter(Boolean),
    allCards: normalizeCollection(allCards)
  };
}

export async function syncWebUser(identity) {
  if (!identity.discordId) return null;
  const payload = {
    discordId: identity.discordId,
    username: identity.username,
    avatar: identity.avatar,
    lastLoginAt: Date.now(),
    provider: "discord-oauth2"
  };
  await updateValue(`webUsers/${identity.discordId}`, payload);
  return payload;
}

export async function verifyToken(rawToken, identity) {
  const discordId = identity.discordId;
  if (!rawToken) throw new Error("Missing verification token.");
  if (!discordId) throw new Error("Discord identity was not available from OAuth.");

  const tokenHash = await sha256Hex(rawToken);
  const tokenPath = `verificationTokens/${tokenHash}`;
  const token = await readValue(tokenPath);
  if (!token) throw new Error("This verification link is invalid or expired.");
  if (token.usedAt) throw new Error("This verification link has already been used.");
  if (Number(token.expiresAt || 0) < Date.now()) throw new Error("This verification link has expired.");
  if (token.targetUserId && token.targetUserId !== discordId) throw new Error("This link was created for a different Discord account.");

  const [userRecord, deviceHash] = await Promise.all([
    readValue(`users/${discordId}`),
    getDeviceHash()
  ]);
  const recentSecurity = await readFirst("meta/accountSecurity/userStatuses", 80);
  const matchingDevices = Object.values(recentSecurity || {}).filter((entry) => entry?.deviceHash === deviceHash).length;
  const security = scoreSecurity({ token, discordId, userRecord, matchingDevices });
  const finalStatus = security.status === "suspicious" ? "quarantined" : security.status;
  const now = Date.now();

  await transaction(tokenPath, (current) => {
    if (!current || current.usedAt || Number(current.expiresAt || 0) < now) return current;
    return {
      ...current,
      usedAt: now,
      usedBy: discordId,
      status: finalStatus
    };
  });

  await updateValue(`meta/accountSecurity/userStatuses/${discordId}`, {
    status: finalStatus,
    reason: security.notes.join(", "),
    updatedAt: new Date(now).toISOString(),
    updatedBy: "website",
    verifiedAt: finalStatus === "verified" ? now : null,
    username: identity.username,
    avatar: identity.avatar,
    deviceHash,
    suspicionScore: security.score,
    tokenHash
  });

  await writeValue(`verificationAudit/${discordId}/${tokenHash}`, {
    at: now,
    status: finalStatus,
    score: security.score,
    notes: security.notes,
    deviceHash
  });

  return { status: finalStatus, score: security.score, notes: security.notes };
}
