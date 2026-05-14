import { Swords, Users } from "lucide-react";
import { useEffect, useState } from "react";
import Page from "../components/Page.jsx";
import { getGuildsPage } from "../lib/data.js";
import { fullNumber } from "../lib/format.js";

export default function Guilds() {
  const [guilds, setGuilds] = useState({});
  useEffect(() => { getGuildsPage(80).then(setGuilds); }, []);
  return (
    <Page>
      <div className="mb-6">
        <div className="text-sm font-black uppercase tracking-[0.24em] text-cyan"><Swords className="mr-2 inline h-4 w-4" />Guild rankings</div>
        <h1 className="mt-2 text-4xl font-black">Guild hall</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Object.values(guilds).map((guild) => (
          <article key={guild.id} className="glass rounded-lg p-5">
            <div className="h-24 rounded-md bg-gradient-to-r from-cyan/20 via-violet/20 to-rose/20" style={guild.bannerUrl ? { backgroundImage: `url(${guild.bannerUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : null} />
            <h2 className="mt-4 text-2xl font-black">{guild.name}</h2>
            <p className="mt-2 line-clamp-2 text-sm text-white/58">{guild.description || "A competitive Aron guild collecting toward the next ranking surge."}</p>
            <div className="mt-4 flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-sm">
              <span className="text-white/54"><Users className="mr-1 inline h-4 w-4" />Members</span>
              <span className="font-bold">{fullNumber(guild.memberIds?.length || 0)} / {guild.memberLimit || 20}</span>
            </div>
          </article>
        ))}
      </div>
    </Page>
  );
}
