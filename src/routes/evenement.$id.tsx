import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppHeader, Page } from "@/components/bticket/AppHeader";
import { EmptyState, Loader } from "@/components/bticket/RequireRole";
import { getEvent, listTicketTypes } from "@/lib/bticket";
import { formatBIF, formatDateFr } from "@/lib/format";
import type { EventDoc, TicketType } from "@/lib/types";

export const Route = createFileRoute("/evenement/$id")({
  head: () => ({
    meta: [
      { title: "Détails de l'événement — bTicket Burundi" },
      { name: "description", content: "Programme, lieu, catégories de tickets et achat en ligne sur bTicket Burundi." },
      { property: "og:title", content: "Détails de l'événement — bTicket Burundi" },
      { property: "og:description", content: "Réservez votre place en quelques secondes avec bTicket Burundi." },
    ],
  }),
  component: EventDetail,
});

function EventDetail() {
  const { id } = Route.useParams();
  const [event, setEvent] = useState<EventDoc | null | undefined>(undefined);
  const [types, setTypes] = useState<TicketType[]>([]);

  useEffect(() => {
    getEvent(id).then(async (e) => {
      setEvent(e);
      if (e) setTypes(await listTicketTypes(e.id));
    });
  }, [id]);

  if (event === undefined) {
    return (
      <>
        <AppHeader title="Détails" back />
        <Page>
          <Loader />
        </Page>
      </>
    );
  }

  if (!event) {
    return (
      <>
        <AppHeader title="Détails" back />
        <Page>
          <EmptyState icon="event_busy" title="Événement introuvable" />
        </Page>
      </>
    );
  }

  const minPrice = types.length ? Math.min(...types.map((t) => t.price)) : 0;

  return (
    <>
      <AppHeader title="Détails Événement" back />
      <Page className="pb-32">
        <div className="relative overflow-hidden rounded-2xl shadow-soft">
          <div className="h-64 w-full bg-surface-variant">
            {event.imageUrl ? (
              <img src={event.imageUrl} alt={event.title} className="h-full w-full object-cover" />
            ) : null}
          </div>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-inverse-surface/90 via-inverse-surface/20 to-transparent" />
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
            <span className="rounded-full bg-primary-container px-3 py-1 text-xs font-bold text-primary-foreground">
              {event.category}
            </span>
            <span className="rounded-full bg-surface-container-lowest/90 px-3 py-1 text-xs font-bold text-on-surface backdrop-blur">
              {event.time}
            </span>
          </div>
        </div>

        <h1 className="mt-5 text-2xl font-extrabold leading-tight tracking-tight text-on-surface">{event.title}</h1>
        <p className="mt-1 text-sm font-semibold text-primary">Organisé par {event.organizerName}</p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <InfoRow icon="calendar_month" label="Date" value={`${formatDateFr(event.date)} · ${event.time}`} />
          <InfoRow icon="location_on" label="Lieu" value={`${event.venue}, ${event.city}`} />
        </div>

        <section className="mt-6">
          <h2 className="text-base font-extrabold text-on-surface">À propos</h2>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-on-surface-variant">
            {event.description}
          </p>
        </section>

        <section className="mt-6">
          <h2 className="text-base font-extrabold text-on-surface">Catégories de tickets</h2>
          <div className="mt-3 space-y-3">
            {types.length === 0 ? (
              <EmptyState icon="sell" title="Aucune catégorie en vente" />
            ) : (
              types.map((t) => {
                const remaining = t.quantity - (t.sold ?? 0);
                return (
                  <div
                    key={t.id}
                    className="flex items-center justify-between gap-3 rounded-2xl bg-surface-container-lowest p-4 shadow-soft"
                  >
                    <div className="min-w-0">
                      <p className="font-extrabold text-on-surface">{t.name}</p>
                      {t.description ? (
                        <p className="truncate text-xs text-on-surface-variant">{t.description}</p>
                      ) : null}
                      <p className={`mt-1 text-xs font-semibold ${remaining > 0 ? "text-primary" : "text-destructive"}`}>
                        {remaining > 0 ? `${remaining} disponible(s)` : "Épuisé"}
                      </p>
                    </div>
                    <p className="shrink-0 text-base font-extrabold text-on-surface">{formatBIF(t.price)}</p>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </Page>

      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-outline-variant/40 bg-surface/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">À partir de</p>
            <p className="text-lg font-extrabold text-on-surface">{formatBIF(minPrice)}</p>
          </div>
          <Link
            to="/achat/$id"
            params={{ id: event.id }}
            className="flex-1 rounded-full bg-primary py-3.5 text-center text-sm font-extrabold text-primary-foreground shadow-soft active:scale-[0.98]"
          >
            Acheter un ticket
          </Link>
        </div>
      </div>
    </>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-surface-container-low p-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
        <span className="material-symbols-outlined text-[20px]">{icon}</span>
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">{label}</p>
        <p className="truncate text-sm font-bold text-on-surface">{value}</p>
      </div>
    </div>
  );
}
