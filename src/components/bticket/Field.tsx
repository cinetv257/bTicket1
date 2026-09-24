import type { ReactNode } from "react";

export function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  inputMode,
  maxLength = 200,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  inputMode?: "tel" | "text" | "email" | "numeric" | "decimal";
  maxLength?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-on-surface-variant">{label}</span>
      <input
        type={type}
        inputMode={inputMode}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
        className="h-12 w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-4 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary focus:outline-none"
      />
    </label>
  );
}

export function TextArea({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-on-surface-variant">{label}</span>
      <textarea
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value.slice(0, 2000))}
        className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest p-4 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary focus:outline-none"
      />
    </label>
  );
}

export function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-on-surface-variant">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-4 text-sm text-on-surface focus:border-primary focus:outline-none"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

export function StatCard({ icon, label, value, tone = "primary" }: { icon: string; label: string; value: ReactNode; tone?: "primary" | "gold" | "night" }) {
  const toneClass =
    tone === "gold" ? "bg-gold/20 text-tertiary" : tone === "night" ? "bg-night/10 text-night" : "bg-primary/10 text-primary";
  return (
    <div className="rounded-2xl bg-surface-container-lowest p-4 shadow-soft">
      <span className={`mb-2 inline-flex h-9 w-9 items-center justify-center rounded-full ${toneClass}`}>
        <span className="material-symbols-outlined text-[18px]">{icon}</span>
      </span>
      <p className="text-[11px] font-bold uppercase tracking-wide text-on-surface-variant">{label}</p>
      <p className="truncate text-lg font-extrabold text-on-surface">{value}</p>
    </div>
  );
}
