import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { adminNav, DashboardShell } from "@/components/bticket/DashboardShell";
import { StatCard } from "@/components/bticket/Field";
import { Loader, RequireRole } from "@/components/bticket/RequireRole";
import { listAllEvents, listAllPayments, listUsers, listWithdrawals } from "@/lib/bticket";
import { formatBIF } from "@/lib/format";
import type { AppUser, EventDoc, PaymentDoc, WithdrawalDoc } from "@/lib/types";

export const Route = createFileRoute("/admin/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Tableau de bord admin — bTicket Burundi" },
      { name: "description", content: "Vue d'ensemble de la plateforme bTicket : ventes, commissions et validations." },
      { property: "og:title", content: "Tableau de bord admin — bTicket Burundi" },
      { property: "og:description", content: "Pilotez la billetterie nationale bTicket Burundi." },
    ],
  }),
  component: () => (
    <RequireRole role="admin" loginPath="/admin/connexion">
      <AdminHome />
    </RequireRole>
  ),
});

function AdminHome() {
  const [users, setUsers] = useState<AppUser[] | null>(null);
  const [events, setEvents] = useState<EventDoc[] | null>(null);
  const [payments, setPayments] = useState<PaymentDoc[] | null>(null);
  const [withdrawals, setWithdrawals] = useState<WithdrawalDoc[] | null>(null);

  useEffect(() => {
    listUsers("organizer").then(setUsers);
    listAllEvents().then(setEvents);
    listAllPayments().then(setPayments);
    listWithdrawals().then(setWithdrawals);
  }, []);

  if (!users || !events || !payments || !withdrawals)
    return (
      <DashboardShell title="Tableau de bord" nav={adminNav}>
        <Loader />
      </DashboardShell>
    );

  const gross = payments.reduce((s, p) => s + p.amount, 0);
  const commission = payments.reduce((s, p) => s + p.commission, 0);
  const tickets = payments.reduce((s, p) => s + p.quantity, 0);

  return (
    <DashboardShell title="Tableau de bord" nav={adminNav}>
      <div className="rounded-3xl bg-night p-6 text-lavender shadow-elevated">
        <p className="text-xs font-bold uppercase tracking-widest text-lavender/70">Commission bTicket (2%)</p>
        <p className="mt-1 text-3xl font-extrabold text-gold">{formatBIF(commission)}</p>
        <p className="mt-2 text-sm text-lavender/70">Volume total encaissé : {formatBIF(gross)}</p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon="confirmation_number" label="Tickets vendus" value={tickets} />
        <StatCard icon="event" label="Événements" value={events.length} tone="night" />
        <StatCard icon="verified_user" label="Organisateurs" value={users.length} />
        <StatCard
          icon="pending_actions"
          label="À valider"
          value={
            users.filter((u) => u.status === "pending").length +
            events.filter((e) => e.status === "pending").length +
            withdrawals.filter((w) => w.status === "pending").length
          }
          tone="gold"
        />
      </div>

      <div className="mt-6 space-y-3">
        <Row label="Organisateurs en attente" value={users.filter((u) => u.status === "pending").length} icon="verified_user" />
        <Row label="Événements en attente" value={events.filter((e) => e.status === "pending").length} icon="event_available" />
        <Row label="Retraits en attente" value={withdrawals.filter((w) => w.status === "pending").length} icon="savings" />
      </div>
    </DashboardShell>
  );
}

function Row({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-surface-container-lowest p-4 shadow-soft">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
        <span className="material-symbols-outlined text-[20px]">{icon}</span>
      </span>
      <p className="flex-1 font-semibold text-on-surface">{label}</p>
      <span className="rounded-full bg-surface-container-high px-3 py-1 text-sm font-extrabold text-on-surface">{value}</span>
    </div>
  );
}
