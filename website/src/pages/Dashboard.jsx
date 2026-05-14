import { BadgeCheck, Coins, Gem, Heart, Shield, Timer, Trophy, Users } from "lucide-react";
import { useEffect, useState } from "react";
import Page from "../components/Page.jsx";
import RequireLogin from "../components/RequireLogin.jsx";
import StatCard from "../components/StatCard.jsx";
import CardTile from "../components/CardTile.jsx";
import { getDashboard } from "../lib/data.js";
import { fullNumber, fromNow } from "../lib/format.js";
import { useAuthStore } from "../store/authStore.js";

export default function Dashboard() {
  const { identity } = useAuthStore();
  const [data, setData] = useState(null);
  useEffect(() => { if (identity?.discordId) getDashboard(identity.discordId).then(setData); }, [identity?.discordId]);
  const user = data?.user || {};
  const inventory = Array.isArray(user.inventory) ? user.inventory : [];
  const cards = data?.cards || {};
  const wallet = user.wallet || {};
  const status = data?.security?.status || "unverified";

  return (
    <Page>
      <RequireLogin>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-sm font-black uppercase tracking-[0.24em] text-cyan">Player dashboard</div>
            <h1 className="mt-2 text-4xl font-black">{identity?.username || user.username || "Aron Player"}</h1>
          </div>
          <div className="rounded-lg border border-cyan/30 bg-cyan/10 px-4 py-2 text-sm font-black capitalize text-cyan">
            <BadgeCheck className="mr-2 inline h-4 w-4" />{status}
          </div>
        </div>
        <section className="grid gap-4 md:grid-cols-4">
          <StatCard label="Cards Owned" value={inventory.length} icon={Gem} />
          <StatCard label="Wishlist" value={user.wishlist?.length || 0} icon={Heart} />
          <StatCard label="Coins" value={wallet.coins || 0} icon={Coins} />
          <StatCard label="Quest Points" value={user.questState?.totalPoints || user.stats?.questPoints || 0} icon={Trophy} />
        </section>
        <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.82fr]">
          <div className="glass rounded-lg p-5">
            <h2 className="text-xl font-black">Favorite cards</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {inventory.slice(0, 6).map((copy) => <CardTile key={copy.code} copy={copy} card={cards[copy.cardId]} wished={user.wishlist?.includes(copy.cardId)} count={data?.wishlistLeaderboard?.[copy.cardId]} />)}
              {!inventory.length ? <div className="col-span-full rounded-lg border border-dashed border-white/15 p-8 text-white/56">No public inventory copies found yet.</div> : null}
            </div>
          </div>
          <div className="grid gap-4">
            <Panel title="Cooldowns" icon={Timer} rows={[
              ["Drop", fromNow(Number(user.lastDropAt || 0) + 30 * 60 * 1000)],
              ["Claim", fromNow(Number(user.lastClaimAt || 0) + 30 * 60 * 1000)],
              ["Vote reminder", user.cooldownReminders?.topggvote ? fromNow(user.cooldownReminders.topggvote.dueAt) : "Not armed"]
            ]} />
            <Panel title="Guild" icon={Users} rows={[
              ["Name", data?.guild?.name || "No guild"],
              ["Members", fullNumber(data?.guild?.memberIds?.length || 0)],
              ["Rank", data?.guild ? "Active member" : "Unranked"]
            ]} />
            <Panel title="Security" icon={Shield} rows={[
              ["Status", status],
              ["Score", data?.security?.suspicionScore ?? 0],
              ["Reason", data?.security?.reason || "Clear"]
            ]} />
          </div>
        </section>
      </RequireLogin>
    </Page>
  );
}

function Panel({ title, icon: Icon, rows }) {
  return (
    <div className="glass rounded-lg p-5">
      <h2 className="flex items-center gap-2 text-lg font-black"><Icon className="h-5 w-5 text-cyan" />{title}</h2>
      <div className="mt-4 grid gap-3">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-4 rounded-lg bg-white/5 px-3 py-2 text-sm">
            <span className="text-white/54">{label}</span>
            <span className="text-right font-bold">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
