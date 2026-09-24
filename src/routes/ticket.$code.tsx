import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppHeader, Page } from "@/components/bticket/AppHeader";
import { QrCode } from "@/components/bticket/QrCode";
import { EmptyState, Loader } from "@/components/bticket/RequireRole";
import { getTicketByCode } from "@/lib/bticket";
import { formatBIF, formatDateFr } from "@/lib/format";
import type { TicketDoc } from "@/lib/types";

export const Route = createFileRoute("/ticket/$code")({
  head: () => ({
    meta: [
      { title: "Mon pass numérique — bTicket Burundi" },
      { name: "description", content: "Votre ticket officiel bTicket avec QR code sécurisé, à présenter à l'entrée." },
      { property: "og:title", content: "Mon pass numérique — bTicket Burundi" },
      { property: "og:description", content: "Ticket officiel bTicket avec QR code unique." },
    ],
  }),
  component: TicketView,
});

function TicketView() {
  const { code } = Route.useParams();
  const [ticket, setTicket] = useState<TicketDoc | null | undefined>(undefined);

  useEffect(() => {
    getTicketByCode(code).then(setTicket);
  }, [code]);

  if (ticket === undefined) {
    return (
      <>
        <AppHeader title="Pass Numérique" back />
        <Page>
          <Loader />
        </Page>
      </>
    );
  }
  if (!ticket) {
    return (
      <>
        <AppHeader title="Pass Numérique" back />
        <Page>
          <EmptyState icon="search_off" title="Ticket introuvable" hint={`Aucun ticket avec le code ${code}`} />
        </Page>
      </>
    );
  }

  const used = ticket.status === "used";

  return (
    <>
      <AppHeader title="Pass Numérique" back />
      <Page>
        <div className="overflow-hidden rounded-3xl bg-surface-container-lowest shadow-elevated">
          <div className="bg-night px-6 py-5 text-lavender">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gold">Ticket officiel bTicket</p>
            <h1 className="mt-1 text-xl font-extrabold leading-tight text-white">{ticket.eventTitle}</h1>
            <p className="mt-1 text-sm opacity-80">
              {formatDateFr(ticket.eventDate)} · {ticket.eventTime}
            </p>
          </div>

          <div className="ticket-notch h-6 border-b border-dashed border-outline-variant" />

          <div className="flex flex-col items-center gap-4 px-6 py-6">
            <span
              className={`rounded-full px-3 py-1 text-xs font-extrabold ${
                used ? "bg-error-container text-destructive" : "bg-success-container text-success"
              }`}
            >
              {used ? "Déjà utilisé" : "Valide"}
            </span>
            <QrCode value={ticket.code} />
            <p className="font-mono text-sm font-bold tracking-wider text-on-surface">{ticket.code}</p>
            <p className="text-center text-xs text-on-surface-variant">
              Présentez ce QR code à l'agent scanner à l'entrée. Il n'est valable qu'une seule fois.
            </p>
          </div>

          <dl className="grid grid-cols-2 gap-px bg-outline-variant/40">
            <Cell label="Titulaire" value={ticket.buyerName} />
            <Cell label="Catégorie" value={ticket.ticketTypeName} />
            <Cell label="Lieu" value={ticket.venue} />
            <Cell label="Prix payé" value={formatBIF(ticket.price)} />
          </dl>
        </div>

        <button
          onClick={() => window.print()}
          className="mt-5 w-full rounded-full bg-surface-container-high py-3.5 text-sm font-extrabold text-on-surface"
        >
          Enregistrer / imprimer le ticket
        </button>
      </Page>
    </>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface-container-lowest px-5 py-3">
      <dt className="text-[10px] font-bold uppercase tracking-wide text-on-surface-variant">{label}</dt>
      <dd className="truncate text-sm font-bold text-on-surface">{value}</dd>
    </div>
  );
}
