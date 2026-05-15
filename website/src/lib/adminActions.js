import { readFirst, readValue, updateValue, writeValue } from "./firebase.js";
import { clearDataCache, normalizeCollection } from "./data.js";

const CARD_GEN_MIN = 1;
const CARD_GEN_MAX = 2999;
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTHS = [2, 3, 4, 5, 6, 6, 6, 5, 5, 4];
const CURRENCIES = ["coins", "gems", "shards", "claims", "drops"];
const ACCOUNT_STATUSES = ["unverified", "verified", "quarantined", "blocked"];
const CARD_STYLES = ["gold", "violet", "azure"];

function cleanId(value) {
  return String(value || "").trim();
}

function cleanPath(path) {
  return String(path || "").replace(/^\/+|\/+$/g, "");
}

function nowIso() {
  return new Date().toISOString();
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function randomInt(max) {
  const limit = Math.max(1, Math.floor(Number(max) || 1));
  if (window.crypto?.getRandomValues) {
    const bucket = new Uint32Array(1);
    window.crypto.getRandomValues(bucket);
    return bucket[0] % limit;
  }
  return Math.floor(Math.random() * limit);
}

function normalizeCardStyle(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (["gold", "aurum", "yellow"].includes(normalized)) return "gold";
  if (["violet", "aether", "purple"].includes(normalized)) return "violet";
  if (["azure", "aqua", "blue", "cyan"].includes(normalized)) return "azure";
  return "azure";
}

function normalizeCurrency(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (["aero", "shard", "shards"].includes(normalized)) return "shards";
  return CURRENCIES.includes(normalized) ? normalized : null;
}

function normalizeAmount(value) {
  return Math.max(0, Math.floor(Number(value) || 0));
}

function getNextCardId(cards) {
  const used = new Set(Object.keys(normalizeCollection(cards)).map(Number).filter((id) => Number.isInteger(id) && id > 0));
  let id = 1;
  while (used.has(id)) id += 1;
  return String(id);
}

function generateCode(codes) {
  const existing = normalizeCollection(codes);
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const length = CODE_LENGTHS[randomInt(CODE_LENGTHS.length)] || 6;
    let code = "";
    for (let index = 0; index < length; index += 1) {
      code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
    }
    if (/[A-Z]/.test(code) && !existing[code]) return code;
  }
  return `C${Date.now().toString(36).slice(-5).toUpperCase()}`;
}

function generateGen(claimedGens, cardId) {
  const used = new Set((Array.isArray(claimedGens?.[cardId]) ? claimedGens[cardId] : []).map(Number).filter(Boolean));
  if (used.size >= CARD_GEN_MAX) return null;

  for (let attempt = 0; attempt < 500; attempt += 1) {
    const candidate = randomInt(CARD_GEN_MAX) + CARD_GEN_MIN;
    if (!used.has(candidate)) return candidate;
  }

  for (let candidate = CARD_GEN_MAX; candidate >= CARD_GEN_MIN; candidate -= 1) {
    if (!used.has(candidate)) return candidate;
  }

  return null;
}

function normalizeUser(user, userId) {
  const source = isPlainObject(user) ? user : {};
  return {
    id: cleanId(source.id || userId),
    username: source.username || `User ${userId}`,
    inventory: Array.isArray(source.inventory) ? source.inventory : [],
    wishlist: Array.isArray(source.wishlist) ? source.wishlist.map(String) : [],
    wallet: isPlainObject(source.wallet) ? source.wallet : {},
    stats: isPlainObject(source.stats) ? source.stats : {},
    ...source
  };
}

function uniqueSorted(values) {
  return [...new Set((Array.isArray(values) ? values : []).map(cleanId).filter(Boolean))].sort();
}

function normalizeAdminIds(value) {
  if (Array.isArray(value)) return uniqueSorted(value);
  if (isPlainObject(value)) {
    return uniqueSorted(
      Object.entries(value)
        .filter(([, enabled]) => enabled !== false && enabled !== null)
        .map(([userId]) => userId)
    );
  }
  return [];
}

function envAdminIds() {
  return uniqueSorted(String(import.meta.env.VITE_ADMIN_DISCORD_IDS || "")
    .split(/[,\s]+/)
    .filter(Boolean));
}

function adminIdMap(ids) {
  return Object.fromEntries(uniqueSorted(ids).map((id) => [id, true]));
}

function buildWishlistCounts(users, cards) {
  const validCardIds = new Set(Object.keys(normalizeCollection(cards)));
  const counts = {};
  for (const user of Object.values(normalizeCollection(users))) {
    for (const cardId of new Set(Array.isArray(user?.wishlist) ? user.wishlist.map(String) : [])) {
      if (!validCardIds.has(cardId)) continue;
      counts[cardId] = Number(counts[cardId] || 0) + 1;
    }
  }
  return counts;
}

