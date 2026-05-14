import { AnimatePresence } from "framer-motion";
import { Route, Routes, useLocation } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Verify from "./pages/Verify.jsx";
import PublicProfile from "./pages/PublicProfile.jsx";
import Collection from "./pages/Collection.jsx";
import Wishlist from "./pages/Wishlist.jsx";
import Guilds from "./pages/Guilds.jsx";
import Invite from "./pages/Invite.jsx";
import Support from "./pages/Support.jsx";
import Admin from "./pages/Admin.jsx";
import NotFound from "./pages/NotFound.jsx";
import { useAuthBootstrap } from "./store/authStore.js";

export default function App() {
  const location = useLocation();
  useAuthBootstrap();

  return (
    <AppShell>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/user/:id" element={<PublicProfile />} />
          <Route path="/collection" element={<Collection />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/guilds" element={<Guilds />} />
          <Route path="/invite" element={<Invite />} />
          <Route path="/support" element={<Support />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AnimatePresence>
    </AppShell>
  );
}
