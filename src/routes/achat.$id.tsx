import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { AppHeader, Page } from "@/components/bticket/AppHeader";
import { EmptyState, Loader } from "@/components/bticket/RequireRole";
import { getEvent, listTicketTypes, purchaseTickets } from "@/lib/bticket";
import { formatBIF, formatDateFr } from "@/lib/format";
import type { EventDoc, PaymentMethod, TicketDoc, TicketType } from "@/lib/types";

export const Route = createFileRoute("/achat/$id")({
  head: () => ({
    meta: [
      { title: "Achat de ticket — bTicket Burundi" },
      { name: "description", content: "Achetez votre ticket sans inscription et payez par mobile money au Burundi." },
      { property: "og:title", content: "Achat de ticket — bTicket Burundi" },
      { property: "og:description", content: "Paiement mobile sécurisé et pass numérique immédiat." },
    ],
  }),
  component: Checkout,
});

const buyerSchema = z.object({
  buyerName: z.string().trim().min(3, "Entrez votre nom complet").max(80),
  buyerPhone: z
    .string()
    .trim()
    .regex(/^(\+257)?[0-9]{8}$/, "Numéro burundais invalide (8 chiffres)"),
  buyerEmail: z.string().trim().email("Email invalide").max(120).optional().or(z.literal("")),
});

const METHODS: { id: PaymentMethod; label: string; icon: string; hint: string }[] = [
  { id: "lumicash", label: "Lumicash", icon: "smartphone", hint: "Paiement mobile Lumitel" },
  { id: "ecocash", label: "EcoCash", icon: "phone_android", hint: "Paiement mobile Econet" },
  { id: "bancobu", label: "BANCOBU eWallet", icon: "account_balance", hint: "Portefeuille bancaire" },
  { id: "card", label: "Carte bancaire", icon: "credit_card", hint: "Visa / Mastercard" },
];

