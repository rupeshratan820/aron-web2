export function compactNumber(value) {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(Number(value) || 0);
}

export function fullNumber(value) {
  return new Intl.NumberFormat("en-US").format(Math.max(0, Number(value) || 0));
}

export function fromNow(timestamp) {
  const value = Number(timestamp || 0);
  if (!value) return "Ready";
  const diff = value - Date.now();
  if (diff <= 0) return "Ready";
  const minutes = Math.ceil(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days) return `${days}d ${hours % 24}h`;
  if (hours) return `${hours}h ${minutes % 60}m`;
  return `${minutes}m`;
}

const CARD_STYLE_LABELS = {
  gold: { label: "Aurum", shortLabel: "AUR" },
  violet: { label: "Aether", shortLabel: "AET" },
  azure: { label: "Aqua", shortLabel: "AQU" }
};

const LEGACY_CLASS_TO_STYLE = {
  1: "azure",
  2: "azure",
  3: "violet",
  4: "violet",
  5: "gold"
};

const STYLE_ALIASES = {
  gold: "gold",
  aurum: "gold",
  yellow: "gold",
  golden: "gold",
  violet: "violet",
  aether: "violet",
  purple: "violet",
  azure: "azure",
  aqua: "azure",
  blue: "azure",
  cyan: "azure"
};

export function normalizeCardStyle(value) {
  const directKey = String(value || "").trim().toLowerCase();
  if (STYLE_ALIASES[directKey]) return STYLE_ALIASES[directKey];

  const numeric = Number(value);
  if (Number.isInteger(numeric)) return LEGACY_CLASS_TO_STYLE[numeric] || null;

  return null;
}

export function cardStyle(card, copy = null) {
  const style = normalizeCardStyle(copy?.style || copy?.class || card?.style || card?.class) || "azure";
  return { id: style, ...CARD_STYLE_LABELS[style] };
}

export function formatCardGen(value) {
  const gen = Number(value);
  if (!Number.isInteger(gen) || gen < 1 || gen > 2999) return "";
  return `G-${String(gen).padStart(4, "0")}`;
}

export function cardImage(card) {
  return card?.imageUrl || card?.image || `https://api.dicebear.com/8.x/glass/svg?seed=${encodeURIComponent(card?.name || card?.id || "aron-card")}`;
}

export function safeText(value, fallback = "Unknown") {
  const text = String(value || "").trim();
  return text || fallback;
}
