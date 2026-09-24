import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DashboardShell, organizerNav } from "@/components/bticket/DashboardShell";
import { EmptyState, Loader, RequireRole } from "@/components/bticket/RequireRole";
import { StatusChip } from "@/components/bticket/StatusChip";
import { useAuth } from "@/hooks/useAuth";
import { getWallet, listWithdrawals } from "@/lib/bticket";
import { formatBIF, formatTimestamp } from "@/lib/format";
import type { WalletDoc, WithdrawalDoc } from "@/lib/types";

export const Route = createFileRoute("/organisateur/wallet")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Mon wallet — bTicket Burundi" },
      { name: "description", content: "Solde disponible, revenus cumulés et retraits de votre compte organisateur." },
      { property: "og:title", content: "Mon wallet — bTicket Burundi" },
      { property: "og:description", content: "Gérez vos revenus et demandez un retrait en quelques secondes." },
    ],
  }),
  component: () => (
    <RequireRole role="organizer" loginPath="/organisateur/connexion">
      <Wallet />
    </RequireRole>
  ),
});

function Wallet() {
  const { profile } = useAuth();
  const [wallet, setWallet] = useState<WalletDoc | null>(null);
  const [history, setHistory] = useState<WithdrawalDoc[] | null>(null);

  useEffect(() => {
    if (!profile) return;
    getWallet(profile.id).then(setWallet);
    listWithdrawals(profile.id).then(setHistory);
  }, [profile]);

  return (
    <DashboardShell title="Mon wallet" nav={organizerNav}>
      <div className="rounded-3xl bg-night p-6 text-lavender shadow-elevated">
        <p className="text-xs font-bold uppercase tracking-widest text-lavender/70">Solde disponible</p>
        <p className="mt-1 text-3xl font-extrabold text-gold">{formatBIF(wallet?.balance ?? 0)}</p>
        <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-lavender/70">Revenus nets</p>
            <p className="font-extrabold">{formatBIF(wallet?.totalEarned ?? 0)}</p>
          </div>
          <div>
            <p className="text-lavender/70">Déjà retiré</p>
            <p className="font-extrabold">{formatBIF(wallet?.totalWithdrawn ?? 0)}</p>
          </div>
        </div>
        <Link
          to="/organisateur/retrait"
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-gold py-3.5 text-sm font-extrabold text-night"
        >
          <span className="material-symbols-outlined text-[18px]">payments</span>
          Demander un retrait
        </Link>
      </div>

      <h2 className="mt-8 mb-3 text-base font-extrabold text-on-surface">Historique des retraits</h2>
      {!history ? (
        <Loader />
      ) : history.length === 0 ? (
        <EmptyState icon="savings" title="Aucun retrait" hint="Vos demandes de retrait apparaîtront ici." />
      ) : (
        <div className="space-y-3">
          {history.map((w) => (
            <div key={w.id} className="flex items-center justify-between rounded-2xl bg-surface-container-lowest p-4 shadow-soft">
              <div>
                <p className="font-extrabold text-on-surface">{formatBIF(w.amount)}</p>
                <p className="text-xs text-on-surface-variant">
                  {w.method} · {w.accountNumber} · {formatTimestamp(w.createdAt)}
                </p>
              </div>
              <StatusChip status={w.status} />
            </div>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
