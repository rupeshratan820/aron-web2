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

export function cardImage(card) {
  return card?.imageUrl || card?.image || `https://api.dicebear.com/8.x/glass/svg?seed=${encodeURIComponent(card?.name || card?.id || "aron-card")}`;
}

export function safeText(value, fallback = "Unknown") {
  const text = String(value || "").trim();
  return text || fallback;
}
