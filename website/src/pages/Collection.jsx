import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import CardTile from "../components/CardTile.jsx";
import Page from "../components/Page.jsx";
import { getCardsPage } from "../lib/data.js";

export default function Collection() {
  const [cards, setCards] = useState({});
  const [search, setSearch] = useState("");
  useEffect(() => { getCardsPage(120).then(setCards); }, []);
  const shown = useMemo(() => Object.values(cards).filter((card) => `${card.name} ${card.series}`.toLowerCase().includes(search.toLowerCase())).slice(0, 60), [cards, search]);
  return (
    <Page>
      <Header title="Collection viewer" subtitle="Search templates, inspect generations, and browse Aron cards with collectible-grade presentation." search={search} setSearch={setSearch} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        {shown.map((card) => <CardTile key={card.id} card={card} count={0} />)}
      </div>
    </Page>
  );
}

function Header({ title, subtitle, search, setSearch }) {
  return (
    <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <div className="text-sm font-black uppercase tracking-[0.24em] text-cyan">{title}</div>
        <p className="mt-2 max-w-2xl text-white/62">{subtitle}</p>
      </div>
      <label className="flex min-w-72 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
        <Search className="h-4 w-4 text-cyan" />
        <input className="w-full bg-transparent text-sm outline-none placeholder:text-white/35" placeholder="Search card or series" value={search} onChange={(event) => setSearch(event.target.value)} />
      </label>
    </div>
  );
}
