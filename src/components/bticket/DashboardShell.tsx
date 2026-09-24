import { Link, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Logo } from "./Logo";

export interface NavItem {
  to: string;
  icon: string;
  label: string;
}

export const organizerNav: NavItem[] = [
  { to: "/organisateur", icon: "dashboard", label: "Tableau" },
  { to: "/organisateur/evenements", icon: "event", label: "Événements" },
  { to: "/organisateur/ventes", icon: "receipt_long", label: "Ventes" },
  { to: "/organisateur/wallet", icon: "account_balance_wallet", label: "Wallet" },
  { to: "/organisateur/agents", icon: "badge", label: "Agents" },
];

export const adminNav: NavItem[] = [
  { to: "/admin", icon: "dashboard", label: "Tableau" },
  { to: "/admin/organisateurs", icon: "verified_user", label: "Organisateurs" },
  { to: "/admin/evenements", icon: "event_available", label: "Événements" },
  { to: "/admin/paiements", icon: "payments", label: "Paiements" },
  { to: "/admin/retraits", icon: "savings", label: "Retraits" },
];

export function DashboardShell({
  title,
  nav,
  children,
  action,
}: {
  title: string;
  nav: NavItem[];
  children: ReactNode;
  action?: ReactNode;
}) {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-surface">
      <header className="fixed top-0 z-50 w-full border-b border-outline-variant/40 bg-surface/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-2 px-4">
          <div className="flex min-w-0 items-center gap-3">
            <Link to="/"><Logo /></Link>
            <span className="hidden truncate text-sm font-semibold text-on-surface-variant sm:inline">{title}</span>
          </div>
          <div className="flex items-center gap-2">
            {action}
            <Link
              to="/"
              aria-label="Accueil public"
              className="flex h-10 items-center gap-1 rounded-full bg-surface-container-high px-3 text-xs font-bold text-on-surface-variant hover:bg-surface-container"
            >
              <span className="material-symbols-outlined text-[18px]">home</span>
              <span className="hidden sm:inline">Accueil</span>
            </Link>
            <span className="hidden max-w-[10rem] truncate rounded-full bg-surface-container-high px-3 py-1.5 text-xs font-semibold text-on-surface-variant md:inline">
              {profile?.organizationName || profile?.fullName || profile?.email}
            </span>
            <button
              aria-label="Déconnexion"
              onClick={async () => {
                await logout();
                navigate({ to: "/", replace: true });
              }}
              className="flex h-10 w-10 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 pt-20 pb-28">
        <h1 className="mb-4 text-2xl font-extrabold tracking-tight text-on-surface">{title}</h1>
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-outline-variant/40 bg-surface/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-stretch justify-around px-1 pb-[env(safe-area-inset-bottom,0px)]">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: true }}
              className="flex flex-1 flex-col items-center gap-0.5 py-2.5 text-on-surface-variant"
              activeProps={{ className: "text-primary" }}
            >
              <span className="material-symbols-outlined text-[21px]">{item.icon}</span>
              <span className="text-[10.5px] font-semibold">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
