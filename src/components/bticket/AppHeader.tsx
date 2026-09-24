import { Link, useRouter } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Logo } from "./Logo";

export function AppHeader({
  title,
  back,
  action,
}: {
  title?: string;
  back?: boolean;
  action?: ReactNode;
}) {
  const router = useRouter();
  return (
    <header className="fixed top-0 z-50 w-full border-b border-outline-variant/40 bg-surface/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-3xl items-center justify-between gap-2 px-4">
        <div className="flex min-w-0 items-center gap-2">
          {back ? (
            <button
              aria-label="Retour"
              onClick={() => router.history.back()}
              className="-ml-2 flex h-11 w-11 items-center justify-center rounded-full text-on-surface transition-colors hover:bg-surface-container active:scale-95"
            >
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </button>
          ) : null}
          <Link to="/" className="shrink-0">
            <Logo />
          </Link>
          {title ? (
            <h1 className="truncate text-base font-bold tracking-tight text-on-surface">{title}</h1>
          ) : (
            <span className="hidden items-center gap-1 rounded-full bg-surface-container-high px-2.5 py-1 text-xs font-semibold text-on-surface-variant sm:flex">
              🇧🇮 Burundi
            </span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">{action}</div>
      </div>
    </header>
  );
}

export function Page({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <main className={`mx-auto min-h-screen w-full max-w-3xl px-4 pt-20 pb-24 ${className}`}>{children}</main>
  );
}
