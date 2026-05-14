import { compactNumber } from "../lib/format.js";

export default function StatCard({ label, value, icon: Icon }) {
  return (
    <div className="glass rounded-lg p-5">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-white/58">{label}</div>
        {Icon ? <Icon className="h-5 w-5 text-cyan" /> : null}
      </div>
      <div className="mt-3 text-3xl font-black">{compactNumber(value)}</div>
    </div>
  );
}
