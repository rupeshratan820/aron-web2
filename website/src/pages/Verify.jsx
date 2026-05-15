import { AlertTriangle, CheckCircle2, LockKeyhole, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Button from "../components/Button.jsx";
import Page from "../components/Page.jsx";
import RequireLogin from "../components/RequireLogin.jsx";
import { verifyToken } from "../lib/data.js";
import { useAuthStore } from "../store/authStore.js";

export default function Verify() {
  const [params] = useSearchParams();
  const token = useMemo(() => params.get("token") || params.get("t") || "", [params]);
  const { identity } = useAuthStore();
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!identity || !token || running || result || error) return;
    setRunning(true);
    verifyToken(token, identity).then(setResult).catch((err) => setError(err.message)).finally(() => setRunning(false));
  }, [identity, token, running, result, error]);

  return (
    <Page>
      <RequireLogin>
        <div className="glass mx-auto max-w-2xl rounded-lg p-8 text-center">
          {result ? <CheckCircle2 className="mx-auto h-14 w-14 text-cyan" /> : error ? <AlertTriangle className="mx-auto h-14 w-14 text-rose" /> : <ShieldCheck className="mx-auto h-14 w-14 text-cyan" />}
          <h1 className="mt-5 text-3xl font-black">{result ? "Verification complete" : error ? "Verification failed" : token ? "One-click verification" : "Verification link required"}</h1>
          <p className="mt-3 text-white/62">
            {result ? `Your Aron account is now marked ${result.status}. The bot will read this from Firebase automatically.` : error || (token ? "Checking your one-time token, Discord identity, account age, and device fingerprint..." : "Run /verify in Discord, then press the generated button.")}
          </p>
          <div className="mt-6 grid gap-3 text-left sm:grid-cols-3">
            {["One-time token", "Discord OAuth", "Alt risk scan"].map((label) => (
              <div key={label} className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm font-semibold text-white/64">
                <LockKeyhole className="mb-2 h-4 w-4 text-cyan" />
                {label}
              </div>
            ))}
          </div>
          {result?.notes?.length ? <div className="mt-5 rounded-lg bg-white/5 p-4 text-sm text-white/62">{result.notes.join(", ")}</div> : null}
          {!token ? <Button className="mt-6" icon={ShieldCheck}>Waiting for Discord link</Button> : null}
        </div>
      </RequireLogin>
    </Page>
  );
}
