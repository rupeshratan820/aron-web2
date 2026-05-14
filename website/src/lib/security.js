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

export function scoreSecurity({ token, discordId, userRecord, matchingDevices = 0 }) {
  let score = 0;
  const notes = [];
  if (!token) {
    score += 45;
    notes.push("missing verification token");
  }
  if (token?.targetUserId && discordId && token.targetUserId !== discordId) {
    score += 70;
    notes.push("token belongs to another Discord account");
  }
  if (!userRecord?.registeredAt) {
    score += 10;
    notes.push("bot profile is not registered yet");
  }
  if (matchingDevices >= 2) {
    score += 25;
    notes.push("device hash is shared by multiple recent verifications");
  }
  const status = score >= 80 ? "blocked" : score >= 55 ? "quarantined" : score >= 25 ? "suspicious" : "verified";
  return { score, status, notes };
}
