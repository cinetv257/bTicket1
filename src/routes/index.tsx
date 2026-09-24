import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppHeader, Page } from "@/components/bticket/AppHeader";
import { BottomNav } from "@/components/bticket/BottomNav";
import { EmptyState, Loader } from "@/components/bticket/RequireRole";
import { listPublicEvents } from "@/lib/bticket";
import { formatShortDate } from "@/lib/format";
import type { EventDoc } from "@/lib/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "bTicket Burundi — Billetterie événementielle en ligne" },
      {
        name: "description",
        content:
          "Concerts, festivals et spectacles au Burundi : achetez votre ticket par paiement mobile, sans créer de compte.",
      },
      { property: "og:title", content: "bTicket Burundi — Billetterie événementielle" },
      {
        property: "og:description",
        content: "Trouvez vos événements préférés au Burundi et recevez votre pass numérique instantanément.",
      },
    ],
  }),
  component: Home,
});

const CATEGORIES = ["Tous", "Concert", "Festival", "Sport", "Conférence", "Théâtre", "Autre"];

function Home() {
  const [events, setEvents] = useState<EventDoc[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Tous");

  useEffect(() => {
    listPublicEvents()
      .then(setEvents)
      .catch((e: Error) => setError(e.message));
  }, []);

  const filtered = useMemo(() => {
    if (!events) return [];
    const q = search.trim().toLowerCase();
    return events.filter(
      (e) =>
        (category === "Tous" || e.category === category) &&
        (!q || `${e.title} ${e.venue} ${e.city} ${e.organizerName}`.toLowerCase().includes(q)),
    );
  }, [events, search, category]);

  return (
    <div className="bg-surface">
      <AppHeader />
      <Page>
        <section className="py-2">
          <div className="mb-1 flex items-center gap-2">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
              <span className="material-symbols-outlined text-[16px]">celebration</span>
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Événements en direct</span>
          </div>
          <h1 className="text-2xl font-extrabold leading-snug tracking-tight text-on-surface">
            Trouvez vos événements préférés au Burundi 🇧🇮
          </h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            Accès instantané, billets certifiés et paiement mobile sans friction.
          </p>
        </section>

        <div className="relative mt-4 flex items-center rounded-xl bg-surface-container-low shadow-soft focus-within:bg-surface-container-lowest">
          <span className="material-symbols-outlined pointer-events-none absolute left-4 text-[22px] text-primary">
            search
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value.slice(0, 80))}
            placeholder="Rechercher un concert, festival, artiste..."
            className="h-13 w-full rounded-xl bg-transparent py-3.5 pl-12 pr-4 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none"
          />
        </div>

        <div className="no-scrollbar -mx-4 mt-5 flex gap-2 overflow-x-auto px-4 py-1">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`h-9 shrink-0 rounded-full px-4 text-sm font-semibold transition-transform active:scale-95 ${
                category === c
                  ? "bg-primary-container text-primary-foreground shadow-soft"
                  : "bg-surface-container-low text-on-surface-variant"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <section className="mt-6 space-y-4">
          {error ? (
            <EmptyState icon="error" title="Impossible de charger les événements" hint={error} />
          ) : !events ? (
            <Loader label="Chargement des événements..." />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon="event_busy"
              title="Aucun événement disponible"
              hint="Les événements approuvés par bTicket apparaîtront ici."
            />
          ) : (
            filtered.map((event) => <EventCard key={event.id} event={event} />)
          )}
        </section>
      </Page>
      <BottomNav />
    </div>
  );
}

function EventCard({ event }: { event: EventDoc }) {
  return (
    <Link
      to="/evenement/$id"
      params={{ id: event.id }}
      className="block overflow-hidden rounded-2xl bg-surface-container-lowest shadow-soft transition-transform active:scale-[0.99]"
    >
      <div className="relative h-44 w-full bg-surface-variant">
        {event.imageUrl ? (
          <img src={event.imageUrl} alt={event.title} className="h-full w-full object-cover" loading="lazy" />
        ) : null}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-inverse-surface/85 to-transparent" />
        <span className="absolute left-3 top-3 rounded-full bg-surface-container-lowest/90 px-2.5 py-1 text-xs font-bold text-on-surface backdrop-blur">
          {formatShortDate(event.date)} · {event.time}
        </span>
        <span className="absolute right-3 top-3 rounded-full bg-primary-container px-2.5 py-1 text-xs font-bold text-primary-foreground">
          {event.category}
        </span>
      </div>
      <div className="p-4">
        <h2 className="truncate text-base font-extrabold text-on-surface">{event.title}</h2>
        <p className="mt-1 flex items-center gap-1 text-sm text-on-surface-variant">
          <span className="material-symbols-outlined text-[16px]">location_on</span>
          <span className="truncate">
            {event.venue}, {event.city}
          </span>
        </p>
        <p className="mt-2 text-xs font-semibold text-primary">Par {event.organizerName}</p>
      </div>
    </Link>
  );
}
