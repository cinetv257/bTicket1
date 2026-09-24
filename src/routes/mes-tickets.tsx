import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppHeader, Page } from "@/components/bticket/AppHeader";
import { BottomNav } from "@/components/bticket/BottomNav";
import { EmptyState } from "@/components/bticket/RequireRole";
import { listTicketsByPhone } from "@/lib/bticket";
import { formatDateFr } from "@/lib/format";
import type { TicketDoc } from "@/lib/types";

export const Route = createFileRoute("/mes-tickets")({
  head: () => ({
    meta: [
      { title: "Mes tickets — bTicket Burundi" },
      { name: "description", content: "Retrouvez tous vos tickets bTicket grâce à votre numéro de téléphone." },
      { property: "og:title", content: "Mes tickets — bTicket Burundi" },
      { property: "og:description", content: "Vos pass numériques, disponibles à tout moment." },
    ],
  }),
  component: MyTickets,
});

function MyTickets() {
  const [phone, setPhone] = useState("");
  const [identity, setIdentity] = useState("");
  const [tickets, setTickets] = useState<TicketDoc[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function search() {
    setLoading(true);
    try {
      setTickets(await listTicketsByPhone(phone.trim(), identity));
    } finally {
      setLoading(false);
    }
  }

  const inputCls =
    "h-12 w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-4 text-sm focus:border-primary focus:outline-none";

  return (
    <>
      <AppHeader title="Mes tickets" />
      <Page>
        <p className="text-sm text-on-surface-variant">
          Pour protéger vos pass, entrez le numéro de téléphone <b>et</b> le nom complet ou l'email utilisés lors de l'achat.
        </p>
        <div className="mt-3 space-y-2">
          <input
            value={phone}
            inputMode="tel"
            onChange={(e) => setPhone(e.target.value.slice(0, 15))}
            placeholder="Téléphone (ex. 79123456)"
            className={inputCls}
          />
          <input
            value={identity}
            onChange={(e) => setIdentity(e.target.value.slice(0, 100))}
            placeholder="Nom complet ou email utilisé"
            className={inputCls}
          />
          <button
            onClick={search}
            disabled={loading || phone.trim().length < 8 || identity.trim().length < 3}
            className="h-12 w-full rounded-xl bg-primary text-sm font-extrabold text-primary-foreground disabled:opacity-60"
          >
            {loading ? "Recherche..." : "Chercher mes tickets"}
          </button>
        </div>

        <div className="mt-6 space-y-3">
          {tickets === null ? null : tickets.length === 0 ? (
            <EmptyState icon="confirmation_number" title="Aucun ticket ne correspond à ces informations" />
          ) : (
            tickets.map((t) => (
              <Link
                key={t.id}
                to="/ticket/$code"
                params={{ code: t.code }}
                className="flex items-center justify-between rounded-2xl bg-surface-container-lowest p-4 shadow-soft"
              >
                <div className="min-w-0">
                  <p className="truncate font-extrabold text-on-surface">{t.eventTitle}</p>
                  <p className="text-xs text-on-surface-variant">
                    {formatDateFr(t.eventDate)} · {t.ticketTypeName}
                  </p>
                  <p className="font-mono text-[11px] text-on-surface-variant">{t.code}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-extrabold ${
                    t.status === "used" ? "bg-error-container text-destructive" : "bg-success-container text-success"
                  }`}
                >
                  {t.status === "used" ? "Utilisé" : "Valide"}
                </span>
              </Link>
            ))
          )}
        </div>
      </Page>
      <BottomNav />
    </>
  );
}
