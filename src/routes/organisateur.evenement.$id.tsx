import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { DashboardShell, organizerNav } from "@/components/bticket/DashboardShell";
import { Field, StatCard } from "@/components/bticket/Field";
import { EmptyState, Loader, RequireRole } from "@/components/bticket/RequireRole";
import { StatusChip } from "@/components/bticket/StatusChip";
import {
  createTicketType,
  deleteEvent,
  deleteTicketType,
  getEvent,
  listEventTickets,
  listTicketTypes,
  updateEvent,
} from "@/lib/bticket";
import { formatBIF, formatDateFr } from "@/lib/format";
import type { EventDoc, TicketDoc, TicketType } from "@/lib/types";

export const Route = createFileRoute("/organisateur/evenement/$id")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Gestion de l'événement — bTicket Burundi" },
      { name: "description", content: "Configurez vos catégories de tickets et suivez les entrées vendues." },
      { property: "og:title", content: "Gestion de l'événement — bTicket Burundi" },
      { property: "og:description", content: "Catégories de tickets, quotas et ventes en temps réel." },
    ],
  }),
  component: () => (
    <RequireRole role="organizer" loginPath="/organisateur/connexion">
      <ManageEvent />
    </RequireRole>
  ),
});

const typeSchema = z.object({
  name: z.string().trim().min(2, "Nom de catégorie requis").max(40),
  price: z.number().int().min(0, "Prix invalide").max(100_000_000),
  quantity: z.number().int().min(1, "Quantité minimum 1").max(1_000_000),
});

function ManageEvent() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<EventDoc | null | undefined>(undefined);
  const [types, setTypes] = useState<TicketType[]>([]);
  const [tickets, setTickets] = useState<TicketDoc[]>([]);
  const [draft, setDraft] = useState({ name: "", price: "", quantity: "", description: "" });
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    const e = await getEvent(id);
    setEvent(e);
    if (e) {
      setTypes(await listTicketTypes(e.id));
      setTickets(await listEventTickets(e.id));
    }
  }, [id]);

  useEffect(() => {
    reload();
  }, [reload]);

  if (event === undefined)
    return (
      <DashboardShell title="Événement" nav={organizerNav}>
        <Loader />
      </DashboardShell>
    );
  if (!event)
    return (
      <DashboardShell title="Événement" nav={organizerNav}>
        <EmptyState icon="event_busy" title="Événement introuvable" />
      </DashboardShell>
    );

  async function addType() {
    const parsed = typeSchema.safeParse({
      name: draft.name,
      price: Number(draft.price),
      quantity: Number(draft.quantity),
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Catégorie invalide");
      return;
    }
    setBusy(true);
    try {
      await createTicketType({ eventId: id, ...parsed.data, description: draft.description.trim() });
      setDraft({ name: "", price: "", quantity: "", description: "" });
      toast.success("Catégorie ajoutée");
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ajout impossible");
    } finally {
      setBusy(false);
    }
  }

  const used = tickets.filter((t) => t.status === "used").length;

  return (
    <DashboardShell title={event.title} nav={organizerNav} action={<StatusChip status={event.status} />}>
      <div className="mb-5 overflow-hidden rounded-3xl bg-surface-container-lowest shadow-soft">
        {event.imageUrl ? <img src={event.imageUrl} alt="" className="h-40 w-full object-cover" /> : null}
        <div className="p-4">
          <p className="text-sm text-on-surface-variant">
            {formatDateFr(event.date)} · {event.time} · {event.venue}, {event.city}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {event.status === "draft" ? (
              <button
                onClick={async () => {
                  await updateEvent(event.id, { status: "pending" });
                  toast.success("Soumis à validation");
                  reload();
                }}
                className="rounded-full bg-primary px-4 py-2 text-xs font-extrabold text-primary-foreground"
              >
                Soumettre à validation
              </button>
            ) : null}
            <button
              onClick={async () => {
                if (!confirm("Supprimer définitivement cet événement ?")) return;
                await deleteEvent(event.id);
                toast.success("Événement supprimé");
                navigate({ to: "/organisateur/evenements" });
              }}
              className="rounded-full bg-error-container px-4 py-2 text-xs font-extrabold text-destructive"
            >
              Supprimer
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCard icon="confirmation_number" label="Vendus" value={event.ticketsSold ?? 0} />
        <StatCard icon="door_front" label="Entrées scannées" value={used} tone="night" />
        <StatCard icon="payments" label="Revenu net" value={formatBIF(event.revenue ?? 0)} tone="gold" />
      </div>

      <h2 className="mt-8 mb-3 text-base font-extrabold text-on-surface">Catégories de tickets</h2>
      <div className="space-y-3">
        {types.length === 0 ? (
          <EmptyState icon="sell" title="Aucune catégorie" hint="Ajoutez au moins une catégorie pour vendre." />
        ) : (
          types.map((t) => (
            <div key={t.id} className="flex items-center justify-between rounded-2xl bg-surface-container-lowest p-4 shadow-soft">
              <div>
                <p className="font-extrabold text-on-surface">{t.name}</p>
                <p className="text-xs text-on-surface-variant">
                  {t.sold ?? 0} / {t.quantity} vendus
                </p>
              </div>
              <div className="flex items-center gap-3">
                <p className="font-extrabold text-on-surface">{formatBIF(t.price)}</p>
                <button
                  aria-label="Supprimer la catégorie"
                  onClick={async () => {
                    if ((t.sold ?? 0) > 0) {
                      toast.error("Impossible : des tickets ont déjà été vendus.");
                      return;
                    }
                    await deleteTicketType(t.id);
                    toast.success("Catégorie supprimée");
                    reload();
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-error-container text-destructive"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-5 space-y-3 rounded-3xl bg-surface-container-low p-5">
        <h3 className="font-extrabold text-on-surface">Nouvelle catégorie</h3>
        <Field label="Nom" value={draft.name} onChange={(v) => setDraft((d) => ({ ...d, name: v }))} placeholder="VIP" />
        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            label="Prix (BIF)"
            value={draft.price}
            onChange={(v) => setDraft((d) => ({ ...d, price: v.replace(/\D/g, "") }))}
            inputMode="numeric"
            placeholder="50000"
          />
          <Field
            label="Quantité"
            value={draft.quantity}
            onChange={(v) => setDraft((d) => ({ ...d, quantity: v.replace(/\D/g, "") }))}
            inputMode="numeric"
            placeholder="200"
          />
        </div>
        <Field
          label="Description (optionnel)"
          value={draft.description}
          onChange={(v) => setDraft((d) => ({ ...d, description: v }))}
          placeholder="Accès loge + boisson"
        />
        <button
          onClick={addType}
          disabled={busy}
          className="w-full rounded-full bg-primary py-3.5 text-sm font-extrabold text-primary-foreground disabled:opacity-60"
        >
          Ajouter la catégorie
        </button>
      </div>
    </DashboardShell>
  );
}
