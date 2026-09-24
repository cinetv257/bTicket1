export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2 ${className}`}>
      <span className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-soft">
        <span className="material-symbols-outlined text-[18px]">confirmation_number</span>
      </span>
      <span className="text-lg font-extrabold tracking-tight text-on-surface">
        b<span className="text-primary">Ticket</span>
      </span>
    </span>
  );
}
