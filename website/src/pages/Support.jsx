import { MessageCircle } from "lucide-react";
import Page from "../components/Page.jsx";
import Button from "../components/Button.jsx";

export default function Support() {
  return (
    <Page>
      <div className="glass mx-auto max-w-2xl rounded-lg p-8 text-center">
        <MessageCircle className="mx-auto h-14 w-14 text-cyan" />
        <h1 className="mt-5 text-4xl font-black">Support Server</h1>
        <p className="mt-3 text-white/62">Join the Aron support server for updates, account help, card announcements, and community events.</p>
        <a href={import.meta.env.VITE_SUPPORT_SERVER_URL || "#"}><Button className="mt-6" icon={MessageCircle}>Open Support Server</Button></a>
      </div>
    </Page>
  );
}
