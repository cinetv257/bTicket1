import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { adminNav, DashboardShell } from "@/components/bticket/DashboardShell";
import { EmptyState, Loader, RequireRole } from "@/components/bticket/RequireRole";
import { StatusChip } from "@/components/bticket/StatusChip";
import { listWithdrawals, resolveWithdrawal } from "@/lib/bticket";
import { formatBIF, formatTimestamp } from "@/lib/format";
import type { WithdrawalDoc } from "@/lib/types";

export const Route = createFileRoute("/admin/retraits")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Retraits organisateurs — bTicket Burundi" },
      { name: "description", content: "Traitez les demandes de retrait des organisateurs bTicket Burundi." },
      { property: "og:title", content: "Retraits organisateurs — bTicket Burundi" },
      { property: "og:description", content: "Validation et suivi des versements aux organisateurs." },
    ],
  }),
  component: () => (
    <RequireRole role="admin" loginPath="/admin/connexion">
      <Withdrawals />
    </RequireRole>
  ),
});

function Withdrawals() {
  const [items, setItems] = useState<WithdrawalDoc[] | null>(null);
  const reload = useCallback(() => listWithdrawals().then(setItems), []);
  useEffect(() => {
    reload();
  }, [reload]);

  async function resolve(w: WithdrawalDoc, status: "paid" | "rejected") {
    try {
      await resolveWithdrawal(w, status);
      toast.success(status === "paid" ? "Retrait marqué comme payé" : "Retrait refusé, solde recrédité");
      reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Opération impossible");
    }
  }

  return (
    <DashboardShell title="Retraits" nav={adminNav}>
      {!items ? (
        <Loader />
      ) : items.length === 0 ? (
        <EmptyState icon="savings" title="Aucune demande de retrait" />
      ) : (
        <div className="space-y-3">
          {items.map((w) => (
            <div key={w.id} className="rounded-2xl bg-surface-container-lowest p-4 shadow-soft">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-extrabold text-on-surface">{w.organizerName}</p>
                  <p className="truncate text-xs text-on-surface-variant">
                    {w.method} · {w.accountNumber}
                    {w.accountName ? ` · ${w.accountName}` : ""}
                  </p>
                  <p className="text-xs text-on-surface-variant">{formatTimestamp(w.createdAt)}</p>
                </div>
                <div className="text-right">
                  <p className="font-extrabold text-on-surface">{formatBIF(w.amount)}</p>
                  <div className="mt-1 flex justify-end">
                    <StatusChip status={w.status} />
                  </div>
                </div>
              </div>
              {w.status === "pending" ? (
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => resolve(w, "paid")}
                    className="flex-1 rounded-full bg-primary py-2.5 text-xs font-extrabold text-primary-foreground"
                  >
                    Marquer payé
                  </button>
                  <button
                    onClick={() => resolve(w, "rejected")}
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
