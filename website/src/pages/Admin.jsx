import { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  Ban,
  Coins,
  Database,
  Gift,
  ListRestart,
  Lock,
  Plus,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  UserCog
} from "lucide-react";
import Button from "../components/Button.jsx";
import RequireLogin from "../components/RequireLogin.jsx";
import { fullNumber } from "../lib/format.js";
import { useAuthStore } from "../store/authStore.js";
import {
  addAllWishlist,
  deleteCard,
  findUser,
  getAdminIds,
  getAdminOverview,
  giveCardCopy,
  isAdminIdentity,
  rawDatabaseWrite,
  rebuildWishlistLeaderboard,
  removeCardCopy,
  resetUserField,
  saveCard,
  setAccountStatus,
  setAdminUser,
  setBotBan,
  setChannelCommandDisabled,
  setCommandDisabled,
  updateWallet
} from "../lib/adminActions.js";

const emptyCard = { id: "", name: "", series: "", imageUrl: "", style: "azure", active: true };
const commands = [
  "accountguard", "addallwl", "addcard", "botban", "cardpool", "cardupdates", "channelcommand",
  "clearinventory", "commandcontrol", "currencyadmin", "deletecard", "editcard", "givecard",
  "givecopy", "manageinventory", "prefix", "recordvote", "reloadcommand", "resetcooldown",
  "resetprofile", "resetwallet", "series", "seriescms", "setactive", "shopadmin"
];

function Field({ label, children }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-white/64">
      <span>{label}</span>
      {children}
    </label>
  );
}

function Input(props) {
  return <input {...props} className={`rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-cyan/60 ${props.className || ""}`} />;
}

function Select(props) {
  return <select {...props} className={`rounded-lg border border-white/10 bg-ink px-3 py-2 text-white outline-none focus:border-cyan/60 ${props.className || ""}`} />;
}

function Textarea(props) {
  return <textarea {...props} className={`min-h-32 rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-mono text-sm text-white outline-none focus:border-cyan/60 ${props.className || ""}`} />;
}

function Panel({ title, icon: Icon, children }) {
  return (
    <section className="rounded-lg border border-white/10 bg-panel/82 p-5 shadow-card">
      <div className="mb-4 flex items-center gap-2">
        <Icon className="h-5 w-5 text-cyan" />
        <h2 className="text-xl font-black">{title}</h2>
      </div>
      {children}
    </section>
  );
}

export default function Admin() {
  return (
    <RequireLogin>
      <AdminInner />
    </RequireLogin>
  );
}

