import { Heart, Sparkles } from "lucide-react";
import { cardImage, cardStyle, formatCardGen, safeText } from "../lib/format.js";

export default function CardTile({ card, copy, wished, count }) {
  const style = cardStyle(card, copy);
  const gen = formatCardGen(copy?.gen || card?.gen);

  return (
    <article className="card-tilt shine rounded-lg border border-white/10 bg-panel/86 p-3 shadow-card">
      <div className="relative aspect-[3/4] overflow-hidden rounded-md bg-white/5">
        <img src={cardImage(card)} alt={safeText(card?.name, "Aron card")} className="h-full w-full object-cover" loading="lazy" />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/88 to-transparent p-3">
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-cyan">{safeText(card?.series, "Unknown Series")}</div>
          <div className="line-clamp-2 text-lg font-black">{safeText(card?.name, "Unknown Card")}</div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2 text-sm">
        <span className="inline-flex items-center gap-1 rounded-md bg-white/5 px-2 py-1 font-semibold text-white/70">
          <Sparkles className="h-3.5 w-3.5 text-violet" />
          {gen || style.shortLabel}
        </span>
        <span className="rounded-md bg-white/5 px-2 py-1 font-mono text-white/70">{copy?.code || card?.id || "ARON"}</span>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3 text-xs font-bold uppercase tracking-[0.16em] text-white/46">
        <span>{style.label}</span>
        <span className={wished ? "text-rose" : "text-white/46"}><Heart className="mr-1 inline h-3.5 w-3.5" />{count || 0}</span>
      </div>
    </article>
  );
}
