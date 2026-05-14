export default function Button({ children, icon: Icon, variant = "primary", className = "", ...props }) {
  const styles = variant === "danger"
    ? "border-rose/40 bg-rose/15 text-white hover:bg-rose/20"
    : variant === "ghost"
      ? "border-white/10 bg-white/5 text-white hover:bg-white/10"
      : "border-cyan/40 bg-cyan/15 text-white shadow-glow hover:bg-cyan/20";
  return (
    <button className={`inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font800 font-semibold transition ${styles} ${className}`} {...props}>
      {Icon ? <Icon className="h-4 w-4" /> : null}
      {children}
    </button>
  );
}