function AdminInner() {
  const { identity } = useAuthStore();
  const [allowed, setAllowed] = useState(null);
  const [overview, setOverview] = useState(null);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [adminIds, setAdminIds] = useState([]);
  const [cardForm, setCardForm] = useState(emptyCard);
  const [userId, setUserId] = useState("");
  const [user, setUser] = useState(null);
  const [wallet, setWallet] = useState({ action: "give", currency: "coins", amount: 0 });
  const [inventory, setInventory] = useState({ cardId: "", amount: 1, code: "" });
  const [access, setAccess] = useState({ userId: "", reason: "", status: "verified" });
  const [command, setCommand] = useState({ name: "drop", disabled: true, guildId: "", channelId: "" });
  const [raw, setRaw] = useState({ path: "meta/announcement", mode: "set", json: "{\n  \"message\": \"\"\n}" });

  async function load() {
    setBusy(true);
    try {
      const isAllowed = await isAdminIdentity(identity);
      setAllowed(isAllowed);
      if (isAllowed) {
        const [nextOverview, nextAdminIds] = await Promise.all([getAdminOverview(), getAdminIds()]);
        setOverview(nextOverview);
        setAdminIds(nextAdminIds);
      }
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => { load(); }, [identity?.discordId]);

  const stats = useMemo(() => {
    return {
      players: Object.keys(overview?.users || {}).length,
      cards: Object.keys(overview?.cards || {}).length,
      copies: Object.keys(overview?.codes || {}).length,
      bans: Object.keys(overview?.meta?.botBans || {}).length
    };
  }, [overview]);

  async function run(label, action) {
    setBusy(true);
    setNotice("");
    try {
      const result = await action();
      setNotice(result || `${label} complete.`);
      await load();
      if (userId) setUser(await findUser(userId));
    } catch (error) {
      setNotice(error.message || `${label} failed.`);
    } finally {
      setBusy(false);
    }
  }

  if (allowed === null) {
    return <div className="mx-auto max-w-7xl px-4 py-16 text-white/64">Checking admin access...</div>;
  }

  if (!allowed) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <div className="rounded-lg border border-rose/30 bg-rose/10 p-8 text-center">
          <Lock className="mx-auto mb-4 h-8 w-8 text-rose" />
          <h1 className="text-3xl font-black">Admin access required</h1>
          <p className="mt-3 text-white/64">This page is only available to Discord IDs listed in `meta/adminUserIds`.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col justify-between gap-4 border-b border-white/10 pb-6 lg:flex-row lg:items-end">
        <div>
          <div className="text-sm font-bold uppercase tracking-[0.24em] text-cyan">Restricted</div>
          <h1 className="mt-2 text-4xl font-black">Admin Panel</h1>
          <p className="mt-2 max-w-3xl text-white/58">Manage cards, players, inventory, currency, access, commands, and raw bot data from the website.</p>
        </div>
        <Button onClick={load} icon={RefreshCw}>{busy ? "Working..." : "Refresh"}</Button>
      </div>

      {notice ? <div className="mb-6 rounded-lg border border-cyan/25 bg-cyan/10 px-4 py-3 text-sm font-semibold text-cyan">{notice}</div> : null}

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(stats).map(([label, value]) => (
          <div key={label} className="rounded-lg border border-white/10 bg-white/5 p-4">
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-white/40">{label}</div>
            <div className="mt-1 text-2xl font-black">{fullNumber(value)}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Cards" icon={BadgeCheck}>
          <div className="grid gap-3">
            <Field label="Card ID">
              <Input placeholder="Leave blank for new card" value={cardForm.id} onChange={(event) => setCardForm({ ...cardForm, id: event.target.value })} />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Name">
                <Input value={cardForm.name} onChange={(event) => setCardForm({ ...cardForm, name: event.target.value })} />
              </Field>
              <Field label="Series">
                <Input value={cardForm.series} onChange={(event) => setCardForm({ ...cardForm, series: event.target.value })} />
              </Field>
            </div>
            <Field label="Image URL">
              <Input value={cardForm.imageUrl} onChange={(event) => setCardForm({ ...cardForm, imageUrl: event.target.value })} />
            </Field>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Outline">
                <Select value={cardForm.style} onChange={(event) => setCardForm({ ...cardForm, style: event.target.value })}>
                  <option value="azure">Azure</option>
                  <option value="violet">Violet</option>
                  <option value="gold">Gold</option>
                </Select>
              </Field>
              <label className="flex items-end gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-semibold text-white/70">
                <input type="checkbox" checked={cardForm.active} onChange={(event) => setCardForm({ ...cardForm, active: event.target.checked })} />
                Active
              </label>
              <Button icon={Save} onClick={() => run("Save card", async () => `Saved card #${(await saveCard(identity, cardForm)).id}.`)}>Save</Button>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" icon={Search} onClick={() => {
                const card = overview?.cards?.[cardForm.id];
                if (card) setCardForm({ id: card.id, name: card.name || "", series: card.series || "", imageUrl: card.imageUrl || "", style: card.style || card.class || "azure", active: card.active !== false });
              }}>Load ID</Button>
              <Button variant="danger" icon={Trash2} onClick={() => run("Delete card", async () => { await deleteCard(identity, cardForm.id); return "Card deleted and references cleaned."; })}>Delete</Button>
            </div>
          </div>
        </Panel>

        <Panel title="Player Tools" icon={UserCog}>
          <div className="grid gap-3">
            <div className="flex gap-2">
              <Input placeholder="Discord user ID" value={userId} onChange={(event) => setUserId(event.target.value)} className="flex-1" />
              <Button icon={Search} onClick={() => run("Find user", async () => { setUser(await findUser(userId)); return "User loaded."; })}>Find</Button>
            </div>
            {user ? <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-white/70">{user.username} | {user.inventory.length} cards | {user.wishlist.length} wishlist</div> : null}
            <div className="grid gap-3 sm:grid-cols-4">
              <Select value={wallet.action} onChange={(event) => setWallet({ ...wallet, action: event.target.value })}>
                <option value="give">Give</option>
                <option value="take">Take</option>
                <option value="set">Set</option>
              </Select>
              <Select value={wallet.currency} onChange={(event) => setWallet({ ...wallet, currency: event.target.value })}>
                {["coins", "gems", "shards", "claims", "drops"].map((key) => <option key={key} value={key}>{key}</option>)}
              </Select>
              <Input type="number" min="0" value={wallet.amount} onChange={(event) => setWallet({ ...wallet, amount: event.target.value })} />
              <Button icon={Coins} onClick={() => run("Wallet update", async () => `Balance is now ${await updateWallet(identity, userId, wallet.currency, wallet.action, wallet.amount)}.`)}>Apply</Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Button variant="ghost" icon={ListRestart} onClick={() => run("Reset wallet", async () => { await resetUserField(identity, userId, "wallet"); return "Wallet reset."; })}>Reset Wallet</Button>
              <Button variant="ghost" icon={ListRestart} onClick={() => run("Reset cooldown", async () => { await resetUserField(identity, userId, "cooldown"); return "Cooldown reset."; })}>Cooldown</Button>
              <Button variant="ghost" icon={ListRestart} onClick={() => run("Reset profile", async () => { await resetUserField(identity, userId, "profile"); return "Profile fields reset."; })}>Profile</Button>
            </div>
          </div>
        </Panel>

        <Panel title="Inventory And Wishlist" icon={Gift}>
          <div className="grid gap-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Card ID">
                <Input value={inventory.cardId} onChange={(event) => setInventory({ ...inventory, cardId: event.target.value })} />
              </Field>
              <Field label="Amount">
                <Input type="number" min="1" max="20" value={inventory.amount} onChange={(event) => setInventory({ ...inventory, amount: event.target.value })} />
              </Field>
              <Button icon={Plus} onClick={() => run("Give card", async () => `Gave ${(await giveCardCopy(identity, userId, inventory.cardId, inventory.amount)).length} copies.`)}>Give</Button>
            </div>
            <div className="flex gap-2">
              <Input placeholder="Copy code to remove" value={inventory.code} onChange={(event) => setInventory({ ...inventory, code: event.target.value })} className="flex-1" />
              <Button variant="danger" icon={Trash2} onClick={() => run("Remove copy", async () => { await removeCardCopy(identity, userId, inventory.code); return "Copy removed."; })}>Remove</Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Button variant="ghost" icon={Plus} onClick={() => run("Add all wishlist", async () => { await addAllWishlist(identity, userId); return "All cards added to wishlist."; })}>Add All WL</Button>
              <Button variant="ghost" icon={RefreshCw} onClick={() => run("Rebuild WL", async () => { await rebuildWishlistLeaderboard(identity); return "Wishlist leaderboard rebuilt."; })}>Rebuild WL</Button>
            </div>
          </div>
        </Panel>

        <Panel title="Access" icon={ShieldCheck}>
          <div className="grid gap-3">
            <Field label="Target User ID">
              <Input value={access.userId} onChange={(event) => setAccess({ ...access, userId: event.target.value })} />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Button icon={ShieldCheck} onClick={() => run("Grant admin", async () => { await setAdminUser(identity, access.userId, true); return "Admin access granted."; })}>Grant Admin</Button>
              <Button variant="danger" icon={Lock} onClick={() => run("Revoke admin", async () => { await setAdminUser(identity, access.userId, false); return "Admin access revoked."; })}>Revoke</Button>
            </div>
            <Field label="Reason">
              <Input value={access.reason} onChange={(event) => setAccess({ ...access, reason: event.target.value })} />
            </Field>
            <div className="grid gap-3 sm:grid-cols-3">
              <Select value={access.status} onChange={(event) => setAccess({ ...access, status: event.target.value })}>
                <option value="verified">Verified</option>
                <option value="quarantined">Quarantined</option>
                <option value="blocked">Blocked</option>
                <option value="unverified">Unverified</option>
              </Select>
              <Button icon={BadgeCheck} onClick={() => run("Account status", async () => { await setAccountStatus(identity, access.userId, access.status, access.reason); return "Account status updated."; })}>Set Status</Button>
              <Button variant="danger" icon={Ban} onClick={() => run("Bot ban", async () => { await setBotBan(identity, access.userId, true, access.reason); return "User bot-banned."; })}>Bot Ban</Button>
            </div>
            <Button variant="ghost" icon={Ban} onClick={() => run("Bot unban", async () => { await setBotBan(identity, access.userId, false); return "User unbanned."; })}>Remove Bot Ban</Button>
            <div className="rounded-lg bg-white/5 p-3 text-xs text-white/46">Admins: {adminIds.join(", ") || "none"}</div>
          </div>
        </Panel>

        <Panel title="Commands" icon={SlidersHorizontal}>
          <div className="grid gap-3">
            <Field label="Command">
              <Select value={command.name} onChange={(event) => setCommand({ ...command, name: event.target.value })}>
                {commands.map((name) => <option key={name} value={name}>{name}</option>)}
              </Select>
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Button variant="danger" icon={Lock} onClick={() => run("Disable command", async () => { await setCommandDisabled(identity, command.name, true); return "Command disabled globally."; })}>Disable</Button>
              <Button icon={BadgeCheck} onClick={() => run("Enable command", async () => { await setCommandDisabled(identity, command.name, false); return "Command enabled globally."; })}>Enable</Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input placeholder="Guild ID" value={command.guildId} onChange={(event) => setCommand({ ...command, guildId: event.target.value })} />
              <Input placeholder="Channel ID" value={command.channelId} onChange={(event) => setCommand({ ...command, channelId: event.target.value })} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Button variant="danger" icon={Lock} onClick={() => run("Disable channel command", async () => { await setChannelCommandDisabled(identity, command.guildId, command.channelId, command.name, true); return "Command disabled in channel."; })}>Disable In Channel</Button>
              <Button variant="ghost" icon={BadgeCheck} onClick={() => run("Enable channel command", async () => { await setChannelCommandDisabled(identity, command.guildId, command.channelId, command.name, false); return "Command enabled in channel."; })}>Enable In Channel</Button>
            </div>
          </div>
        </Panel>

        <Panel title="Raw Database" icon={Database}>
          <div className="grid gap-3">
            <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
              <Input placeholder="path/inside/botData" value={raw.path} onChange={(event) => setRaw({ ...raw, path: event.target.value })} />
              <Select value={raw.mode} onChange={(event) => setRaw({ ...raw, mode: event.target.value })}>
                <option value="set">Set</option>
                <option value="update">Update</option>
                <option value="delete">Delete</option>
              </Select>
            </div>
            <Textarea value={raw.json} onChange={(event) => setRaw({ ...raw, json: event.target.value })} disabled={raw.mode === "delete"} />
            <Button variant={raw.mode === "delete" ? "danger" : "ghost"} icon={Database} onClick={() => run("Raw write", async () => { await rawDatabaseWrite(identity, raw.path, raw.mode, raw.json); return "Raw database action complete."; })}>Apply Raw Action</Button>
          </div>
        </Panel>
      </div>
    </div>
  );
}