async function audit(identity, action, details = {}) {
  const actorId = cleanId(identity?.discordId);
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await writeValue(`meta/adminAudit/${id}`, {
    action,
    actorId,
    actorName: identity?.username || "",
    at: nowIso(),
    details
  }).catch((error) => console.warn("[Admin audit] write failed:", error));
}

export async function getAdminIds() {
  const ids = await readValue("meta/adminUserIds", []);
  return uniqueSorted([...normalizeAdminIds(ids), ...envAdminIds()]);
}

export async function isAdminIdentity(identity) {
  const discordId = cleanId(identity?.discordId);
  if (!discordId) return false;
  return (await getAdminIds()).includes(discordId);
}

export async function getAdminOverview() {
  const [users, cards, codes, guilds, meta] = await Promise.all([
    readFirst("users", 1000),
    readFirst("cards", 1000),
    readFirst("codes", 10000),
    readFirst("guilds", 1000),
    readValue("meta", {})
  ]);
  return {
    users: normalizeCollection(users),
    cards: normalizeCollection(cards),
    codes: normalizeCollection(codes),
    guilds: normalizeCollection(guilds),
    meta: isPlainObject(meta) ? meta : {}
  };
}

export async function findUser(userId) {
  const id = cleanId(userId);
  if (!id) return null;
  return normalizeUser(await readValue(`users/${id}`, null), id);
}

export async function setAdminUser(identity, userId, enabled) {
  const ids = new Set(await getAdminIds());
  const normalized = cleanId(userId);
  if (!normalized) throw new Error("User ID is required.");
  if (enabled) ids.add(normalized);
  else ids.delete(normalized);
  await writeValue("meta/adminUserIds", adminIdMap([...ids]));
  await audit(identity, enabled ? "admin.grant" : "admin.revoke", { userId: normalized });
  clearDataCache();
}

