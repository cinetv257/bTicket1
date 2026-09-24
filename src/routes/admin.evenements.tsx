import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { adminNav, DashboardShell } from "@/components/bticket/DashboardShell";
import { EmptyState, Loader, RequireRole } from "@/components/bticket/RequireRole";
import { StatusChip } from "@/components/bticket/StatusChip";
import { listAllEvents, updateEvent } from "@/lib/bticket";
import { EventDetails } from "@/components/bticket/AdminEventDetails";
import { formatBIF, formatDateFr } from "@/lib/format";
import type { EventDoc } from "@/lib/types";

export const Route = createFileRoute("/admin/evenements")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Validation des événements — bTicket Burundi" },
      { name: "description", content: "Approuvez ou refusez les événements avant leur mise en vente publique." },
      { property: "og:title", content: "Validation des événements — bTicket Burundi" },
      { property: "og:description", content: "Modération des événements de la plateforme bTicket." },
    ],
  }),
  component: () => (
    <RequireRole role="admin" loginPath="/admin/connexion">
      <AdminEvents />
    </RequireRole>
  ),
});

function AdminEvents() {
  const [events, setEvents] = useState<EventDoc[] | null>(null);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");

  const reload = useCallback(() => listAllEvents().then(setEvents), []);
  useEffect(() => {
    reload();
  }, [reload]);

  const shown = events?.filter((e) => (filter === "all" ? true : e.status === filter)) ?? [];

  async function decide(e: EventDoc, status: "approved" | "rejected") {
    let reason = "";
    if (status === "rejected") {
      reason = prompt("Motif du refus ?") ?? "";
      if (!reason.trim()) return;
    }
    await updateEvent(e.id, status === "rejected" ? { status, rejectionReason: reason.trim() } : { status });
    toast.success(status === "approved" ? "Événement approuvé" : "Événement refusé");
    reload();
  }

  return (
    <DashboardShell title="Événements" nav={adminNav}>
      <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto">
        {(["pending", "approved", "rejected", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-extrabold ${
              filter === f ? "bg-primary text-primary-foreground" : "bg-surface-container-high text-on-surface-variant"
            }`}
          >
            {{ pending: "En attente", approved: "Approuvés", rejected: "Refusés", all: "Tous" }[f]}
          </button>
        ))}
      </div>

      {!events ? (
        <Loader />
      ) : shown.length === 0 ? (
        <EmptyState icon="event_available" title="Aucun événement dans cette catégorie" />
      ) : (
        <div className="space-y-3">
          {shown.map((e) => (
            <div key={e.id} className="overflow-hidden rounded-2xl bg-surface-container-lowest shadow-soft">
              <div className="flex gap-3 p-3">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-surface-variant">
                  {e.imageUrl ? <img src={e.imageUrl} alt="" className="h-full w-full object-cover" /> : null}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate font-extrabold text-on-surface">{e.title}</p>
                    <StatusChip status={e.status} />
                  </div>
                  <p className="truncate text-xs text-on-surface-variant">
                    {e.organizerName} · {formatDateFr(e.date)} · {e.venue}, {e.city}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-primary">
                    {e.ticketsSold ?? 0} vendus · {formatBIF(e.revenue ?? 0)}
                  </p>
                </div>
              </div>
              <EventDetails event={e} />
              {e.status === "pending" ? (
                <div className="flex gap-2 border-t border-outline-variant/40 p-3">
                  <button
                    onClick={() => decide(e, "approved")}
                    className="flex-1 rounded-full bg-primary py-2.5 text-xs font-extrabold text-primary-foreground"
                  >
                    Approuver
                  </button>
                  <button
                    onClick={() => decide(e, "rejected")}
                    className="flex-1 rounded-full bg-error-container py-2.5 text-xs font-extrabold text-destructive"
                  >
                    Refuser
                  </button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
