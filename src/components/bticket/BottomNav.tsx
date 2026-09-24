import { Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";

const spaceFor = { admin: "/admin", organizer: "/organisateur", scanner: "/scanner" } as const;

export function BottomNav() {
  const { profile } = useAuth();
  const items: { to: string; icon: string; label: string }[] = [
    { to: "/", icon: "home", label: "Accueil" },
    { to: "/mes-tickets", icon: "confirmation_number", label: "Mes tickets" },
  ];
  if (profile) {
    items.push({ to: spaceFor[profile.role], icon: "space_dashboard", label: "Mon espace" });
  } else {
    items.push(
      { to: "/organisateur/connexion", icon: "storefront", label: "Organisateur" },
      { to: "/scanner/connexion", icon: "qr_code_scanner", label: "Scanner" },
    );
  }
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-outline-variant/40 bg-surface/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-3xl items-stretch justify-around px-2 pb-[env(safe-area-inset-bottom,0px)]">
        {items.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            activeOptions={{ exact: item.to === "/" }}
            className="flex flex-1 flex-col items-center gap-0.5 py-2.5 text-on-surface-variant transition-colors"
            activeProps={{ className: "text-primary" }}
          >
            <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
            <span className="text-[11px] font-semibold">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