export async function saveCard(identity, payload) {
  const cards = normalizeCollection(await readValue("cards", {}));
  const cardId = cleanId(payload.id) || getNextCardId(cards);
  const style = normalizeCardStyle(payload.style);
  const existing = cards[cardId] || {};
  const card = {
    ...existing,
    id: cardId,
    name: String(payload.name || existing.name || "").trim(),
    series: String(payload.series ?? existing.series ?? "").trim(),
    imageUrl: String(payload.imageUrl || existing.imageUrl || "").trim(),
    active: payload.active !== false,
    style,
    class: style,
    createdAt: existing.createdAt || nowIso(),
    updatedAt: nowIso()
  };
  if (!card.name) throw new Error("Card name is required.");
  if (!/^https?:\/\//i.test(card.imageUrl)) throw new Error("A direct http or https image URL is required.");

  await updateValue("", {
    [`cards/${cardId}`]: card,
    "meta/nextCardId": Number(getNextCardId({ ...cards, [cardId]: card }))
  });
  await audit(identity, existing.id ? "card.update" : "card.create", { cardId, name: card.name });
  clearDataCache();
  return card;
}

export async function deleteCard(identity, cardId) {
  const id = cleanId(cardId);
  if (!id) throw new Error("Card ID is required.");
  const [users, codes] = await Promise.all([readValue("users", {}), readValue("codes", {})]);
  const updates = {
    [`cards/${id}`]: null,
    [`claimedGens/${id}`]: null,
    [`meta/wishlistLeaderboard/counts/${id}`]: null
  };

  for (const [userId, rawUser] of Object.entries(normalizeCollection(users))) {
    const user = normalizeUser(rawUser, userId);
    const nextWishlist = user.wishlist.filter((entry) => String(entry) !== id);
    const nextInventory = user.inventory.filter((copy) => String(copy?.cardId) !== id);
    if (nextWishlist.length !== user.wishlist.length) updates[`users/${userId}/wishlist`] = nextWishlist;
    if (nextInventory.length !== user.inventory.length) updates[`users/${userId}/inventory`] = nextInventory;
  }

  for (const [code, entry] of Object.entries(normalizeCollection(codes))) {
    if (String(entry?.cardId) === id) updates[`codes/${code}`] = null;
  }

  await updateValue("", updates);
  await audit(identity, "card.delete", { cardId: id });
  clearDataCache();
}

export async function updateWallet(identity, userId, currency, action, amount) {
  const id = cleanId(userId);
  const key = normalizeCurrency(currency);
  const mode = String(action || "").toLowerCase();
  if (!id || !key) throw new Error("User ID and currency are required.");
  if (!["give", "take", "set"].includes(mode)) throw new Error("Wallet action must be give, take, or set.");
  const user = normalizeUser(await readValue(`users/${id}`, null), id);
  const current = normalizeAmount(user.wallet[key]);
  const value = normalizeAmount(amount);
  const next = mode === "give" ? current + value : mode === "take" ? Math.max(0, current - value) : value;
  await updateValue(`users/${id}`, {
    id,
    username: user.username,
    [`wallet/${key}`]: next,
    updatedAt: nowIso()
  });
  await audit(identity, `wallet.${mode}`, { userId: id, currency: key, amount: value, next });
  clearDataCache(`dashboard:${id}`);
  return next;
}

export async function giveCardCopy(identity, userId, cardId, amount = 1) {
  const id = cleanId(userId);
  const cardKey = cleanId(cardId);
  const count = Math.min(20, Math.max(1, Math.floor(Number(amount) || 1)));
  const [card, rawUser, codes, claimedGens] = await Promise.all([
    readValue(`cards/${cardKey}`, null),
    readValue(`users/${id}`, null),
    readValue("codes", {}),
    readValue("claimedGens", {})
  ]);
  if (!id || !card) throw new Error("Valid user ID and card ID are required.");

  const user = normalizeUser(rawUser, id);
  const updates = {};
  const copies = [];
  const nextClaimed = { ...normalizeCollection(claimedGens) };
  nextClaimed[cardKey] = Array.isArray(nextClaimed[cardKey]) ? [...nextClaimed[cardKey]] : [];
  const nextCodes = normalizeCollection(codes);

  for (let index = 0; index < count; index += 1) {
    const gen = generateGen(nextClaimed, cardKey);
    if (!gen) break;
    const code = generateCode(nextCodes);
    const style = CARD_STYLES[randomInt(CARD_STYLES.length)] || "azure";
    const copy = { code, cardId: cardKey, gen, style, class: style, obtainedAt: nowIso(), source: "website-admin" };
    nextClaimed[cardKey].push(gen);
    nextCodes[code] = { ...copy, ownerId: id };
    copies.push(copy);
    updates[`codes/${code}`] = nextCodes[code];
  }

  if (!copies.length) throw new Error("No unowned gens are left for that card.");
  updates[`users/${id}/inventory`] = [...user.inventory, ...copies];
  updates[`users/${id}/id`] = id;
  updates[`users/${id}/username`] = user.username;
  updates[`users/${id}/stats/received`] = Number(user.stats.received || 0) + copies.length;
  updates[`users/${id}/updatedAt`] = nowIso();
  updates[`claimedGens/${cardKey}`] = [...new Set(nextClaimed[cardKey].map(Number).filter(Boolean))].sort((a, b) => a - b);

  await updateValue("", updates);
  await audit(identity, "inventory.give", { userId: id, cardId: cardKey, amount: copies.length });
  clearDataCache(`dashboard:${id}`);
  return copies;
}

export async function removeCardCopy(identity, userId, code) {
  const id = cleanId(userId);
  const normalizedCode = cleanId(code).toUpperCase();
  const user = normalizeUser(await readValue(`users/${id}`, null), id);
  const copy = user.inventory.find((entry) => cleanId(entry?.code).toUpperCase() === normalizedCode);
  if (!copy) throw new Error("That copy was not found in the player's inventory.");
  const claimed = await readValue(`claimedGens/${copy.cardId}`, []);
  await updateValue("", {
    [`users/${id}/inventory`]: user.inventory.filter((entry) => cleanId(entry?.code).toUpperCase() !== normalizedCode),
    [`users/${id}/updatedAt`]: nowIso(),
    [`codes/${normalizedCode}`]: null,
    [`claimedGens/${copy.cardId}`]: (Array.isArray(claimed) ? claimed : []).filter((gen) => Number(gen) !== Number(copy.gen))
  });
  await audit(identity, "inventory.remove", { userId: id, code: normalizedCode, cardId: copy.cardId });
  clearDataCache(`dashboard:${id}`);
}

export async function addAllWishlist(identity, userId) {
  const id = cleanId(userId);
  const [cards, rawUser, users] = await Promise.all([
    readValue("cards", {}),
    readValue(`users/${id}`, null),
    readValue("users", {})
  ]);
  const user = normalizeUser(rawUser, id);
  const wishlist = uniqueSorted([...user.wishlist, ...Object.keys(normalizeCollection(cards))]);
  const nextUsers = { ...normalizeCollection(users), [id]: { ...user, wishlist } };
  await updateValue("", {
    [`users/${id}/id`]: id,
    [`users/${id}/username`]: user.username,
    [`users/${id}/wishlist`]: wishlist,
    [`users/${id}/updatedAt`]: nowIso(),
    "meta/wishlistLeaderboard": {
      counts: buildWishlistCounts(nextUsers, cards),
      updatedAt: Date.now(),
      version: 1
    }
  });
  await audit(identity, "wishlist.addAll", { userId: id, total: wishlist.length });
  clearDataCache();
}

export async function rebuildWishlistLeaderboard(identity) {
  const [users, cards] = await Promise.all([readValue("users", {}), readValue("cards", {})]);
  const cache = { counts: buildWishlistCounts(users, cards), updatedAt: Date.now(), version: 1 };
  await writeValue("meta/wishlistLeaderboard", cache);
  await audit(identity, "wishlist.rebuild", { cards: Object.keys(cache.counts).length });
  clearDataCache();
  return cache;
}

export async function setBotBan(identity, userId, enabled, reason = "") {
  const id = cleanId(userId);
  if (!id) throw new Error("User ID is required.");
  await writeValue(`meta/botBans/${id}`, enabled ? {
    reason: String(reason || "").trim(),
    bannedAt: nowIso(),
    bannedBy: identity?.discordId || ""
  } : null);
  await audit(identity, enabled ? "botban.add" : "botban.remove", { userId: id, reason });
  clearDataCache();
}

export async function setAccountStatus(identity, userId, status, reason = "") {
  const id = cleanId(userId);
  const normalizedStatus = String(status || "").trim().toLowerCase();
  if (!id || !ACCOUNT_STATUSES.includes(normalizedStatus)) throw new Error("Valid user ID and status are required.");
  await writeValue(`meta/accountSecurity/userStatuses/${id}`, normalizedStatus === "unverified" ? null : {
    status: normalizedStatus,
    reason: String(reason || "").trim(),
    updatedAt: nowIso(),
    updatedBy: identity?.discordId || ""
  });
  await audit(identity, "account.status", { userId: id, status: normalizedStatus });
  clearDataCache();
}

export async function setCommandDisabled(identity, commandName, disabled) {
  const name = cleanId(commandName).replace(/^[!/]+/, "").toLowerCase();
  if (!name) throw new Error("Command name is required.");
  const disabledCommands = new Set((await readValue("meta/disabledCommands", []) || []).map((entry) => String(entry).toLowerCase()));
  if (disabled) disabledCommands.add(name);
  else disabledCommands.delete(name);
  await writeValue("meta/disabledCommands", [...disabledCommands].sort());
  await audit(identity, disabled ? "command.disable" : "command.enable", { command: name });
  clearDataCache();
}

export async function setChannelCommandDisabled(identity, guildId, channelId, commandName, disabled) {
  const guild = cleanId(guildId);
  const channel = cleanId(channelId);
  const command = cleanId(commandName).replace(/^[!/]+/, "").toLowerCase();
  if (!guild || !channel || !command) throw new Error("Guild ID, channel ID, and command are required.");
  const path = `meta/channelDisabledCommands/${guild}/${channel}`;
  const commands = new Set((await readValue(path, []) || []).map((entry) => String(entry).toLowerCase()));
  if (disabled) commands.add(command);
  else commands.delete(command);
  await writeValue(path, commands.size ? [...commands].sort() : null);
  await audit(identity, disabled ? "channelCommand.disable" : "channelCommand.enable", { guildId: guild, channelId: channel, command });
  clearDataCache();
}

export async function resetUserField(identity, userId, field) {
  const id = cleanId(userId);
  const mode = String(field || "").trim();
  if (!id) throw new Error("User ID is required.");
  if (mode === "wallet") {
    await updateValue(`users/${id}`, { wallet: { coins: 0, gems: 0, shards: 0, claims: 0, drops: 0 }, updatedAt: nowIso() });
  } else if (mode === "cooldown") {
    await updateValue(`users/${id}`, { lastDropAt: 0, lastClaimAt: 0, cooldownReminders: {}, updatedAt: nowIso() });
  } else if (mode === "profile") {
    await updateValue(`users/${id}`, { bio: null, tags: null, activeTag: null, privacy: null, updatedAt: nowIso() });
  } else {
    throw new Error("Reset field must be wallet, cooldown, or profile.");
  }
  await audit(identity, `reset.${mode}`, { userId: id });
  clearDataCache(`dashboard:${id}`);
}

export async function rawDatabaseWrite(identity, path, mode, rawJson) {
  const targetPath = cleanPath(path);
  const action = String(mode || "set").toLowerCase();
  if (!targetPath) throw new Error("Database path is required.");
  let value = null;
  if (action !== "delete") {
    value = JSON.parse(rawJson);
  }
  if (action === "update") await updateValue(targetPath, value);
  else await writeValue(targetPath, action === "delete" ? null : value);
  await audit(identity, `raw.${action}`, { path: targetPath });
  clearDataCache();
}
