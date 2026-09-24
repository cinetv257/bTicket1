import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DashboardShell, organizerNav } from "@/components/bticket/DashboardShell";
import { StatCard } from "@/components/bticket/Field";
import { EmptyState, Loader, RequireRole } from "@/components/bticket/RequireRole";
import { StatusChip } from "@/components/bticket/StatusChip";
import { useAuth } from "@/hooks/useAuth";
import { listOrganizerPayments } from "@/lib/bticket";
import { formatBIF, formatTimestamp } from "@/lib/format";
import type { PaymentDoc } from "@/lib/types";

export const Route = createFileRoute("/organisateur/ventes")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Mes ventes — bTicket Burundi" },
      { name: "description", content: "Historique complet des paiements encaissés sur vos événements bTicket." },
      { property: "og:title", content: "Mes ventes — bTicket Burundi" },
      { property: "og:description", content: "Suivez chaque transaction et la commission bTicket appliquée." },
    ],
  }),
  component: () => (
    <RequireRole role="organizer" loginPath="/organisateur/connexion">
      <Sales />
    </RequireRole>
  ),
});

const METHOD_LABEL: Record<string, string> = {
  lumicash: "Lumicash",
  ecocash: "EcoCash",
  bancobu: "BANCOBU",
  card: "Carte bancaire",
};

function Sales() {
  const { profile } = useAuth();
  const [payments, setPayments] = useState<PaymentDoc[] | null>(null);

  useEffect(() => {
    if (profile) listOrganizerPayments(profile.id).then(setPayments);
  }, [profile]);

  const gross = payments?.reduce((s, p) => s + p.amount, 0) ?? 0;
  const commission = payments?.reduce((s, p) => s + p.commission, 0) ?? 0;

  return (
    <DashboardShell title="Mes ventes" nav={organizerNav}>
      <div className="grid grid-cols-3 gap-3">
        <StatCard icon="receipt_long" label="Transactions" value={payments?.length ?? 0} />
        <StatCard icon="payments" label="Montant brut" value={formatBIF(gross)} tone="night" />
        <StatCard icon="percent" label="Commission 2%" value={formatBIF(commission)} tone="gold" />
      </div>

      <h2 className="mt-8 mb-3 text-base font-extrabold text-on-surface">Transactions</h2>
      {!payments ? (
        <Loader />
      ) : payments.length === 0 ? (
        <EmptyState icon="receipt_long" title="Aucune vente" hint="Les paiements apparaîtront ici dès le premier achat." />
      ) : (
        <div className="space-y-3">
          {payments.map((p) => (
            <div key={p.id} className="rounded-2xl bg-surface-container-lowest p-4 shadow-soft">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-extrabold text-on-surface">{p.buyerName}</p>
                  <p className="text-xs text-on-surface-variant">
                    {p.buyerPhone} · {METHOD_LABEL[p.method] ?? p.method} · {p.reference}
                  </p>
                  <p className="mt-1 truncate text-xs text-on-surface-variant">
                    {p.eventTitle} · {p.quantity} ticket{p.quantity > 1 ? "s" : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-extrabold text-on-surface">{formatBIF(p.amount)}</p>
                  <p className="text-[11px] text-on-surface-variant">net {formatBIF(p.netAmount)}</p>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[11px] text-on-surface-variant">{formatTimestamp(p.createdAt)}</span>
                <StatusChip status={p.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
