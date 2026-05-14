import { LogIn, LogOut, Menu, Sparkles, ShieldCheck, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuthStore } from "../store/authStore.js";
import { isAdminIdentity } from "../lib/adminActions.js";
import Button from "./Button.jsx";

const nav = [
  ["Dashboard", "/dashboard"],
  ["Collection", "/collection"],
  ["Wishlist", "/wishlist"],
  ["Guilds", "/guilds"],
  ["Verify", "/verify"]
];

export default function AppShell({ children }) {
  const [open, setOpen] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const { identity, user, login, logout, loading, error } = useAuthStore();

  useEffect(() => {
    let alive = true;
    if (!identity?.discordId) {
      setShowAdmin(false);
      return () => { alive = false; };
    }
    isAdminIdentity(identity)
      .then((allowed) => { if (alive) setShowAdmin(Boolean(allowed)); })
      .catch(() => { if (alive) setShowAdmin(false); });
    return () => { alive = false; };
  }, [identity?.discordId]);

  return (
    <div className="min-h-screen overflow-hidden">
      <div className="particle-field pointer-events-none fixed inset-x-0 top-0 h-[520px] opacity-60" />
      <header className="sticky top-0 z-40 border-b border-white/10 bg-ink/72 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg border border-cyan/40 bg-cyan/10 shadow-glow">
              <Sparkles className="h-5 w-5 text-cyan" />
            </div>
            <div>
              <div className="text-lg font-black tracking-wide">Aron</div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan/80">Collection Nexus</div>
            </div>
          </Link>
          <nav className="hidden items-center gap-1 lg:flex">
            {nav.map(([label, path]) => (
              <NavLink key={path} to={path} className={({ isActive }) => `rounded-lg px-4 py-2 text-sm font-semibold transition ${isActive ? "bg-white/10 text-white" : "text-white/68 hover:bg-white/5 hover:text-white"}`}>
                {label}
              </NavLink>
            ))}
            {showAdmin ? (
              <NavLink to="/admin" className={({ isActive }) => `rounded-lg px-4 py-2 text-sm font-semibold transition ${isActive ? "bg-white/10 text-white" : "text-white/68 hover:bg-white/5 hover:text-white"}`}>
                Admin
              </NavLink>
            ) : null}
          </nav>
          <div className="hidden items-center gap-3 lg:flex">
            {user ? (
              <>
                <Link to="/dashboard" className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold">
                  <UserRound className="h-4 w-4 text-cyan" />
                  {identity?.username || "Player"}
                </Link>
                <Button variant="ghost" onClick={logout} icon={LogOut}>Logout</Button>
              </>
            ) : (
              <>
                {error ? <div className="max-w-56 text-right text-xs font-semibold text-rose">{error}</div> : null}
                <Button onClick={login} icon={LogIn}>{loading ? "Loading..." : "Login"}</Button>
              </>
            )}
          </div>
          <button className="grid h-10 w-10 place-items-center rounded-lg border border-white/10 bg-white/5 lg:hidden" onClick={() => setOpen((value) => !value)} aria-label="Toggle menu">
            <Menu className="h-5 w-5" />
          </button>
        </div>
        {open ? (
          <div className="border-t border-white/10 px-4 py-3 lg:hidden">
            <div className="grid gap-2">
              {nav.map(([label, path]) => <Link key={path} to={path} onClick={() => setOpen(false)} className="rounded-lg bg-white/5 px-3 py-2 font-semibold">{label}</Link>)}
              {showAdmin ? <Link to="/admin" onClick={() => setOpen(false)} className="rounded-lg bg-white/5 px-3 py-2 font-semibold">Admin</Link> : null}
              <Button onClick={user ? logout : login} icon={user ? LogOut : LogIn}>{user ? "Logout" : loading ? "Loading..." : "Login"}</Button>
              {error ? <div className="rounded-lg border border-rose/30 bg-rose/10 px-3 py-2 text-sm text-rose">{error}</div> : null}
            </div>
          </div>
        ) : null}
      </header>
      <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative z-10">
        {children}
      </motion.main>
      <footer className="relative z-10 border-t border-white/10 px-4 py-8 text-center text-sm text-white/50">
        <ShieldCheck className="mx-auto mb-3 h-5 w-5 text-cyan" />
        Aron uses Firebase client rules, Discord OAuth2 login, and hashed verification artifacts.
      </footer>
    </div>
  );
}
