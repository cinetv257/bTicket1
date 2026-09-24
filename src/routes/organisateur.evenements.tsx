import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DashboardShell, organizerNav } from "@/components/bticket/DashboardShell";
import { EmptyState, Loader, RequireRole } from "@/components/bticket/RequireRole";
import { StatusChip } from "@/components/bticket/StatusChip";
import { useAuth } from "@/hooks/useAuth";
import { listOrganizerEvents } from "@/lib/bticket";
import { formatBIF, formatDateFr } from "@/lib/format";
import type { EventDoc } from "@/lib/types";

export const Route = createFileRoute("/organisateur/evenements")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Mes événements — bTicket Burundi" },
      { name: "description", content: "Gérez tous vos événements bTicket : statut, ventes et catégories de tickets." },
      { property: "og:title", content: "Mes événements — bTicket Burundi" },
      { property: "og:description", content: "Toute votre programmation bTicket au même endroit." },
    ],
  }),
  component: () => (
    <RequireRole role="organizer" loginPath="/organisateur/connexion">
      <MyEvents />
    </RequireRole>
  ),
});

function MyEvents() {
  const { profile } = useAuth();
  const [events, setEvents] = useState<EventDoc[] | null>(null);

  useEffect(() => {
    if (profile) listOrganizerEvents(profile.id).then(setEvents);
  }, [profile]);

  return (
    <DashboardShell
      title="Mes événements"
      nav={organizerNav}
      action={
        <Link
          to="/organisateur/nouveau"
          className="rounded-full bg-primary px-4 py-2 text-xs font-extrabold text-primary-foreground"
        >
          + Créer
        </Link>
      }
    >
      {!events ? (
        <Loader />
      ) : events.length === 0 ? (
        <EmptyState icon="event" title="Aucun événement créé" hint="Publiez votre premier événement." />
      ) : (
        <div className="space-y-3">
          {events.map((e) => (
            <Link
              key={e.id}
              to="/organisateur/evenement/$id"
              params={{ id: e.id }}
              className="block overflow-hidden rounded-2xl bg-surface-container-lowest shadow-soft"
            >
              <div className="flex gap-3 p-3">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-surface-variant">
                  {e.imageUrl ? <img src={e.imageUrl} alt="" className="h-full w-full object-cover" /> : null}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate font-extrabold text-on-surface">{e.title}</p>
                    <StatusChip status={e.status} />
                  </div>
                  <p className="text-xs text-on-surface-variant">{formatDateFr(e.date)}</p>
                  <p className="mt-1 text-xs font-semibold text-primary">
                    {e.ticketsSold ?? 0} tickets · {formatBIF(e.revenue ?? 0)}
                  </p>
                  {e.status === "rejected" && e.rejectionReason ? (
                    <p className="mt-1 text-xs text-destructive">Motif : {e.rejectionReason}</p>
                  ) : null}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
