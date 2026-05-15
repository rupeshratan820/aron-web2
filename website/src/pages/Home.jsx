import { Activity, Bot, Gem, Heart, ShieldCheck, Sparkles, Swords, Trophy, Users, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import Page from "../components/Page.jsx";
import Button from "../components/Button.jsx";
import StatCard from "../components/StatCard.jsx";
import CardTile from "../components/CardTile.jsx";
import { getSiteStats, getTopWishlistedCards } from "../lib/data.js";

export default function Home() {
  const [stats, setStats] = useState({ players: 0, cards: 0, copies: 0, guilds: 0 });
  const [showcase, setShowcase] = useState([]);
  useEffect(() => { getSiteStats().then(setStats).catch((error) => console.warn("[Website data] Stats failed:", error)); }, []);
  useEffect(() => { getTopWishlistedCards(3).then(setShowcase).catch((error) => console.warn("[Website data] Showcase failed:", error)); }, []);
  const activity = [
    ["Verification", "One-click Discord guard", ShieldCheck],
    ["Drops", `${stats.copies || 0} unique copies tracked`, Zap],
    ["Wishlist", "Live card demand board", Heart]
  ];

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
          <div className="hero-radar absolute left-1/2 top-1/2 h-[430px] w-[430px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan/10" />
          {showcase.length ? showcase.map(({ card, count }, index) => (
            <motion.div
              key={card.id}
              className={`absolute w-64 ${index === 0 ? "left-2 top-14 z-20" : index === 1 ? "right-0 top-2 z-10" : "bottom-10 left-28 z-30"}`}
              animate={{ y: [0, -18, 0], rotate: index === 1 ? [8, 4, 8] : [-6, -2, -6] }}
              transition={{ duration: 5 + index, repeat: Infinity, ease: "easeInOut" }}
            >
              <CardTile card={card} wished count={count} />
            </motion.div>
          )) : (
            <div className="absolute inset-0 grid place-items-center">
              <motion.div
                className="shine w-72 rounded-lg border border-cyan/25 bg-panel/86 p-5 shadow-glow"
                animate={{ y: [0, -16, 0], rotate: [-4, -1, -4] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="grid aspect-[3/4] place-items-center rounded-lg border border-white/10 bg-gradient-to-br from-cyan/18 via-white/8 to-rose/18">
                  <Sparkles className="h-16 w-16 text-cyan" />
                </div>
                <div className="mt-4 text-sm font-black uppercase tracking-[0.22em] text-cyan">Live collection</div>
                <div className="mt-1 text-2xl font-black">Aron Card Feed</div>
                <p className="mt-2 text-sm leading-6 text-white/58">Top wishlist cards appear here as soon as Firebase data is available.</p>
              </motion.div>
            </div>
          )}
        </div>
      </section>
      <section className="mb-8 grid gap-3 lg:grid-cols-3">
        {activity.map(([label, value, Icon], index) => (
          <motion.div
            key={label}
            className="rounded-lg border border-white/10 bg-white/[0.045] p-4"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
          >
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg border border-cyan/25 bg-cyan/10">
                <Icon className="h-5 w-5 text-cyan" />
              </div>
              <div>
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-white/42">
                  <Activity className="h-3.5 w-3.5 text-rose" /> {label}
                </div>
                <div className="mt-1 font-bold text-white/78">{value}</div>
              </div>
            </div>
          </motion.div>
        ))}
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
