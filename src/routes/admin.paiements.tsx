import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { adminNav, DashboardShell } from "@/components/bticket/DashboardShell";
import { StatCard } from "@/components/bticket/Field";
import { EmptyState, Loader, RequireRole } from "@/components/bticket/RequireRole";
import { StatusChip } from "@/components/bticket/StatusChip";
import { listAllPayments } from "@/lib/bticket";
import { formatBIF, formatTimestamp } from "@/lib/format";
import type { PaymentDoc } from "@/lib/types";

export const Route = createFileRoute("/admin/paiements")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Paiements — bTicket Burundi" },
      { name: "description", content: "Toutes les transactions de la plateforme et la commission bTicket encaissée." },
      { property: "og:title", content: "Paiements — bTicket Burundi" },
      { property: "og:description", content: "Suivi financier complet de la billetterie bTicket." },
    ],
  }),
  component: () => (
    <RequireRole role="admin" loginPath="/admin/connexion">
      <Payments />
    </RequireRole>
  ),
});

const METHOD_LABEL: Record<string, string> = {
  lumicash: "Lumicash",
  ecocash: "EcoCash",
  bancobu: "BANCOBU",
  card: "Carte bancaire",
};

function Payments() {
  const [payments, setPayments] = useState<PaymentDoc[] | null>(null);
  useEffect(() => {
    listAllPayments().then(setPayments);
  }, []);

  const gross = payments?.reduce((s, p) => s + p.amount, 0) ?? 0;
  const commission = payments?.reduce((s, p) => s + p.commission, 0) ?? 0;

  return (
    <DashboardShell title="Paiements" nav={adminNav}>
      <div className="grid grid-cols-3 gap-3">
        <StatCard icon="receipt_long" label="Transactions" value={payments?.length ?? 0} />
        <StatCard icon="payments" label="Volume" value={formatBIF(gross)} tone="night" />
        <StatCard icon="percent" label="Commission" value={formatBIF(commission)} tone="gold" />
      </div>

      <div className="mt-6 space-y-3">
        {!payments ? (
          <Loader />
        ) : payments.length === 0 ? (
          <EmptyState icon="payments" title="Aucun paiement enregistré" />
        ) : (
          payments.map((p) => (
            <div key={p.id} className="rounded-2xl bg-surface-container-lowest p-4 shadow-soft">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-extrabold text-on-surface">{p.eventTitle}</p>
                  <p className="truncate text-xs text-on-surface-variant">
                    {p.buyerName} · {p.buyerPhone} · {METHOD_LABEL[p.method] ?? p.method}
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    {p.reference} · {formatTimestamp(p.createdAt)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-extrabold text-on-surface">{formatBIF(p.amount)}</p>
                  <p className="text-[11px] text-tertiary">commission {formatBIF(p.commission)}</p>
                  <div className="mt-1 flex justify-end">
                    <StatusChip status={p.status} />
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </DashboardShell>
  );
}