function Checkout() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<EventDoc | null | undefined>(undefined);
  const [types, setTypes] = useState<TicketType[]>([]);
  const [selected, setSelected] = useState<TicketType | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [form, setForm] = useState({ buyerName: "", buyerPhone: "", buyerEmail: "" });
  const [method, setMethod] = useState<PaymentMethod>("lumicash");
  const [submitting, setSubmitting] = useState(false);
  const [tickets, setTickets] = useState<TicketDoc[]>([]);

  useEffect(() => {
    getEvent(id).then(async (e) => {
      setEvent(e);
      if (e) {
        const list = await listTicketTypes(e.id);
        setTypes(list);
        setSelected(list.find((t) => t.quantity - (t.sold ?? 0) > 0) ?? list[0] ?? null);
      }
    });
  }, [id]);

  if (event === undefined) {
    return (
      <>
        <AppHeader title="Achat" back />
        <Page>
          <Loader />
        </Page>
      </>
    );
  }
  if (!event) {
    return (
      <>
        <AppHeader title="Achat" back />
        <Page>
          <EmptyState icon="event_busy" title="Événement introuvable" />
        </Page>
      </>
    );
  }

  const amount = (selected?.price ?? 0) * quantity;

  async function pay() {
    if (!selected || !event) return;
    const parsed = buyerSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Formulaire invalide");
      return;
    }
    setSubmitting(true);
    try {
      const res = await purchaseTickets({
        event,
        ticketType: selected,
        quantity,
        buyerName: parsed.data.buyerName,
        buyerPhone: parsed.data.buyerPhone,
        buyerEmail: parsed.data.buyerEmail || undefined,
        method,
      });
      setTickets(res.tickets);
      setStep(3);
      toast.success("Paiement confirmé, vos tickets sont prêts !");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Le paiement a échoué");
    } finally {
      setSubmitting(false);
    }
  }

  if (step === 3) {
    return (
      <>
        <AppHeader title="Confirmation" />
        <Page>
          <div className="flex flex-col items-center gap-3 rounded-3xl bg-surface-container-lowest p-8 text-center shadow-soft">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-success-container text-success">
              <span className="material-symbols-outlined text-[32px]">check_circle</span>
            </span>
            <h1 className="text-xl font-extrabold text-on-surface">Paiement réussi</h1>
            <p className="text-sm text-on-surface-variant">
              {tickets.length} ticket(s) pour <strong>{event.title}</strong> · {formatBIF(amount)}
            </p>
            <p className="text-xs text-on-surface-variant">
              Conservez vos codes : ils sont aussi retrouvables avec votre numéro {form.buyerPhone}.
            </p>
          </div>

          <div className="mt-5 space-y-3">
            {tickets.map((t) => (
              <Link
                key={t.id}
                to="/ticket/$code"
                params={{ code: t.code }}
                className="flex items-center justify-between rounded-2xl bg-surface-container-low p-4 shadow-soft"
              >
                <div>
                  <p className="font-extrabold text-on-surface">{t.ticketTypeName}</p>
                  <p className="font-mono text-xs text-on-surface-variant">{t.code}</p>
                </div>
                <span className="material-symbols-outlined text-primary">qr_code_2</span>
              </Link>
            ))}
          </div>

          <button
            onClick={() => navigate({ to: "/mes-tickets" })}
            className="mt-6 w-full rounded-full bg-primary py-3.5 text-sm font-extrabold text-primary-foreground shadow-soft"
          >
            Voir mes tickets
          </button>
        </Page>
      </>
    );
  }

  return (
    <>
      <AppHeader title={step === 1 ? "Achat sans inscription" : "Paiement sécurisé"} back />
      <Page className="pb-32">
        <div className="rounded-2xl bg-surface-container-low p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Événement</p>
          <p className="font-extrabold text-on-surface">{event.title}</p>
          <p className="text-sm text-on-surface-variant">
            {formatDateFr(event.date)} · {event.time} · {event.venue}
          </p>
        </div>

        {step === 1 ? (
          <>
            <h2 className="mt-6 text-base font-extrabold text-on-surface">1. Choisissez votre catégorie</h2>
            <div className="mt-3 space-y-3">
              {types.map((t) => {
                const remaining = t.quantity - (t.sold ?? 0);
                const active = selected?.id === t.id;
                return (
                  <button
                    key={t.id}
                    disabled={remaining <= 0}
                    onClick={() => {
                      setSelected(t);
                      setQuantity(1);
                    }}
                    className={`flex w-full items-center justify-between gap-3 rounded-2xl border-2 p-4 text-left transition-colors disabled:opacity-50 ${
                      active ? "border-primary bg-primary/5" : "border-transparent bg-surface-container-lowest shadow-soft"
                    }`}
                  >
                    <div>
                      <p className="font-extrabold text-on-surface">{t.name}</p>
                      <p className="text-xs text-on-surface-variant">
                        {remaining > 0 ? `${remaining} disponible(s)` : "Épuisé"}
                      </p>
                    </div>
                    <p className="font-extrabold text-on-surface">{formatBIF(t.price)}</p>
                  </button>
                );
              })}
            </div>

            {selected ? (
              <div className="mt-5 flex items-center justify-between rounded-2xl bg-surface-container-lowest p-4 shadow-soft">
                <p className="font-bold text-on-surface">Quantité</p>
                <div className="flex items-center gap-3">
                  <StepBtn icon="remove" onClick={() => setQuantity((q) => Math.max(1, q - 1))} />
                  <span className="w-8 text-center text-lg font-extrabold">{quantity}</span>
                  <StepBtn
                    icon="add"
                    onClick={() =>
                      setQuantity((q) => Math.min(10, selected.quantity - (selected.sold ?? 0), q + 1))
                    }
                  />
                </div>
              </div>
            ) : null}

            <h2 className="mt-6 text-base font-extrabold text-on-surface">2. Vos coordonnées</h2>
            <p className="text-xs text-on-surface-variant">Aucun compte requis — vos tickets arrivent immédiatement.</p>
            <div className="mt-3 space-y-3">
              <Field
                label="Nom complet"
                value={form.buyerName}
                onChange={(v) => setForm((f) => ({ ...f, buyerName: v }))}
                placeholder="Ex : Aline Niyonkuru"
              />
              <Field
                label="Téléphone"
                value={form.buyerPhone}
                onChange={(v) => setForm((f) => ({ ...f, buyerPhone: v }))}
                placeholder="79123456"
                inputMode="tel"
              />
              <Field
                label="Email (optionnel)"
                value={form.buyerEmail}
                onChange={(v) => setForm((f) => ({ ...f, buyerEmail: v }))}
                placeholder="vous@email.com"
              />
            </div>
          </>
        ) : (
          <>
            <h2 className="mt-6 text-base font-extrabold text-on-surface">Mode de paiement</h2>
            <div className="mt-3 space-y-3">
              {METHODS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMethod(m.id)}
                  className={`flex w-full items-center gap-3 rounded-2xl border-2 p-4 text-left ${
                    method === m.id ? "border-primary bg-primary/5" : "border-transparent bg-surface-container-lowest shadow-soft"
                  }`}
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <span className="material-symbols-outlined text-[20px]">{m.icon}</span>
                  </span>
                  <div>
                    <p className="font-extrabold text-on-surface">{m.label}</p>
                    <p className="text-xs text-on-surface-variant">{m.hint}</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-6 space-y-2 rounded-2xl bg-surface-container-low p-4 text-sm">
              <Row label={`${selected?.name} × ${quantity}`} value={formatBIF(amount)} />
              <div className="mt-2 flex items-center justify-between border-t border-outline-variant pt-3">
                <p className="font-extrabold text-on-surface">Total à payer</p>
                <p className="text-lg font-extrabold text-primary">{formatBIF(amount)}</p>
              </div>
            </div>
          </>
        )}
      </Page>

      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-outline-variant/40 bg-surface/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">Total</p>
            <p className="text-lg font-extrabold text-on-surface">{formatBIF(amount)}</p>
          </div>
          <button
            disabled={!selected || submitting}
            onClick={() => (step === 1 ? setStep(2) : pay())}
            className="flex-1 rounded-full bg-primary py-3.5 text-sm font-extrabold text-primary-foreground shadow-soft disabled:opacity-60"
          >
            {submitting ? "Paiement en cours..." : step === 1 ? "Continuer" : "Payer maintenant"}
          </button>
        </div>
      </div>
    </>
  );
}

function StepBtn({ icon, onClick }: { icon: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-container-high text-on-surface active:scale-95"
    >
      <span className="material-symbols-outlined text-[18px]">{icon}</span>
    </button>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={muted ? "text-on-surface-variant" : "font-semibold text-on-surface"}>{label}</span>
      <span className={muted ? "text-on-surface-variant" : "font-bold text-on-surface"}>{value}</span>
    </div>
  );
}

export function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  inputMode?: "tel" | "text" | "email" | "numeric";
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-on-surface-variant">{label}</span>
      <input
        type={type}
        inputMode={inputMode}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value.slice(0, 200))}
        className="h-12 w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-4 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary focus:outline-none"
      />
    </label>
  );
}
