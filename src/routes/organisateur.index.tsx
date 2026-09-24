import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DashboardShell, organizerNav } from "@/components/bticket/DashboardShell";
import { StatCard } from "@/components/bticket/Field";
import { EmptyState, Loader, RequireRole } from "@/components/bticket/RequireRole";
import { StatusChip } from "@/components/bticket/StatusChip";
import { useAuth } from "@/hooks/useAuth";
import { getWallet, listOrganizerEvents } from "@/lib/bticket";
import { formatBIF, formatShortDate } from "@/lib/format";
import type { EventDoc, WalletDoc } from "@/lib/types";

export const Route = createFileRoute("/organisateur/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Tableau de bord organisateur — bTicket Burundi" },
      { name: "description", content: "Suivez vos ventes, vos revenus et vos événements bTicket en temps réel." },
      { property: "og:title", content: "Tableau de bord organisateur — bTicket Burundi" },
      { property: "og:description", content: "Vos performances de billetterie en un coup d'œil." },
    ],
  }),
  component: () => (
    <RequireRole role="organizer" loginPath="/organisateur/connexion">
      <OrganizerDashboard />
    </RequireRole>
  ),
});

function OrganizerDashboard() {
  const { profile } = useAuth();
  const [events, setEvents] = useState<EventDoc[] | null>(null);
  const [wallet, setWallet] = useState<WalletDoc | null>(null);

  useEffect(() => {
    if (!profile) return;
    listOrganizerEvents(profile.id).then(setEvents);
    getWallet(profile.id).then(setWallet);
  }, [profile]);

  const sold = events?.reduce((s, e) => s + (e.ticketsSold ?? 0), 0) ?? 0;

  return (
    <DashboardShell
      title="Tableau de bord"
      nav={organizerNav}
      action={
        <Link
          to="/organisateur/nouveau"
          className="rounded-full bg-primary px-4 py-2 text-xs font-extrabold text-primary-foreground"
        >
          + Événement
        </Link>
      }
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon="confirmation_number" label="Tickets vendus" value={sold} />
        <StatCard icon="account_balance_wallet" label="Solde" value={formatBIF(wallet?.balance ?? 0)} tone="gold" />
        <StatCard icon="payments" label="Revenus nets" value={formatBIF(wallet?.totalEarned ?? 0)} />
        <StatCard icon="event" label="Événements" value={events?.length ?? 0} tone="night" />
      </div>

      <h2 className="mt-8 mb-3 text-base font-extrabold text-on-surface">Mes événements récents</h2>
      {!events ? (
        <Loader />
      ) : events.length === 0 ? (
        <EmptyState icon="event" title="Aucun événement" hint="Créez votre premier événement pour commencer à vendre." />
      ) : (
        <div className="space-y-3">
          {events.slice(0, 5).map((e) => (
            <Link
              key={e.id}
              to="/organisateur/evenement/$id"
              params={{ id: e.id }}
              className="flex items-center gap-3 rounded-2xl bg-surface-container-lowest p-3 shadow-soft"
            >
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-surface-variant">
                {e.imageUrl ? <img src={e.imageUrl} alt="" className="h-full w-full object-cover" /> : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-extrabold text-on-surface">{e.title}</p>
                <p className="text-xs text-on-surface-variant">
                  {formatShortDate(e.date)} · {e.ticketsSold ?? 0} vendus · {formatBIF(e.revenue ?? 0)}
                </p>
              </div>
              <StatusChip status={e.status} />
            </Link>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}

