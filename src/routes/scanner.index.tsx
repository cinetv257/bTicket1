import { createFileRoute } from "@tanstack/react-router";
import { BrowserMultiFormatReader, type IScannerControls } from "@zxing/browser";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { RequireRole } from "@/components/bticket/RequireRole";
import { useAuth } from "@/hooks/useAuth";
import { listOrganizerEvents, listScans, validateScan } from "@/lib/bticket";
import { formatTimestamp } from "@/lib/format";
import type { EventDoc, ScanDoc, TicketDoc } from "@/lib/types";

export const Route = createFileRoute("/scanner/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Scanner de tickets — bTicket Burundi" },
      { name: "description", content: "Scannez les QR codes bTicket et validez les entrées en temps réel." },
      { property: "og:title", content: "Scanner de tickets — bTicket Burundi" },
      { property: "og:description", content: "Validation instantanée des billets à l'entrée." },
    ],
  }),
  component: () => (
    <RequireRole role="scanner" loginPath="/scanner/connexion">
      <Scanner />
    </RequireRole>
  ),
});

type Outcome = { result: ScanDoc["result"]; ticket: TicketDoc | null } | null;

const OUTCOME = {
  valid: { title: "Ticket valide", icon: "check_circle", cls: "bg-success-container text-success" },
  already_used: { title: "Ticket déjà utilisé", icon: "error", cls: "bg-gold/25 text-tertiary" },
  wrong_event: { title: "Mauvais événement", icon: "event_busy", cls: "bg-error-container text-destructive" },
  invalid: { title: "Ticket invalide", icon: "cancel", cls: "bg-error-container text-destructive" },
} as const;

function Scanner() {
  const { profile, logout } = useAuth();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const busyRef = useRef(false);
  const [events, setEvents] = useState<EventDoc[]>([]);
  const [eventId, setEventId] = useState("");
  const [outcome, setOutcome] = useState<Outcome>(null);
  const [manual, setManual] = useState("");
  const [history, setHistory] = useState<ScanDoc[]>([]);
  const [camera, setCamera] = useState(false);

  const refreshHistory = useCallback(() => {
    if (profile) listScans(profile.id).then((s) => setHistory(s.slice(0, 10)));
  }, [profile]);

  useEffect(() => {
    if (profile?.organizerId) listOrganizerEvents(profile.organizerId).then((e) => setEvents(e.filter((x) => x.status === "approved")));
    refreshHistory();
  }, [profile, refreshHistory]);

  const handleCode = useCallback(
    async (code: string) => {
      if (!profile || busyRef.current) return;
      busyRef.current = true;
      try {
        const res = await validateScan(code, { id: profile.id, name: profile.fullName }, eventId || undefined);
        setOutcome(res);
        if (res.result === "valid") toast.success("Entrée autorisée");
        else toast.error(OUTCOME[res.result].title);
        refreshHistory();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Validation impossible");
      } finally {
        setTimeout(() => (busyRef.current = false), 1500);
      }
    },
    [profile, eventId, refreshHistory],
  );

  useEffect(() => {
    if (!camera) return;
    let cancelled = false;
    const reader = new BrowserMultiFormatReader();
    (async () => {
      try {
        const controls = await reader.decodeFromVideoDevice(undefined, videoRef.current ?? undefined, (result) => {
          if (result) handleCode(result.getText());
        });
        if (cancelled) controls.stop();
        else controlsRef.current = controls;
      } catch {
        toast.error("Caméra indisponible. Utilisez la saisie manuelle du code.");
        setCamera(false);
      }
    })();
    return () => {
      cancelled = true;
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, [camera, handleCode]);

  return (
    <div className="min-h-screen bg-night pb-10 text-lavender">
      <header className="flex items-center justify-between px-4 py-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-lavender/60">Agent scanner</p>
          <p className="font-extrabold">{profile?.fullName}</p>
        </div>
        <button
          aria-label="Déconnexion"
          onClick={() => logout()}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
        </button>
      </header>

      <div className="px-4">
        <label className="block">
          <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-lavender/60">Événement contrôlé</span>
          <select
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            className="h-12 w-full rounded-xl border border-white/15 bg-white/10 px-4 text-sm text-lavender focus:outline-none"
          >
            <option value="">Tous les événements</option>
            {events.map((e) => (
              <option key={e.id} value={e.id} className="text-night">
                {e.title}
              </option>
            ))}
          </select>
        </label>

        <div className="relative mt-4 aspect-square w-full overflow-hidden rounded-3xl border border-white/15 bg-black/40">
          <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
          {!camera ? (
            <button
              onClick={() => setCamera(true)}
              className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-lavender"
            >
              <span className="material-symbols-outlined text-[44px] text-gold">qr_code_scanner</span>
              <span className="text-sm font-extrabold">Activer la caméra</span>
            </button>
          ) : (
            <div className="pointer-events-none absolute inset-8 rounded-2xl border-2 border-gold/80" />
          )}
        </div>

        {camera ? (
          <button
            onClick={() => {
              controlsRef.current?.stop();
              setCamera(false);
            }}
            className="mt-3 w-full rounded-full bg-white/10 py-3 text-sm font-extrabold"
          >
            Arrêter la caméra
          </button>
        ) : null}

        <div className="mt-4 flex gap-2">
          <input
            value={manual}
            onChange={(e) => setManual(e.target.value.toUpperCase().slice(0, 20))}
            placeholder="BT-XXXX-XXXX-XXXX"
            className="h-12 flex-1 rounded-xl border border-white/15 bg-white/10 px-4 text-sm text-lavender placeholder:text-lavender/40 focus:outline-none"
          />
          <button
            onClick={() => manual.trim() && handleCode(manual.trim())}
            className="rounded-xl bg-gold px-5 text-sm font-extrabold text-night"
          >
            Vérifier
          </button>
        </div>

        {outcome ? (
          <div className="mt-5 rounded-3xl bg-white/5 p-5">
            <div className={`mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-extrabold ${OUTCOME[outcome.result].cls}`}>
              <span className="material-symbols-outlined text-[18px]">{OUTCOME[outcome.result].icon}</span>
              {OUTCOME[outcome.result].title}
            </div>
            {outcome.ticket ? (
              <div className="space-y-1 text-sm">
                <p className="text-lg font-extrabold">{outcome.ticket.buyerName}</p>
                <p className="text-lavender/70">
                  {outcome.ticket.eventTitle} · {outcome.ticket.ticketTypeName}
                </p>
                <p className="font-mono text-xs text-gold">{outcome.ticket.code}</p>
              </div>
            ) : (
              <p className="text-sm text-lavender/70">Aucun ticket ne correspond à ce code.</p>
            )}
          </div>
        ) : null}

        <h2 className="mt-8 mb-3 text-sm font-extrabold uppercase tracking-wide text-lavender/60">Derniers scans</h2>
        <div className="space-y-2">
          {history.length === 0 ? (
            <p className="text-sm text-lavender/60">Aucun scan enregistré.</p>
          ) : (
            history.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-mono text-xs text-gold">{s.ticketCode}</p>
                  <p className="truncate text-xs text-lavender/60">{s.eventTitle || "—"} · {formatTimestamp(s.createdAt)}</p>
                </div>
                <span className="material-symbols-outlined text-[20px]">
                  {s.result === "valid" ? "check_circle" : "cancel"}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
