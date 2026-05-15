export async function sha256Hex(value) {
  const data = new TextEncoder().encode(String(value || ""));
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function getDeviceHash() {
  const stable = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    screen.colorDepth,
    Intl.DateTimeFormat().resolvedOptions().timeZone
  ].join("|");
  return sha256Hex(stable);
}

export function discordAccountCreatedAt(discordId) {
  const id = String(discordId || "").trim();
  if (!/^\d{17,22}$/.test(id)) return 0;

  try {
    return Number((BigInt(id) >> 22n) + 1420070400000n);
  } catch {
    return 0;
  }
}

export function scoreSecurity({ token, discordId, userRecord, matchingDevices = 0 }) {
  let score = 0;
  const notes = [];
  const accountCreatedAt = discordAccountCreatedAt(discordId);
  const accountAgeDays = accountCreatedAt ? (Date.now() - accountCreatedAt) / 86_400_000 : null;

  if (!token) {
    score += 45;
    notes.push("missing verification token");
  }
  if (token?.targetUserId && discordId && token.targetUserId !== discordId) {
    score += 70;
    notes.push("token belongs to another Discord account");
  }
  if (!userRecord?.registeredAt) {
    score += 18;
    notes.push("bot profile is not registered yet");
  }
  if (accountAgeDays !== null && accountAgeDays < 3) {
    score += 70;
    notes.push("Discord account is under 3 days old");
  } else if (accountAgeDays !== null && accountAgeDays < 14) {
    score += 35;
    notes.push("Discord account is under 14 days old");
  }
  if (matchingDevices >= 2) {
    score += 35;
    notes.push("device hash is shared by multiple recent verifications");
  }
  if (matchingDevices >= 4) {
    score += 35;
    notes.push("device hash is shared by many accounts");
  }
  const status = score >= 80 ? "blocked" : score >= 55 ? "quarantined" : score >= 25 ? "suspicious" : "verified";
  return { score, status, notes };
}
