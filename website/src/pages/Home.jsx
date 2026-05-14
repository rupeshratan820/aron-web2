import { Bot, Gem, Heart, ShieldCheck, Swords, Trophy, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import Page from "../components/Page.jsx";
import Button from "../components/Button.jsx";
import StatCard from "../components/StatCard.jsx";
import CardTile from "../components/CardTile.jsx";
import { getSiteStats } from "../lib/data.js";

const showcase = [
  { id: "a", name: "Neon Sakura", series: "Aron Genesis", style: "mythic" },
  { id: "b", name: "Moonlit Ace", series: "Guild War", style: "legendary" },
  { id: "c", name: "Cyber Shrine", series: "Wish Core", style: "rare" }
];

export default function Home() {
  const [stats, setStats] = useState({ players: 0, cards: 0, copies: 0, guilds: 0 });
  useEffect(() => { getSiteStats().then(setStats).catch((error) => console.warn("[Website data] Stats failed:", error)); }, []);

  return (
    <Page className="pb-20">
      <section className="grid min-h-[calc(100vh-170px)] items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <div className="inline-flex items-center gap-2 rounded-lg border border-cyan/30 bg-cyan/10 px-3 py-2 text-xs font-black uppercase tracking-[0.22em] text-cyan">
            <Gem className="h-4 w-4" /> Premium anime collection ecosystem
          </div>
          <h1 className="mt-6 max-w-4xl text-5xl font-black leading-[0.96] sm:text-7xl lg:text-8xl">
            Aron
            <span className="block bg-gradient-to-r from-cyan via-white to-rose bg-clip-text text-transparent">Collection Nexus</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/66">
            Collect rare anime cards, flex unique copy codes, climb guild rankings, manage wishlists, and verify your Discord identity in one polished player hub.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/verify"><Button icon={ShieldCheck}>Verify Account</Button></Link>
            <Link to="/dashboard"><Button variant="ghost" icon={Trophy}>Open Dashboard</Button></Link>
            <a href={import.meta.env.VITE_DISCORD_INVITE_URL || "#"}><Button variant="ghost" icon={Bot}>Invite Aron</Button></a>
          </div>
        </div>
        <div className="relative h-[560px]">
          {showcase.map((card, index) => (
            <motion.div
              key={card.id}
              className={`absolute w-64 ${index === 0 ? "left-2 top-14 z-20" : index === 1 ? "right-0 top-2 z-10" : "bottom-10 left-28 z-30"}`}
              animate={{ y: [0, -18, 0], rotate: index === 1 ? [8, 4, 8] : [-6, -2, -6] }}
              transition={{ duration: 5 + index, repeat: Infinity, ease: "easeInOut" }}
            >
              <CardTile card={card} wished={index !== 1} count={(index + 1) * 247} />
            </motion.div>
          ))}
        </div>
      </section>
      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="Players" value={stats.players} icon={Users} />
        <StatCard label="Card Templates" value={stats.cards} icon={Gem} />
        <StatCard label="Unique Copies" value={stats.copies} icon={Heart} />
        <StatCard label="Guilds" value={stats.guilds} icon={Swords} />
      </section>
    </Page>
  );
}
