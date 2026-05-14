import { Bot } from "lucide-react";
import Page from "../components/Page.jsx";
import Button from "../components/Button.jsx";

export default function Invite() {
  return <ActionPage title="Invite Aron" text="Add Aron to your Discord server and bring collection drops, quests, guilds, trading, and verification to your community." icon={Bot} href={import.meta.env.VITE_DISCORD_INVITE_URL || "#"} label="Open Discord Invite" />;
}

function ActionPage({ title, text, icon: Icon, href, label }) {
  return (
    <Page>
      <div className="glass mx-auto max-w-2xl rounded-lg p-8 text-center">
        <Icon className="mx-auto h-14 w-14 text-cyan" />
        <h1 className="mt-5 text-4xl font-black">{title}</h1>
        <p className="mt-3 text-white/62">{text}</p>
        <a href={href}><Button className="mt-6" icon={Icon}>{label}</Button></a>
      </div>
    </Page>
  );
}
