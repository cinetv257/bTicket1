import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { adminNav, DashboardShell } from "@/components/bticket/DashboardShell";
import { EmptyState, Loader, RequireRole } from "@/components/bticket/RequireRole";
import { StatusChip } from "@/components/bticket/StatusChip";
import { listUsers, updateUserStatus } from "@/lib/bticket";
import type { AppUser } from "@/lib/types";

export const Route = createFileRoute("/admin/organisateurs")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Validation des organisateurs — bTicket Burundi" },
      { name: "description", content: "Approuvez, refusez ou suspendez les comptes organisateurs de la plateforme." },
      { property: "og:title", content: "Validation des organisateurs — bTicket Burundi" },
      { property: "og:description", content: "Contrôle qualité des organisateurs bTicket." },
    ],
  }),
  component: () => (
    <RequireRole role="admin" loginPath="/admin/connexion">
      <Organizers />
    </RequireRole>
  ),
});

function Organizers() {
  const [users, setUsers] = useState<AppUser[] | null>(null);
  const reload = useCallback(() => listUsers("organizer").then(setUsers), []);
  useEffect(() => {
    reload();
  }, [reload]);

  async function setStatus(u: AppUser, status: AppUser["status"]) {
    await updateUserStatus(u.id, status);
    toast.success("Statut mis à jour");
    reload();
  }

  return (
    <DashboardShell title="Organisateurs" nav={adminNav}>
      {!users ? (
        <Loader />
      ) : users.length === 0 ? (
        <EmptyState icon="verified_user" title="Aucun organisateur inscrit" />
      ) : (
        <div className="space-y-3">
          {users.map((u) => (
            <div key={u.id} className="rounded-2xl bg-surface-container-lowest p-4 shadow-soft">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-extrabold text-on-surface">{u.organizationName || u.fullName}</p>
                  <p className="truncate text-xs text-on-surface-variant">
                    {u.fullName} · {u.email} · {u.phone}
                  </p>
                </div>
                <StatusChip status={u.status} />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {u.status !== "approved" ? (
                  <button
                    onClick={() => setStatus(u, "approved")}
                    className="rounded-full bg-primary px-4 py-2 text-xs font-extrabold text-primary-foreground"
                  >
                    Approuver
                  </button>
                ) : null}
                {u.status === "pending" ? (
                  <button
                    onClick={() => setStatus(u, "rejected")}
                    className="rounded-full bg-error-container px-4 py-2 text-xs font-extrabold text-destructive"
                  >
                    Refuser
                  </button>
                ) : null}
                {u.status === "approved" ? (
                  <button
                    onClick={() => setStatus(u, "suspended")}
                    className="rounded-full bg-surface-container-high px-4 py-2 text-xs font-extrabold text-on-surface"
                  >
                    Suspendre
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
