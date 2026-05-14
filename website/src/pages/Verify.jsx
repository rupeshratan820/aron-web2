import { AlertTriangle, CheckCircle2, ShieldCheck } from "lucide-react";
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
          <h1 className="mt-5 text-3xl font-black">{result ? "Verification complete" : error ? "Verification failed" : "Secure verification"}</h1>
          <p className="mt-3 text-white/62">
            {result ? `Your Aron account is now marked ${result.status}. The bot will read this from Firebase automatically.` : error || (token ? "Checking your one-time token and Discord identity..." : "Run a verify in Discord first, then open the generated one-time link.")}
          </p>
          {result?.notes?.length ? <div className="mt-5 rounded-lg bg-white/5 p-4 text-sm text-white/62">{result.notes.join(", ")}</div> : null}
          {!token ? <Button className="mt-6" icon={ShieldCheck}>Waiting for token</Button> : null}
        </div>
      </RequireLogin>
    </Page>
  );
}
