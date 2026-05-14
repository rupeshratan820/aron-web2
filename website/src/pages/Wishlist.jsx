import { Heart } from "lucide-react";
import { useEffect, useState } from "react";
import CardTile from "../components/CardTile.jsx";
import Page from "../components/Page.jsx";
import RequireLogin from "../components/RequireLogin.jsx";
import { getWishlistData } from "../lib/data.js";
import { useAuthStore } from "../store/authStore.js";

export default function Wishlist() {
  const { identity } = useAuthStore();
  const [data, setData] = useState(null);
  useEffect(() => { if (identity?.discordId) getWishlistData(identity.discordId).then(setData); }, [identity?.discordId]);
  return (
    <Page>
      <RequireLogin>
        <div className="mb-6">
          <div className="text-sm font-black uppercase tracking-[0.24em] text-cyan"><Heart className="mr-2 inline h-4 w-4" />Wishlist</div>
          <h1 className="mt-2 text-4xl font-black">{data?.wishlistCards?.length || 0} watched cards</h1>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          {(data?.wishlistCards || []).map((card) => <CardTile key={card.id} card={card} wished count={data?.wishlistLeaderboard?.[card.id]} />)}
        </div>
      </RequireLogin>
    </Page>
  );
}
