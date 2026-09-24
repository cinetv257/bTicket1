import { useEffect, useState } from "react";
import { listTicketTypes } from "@/lib/bticket";
import { formatBIF, formatDateFr } from "@/lib/format";
import type { EventDoc, TicketType } from "@/lib/types";

export function EventDetails({ event: e }: { event: EventDoc }) {
  const [open, setOpen] = useState(e.status === "pending");
  const [types, setTypes] = useState<TicketType[] | null>(null);

  useEffect(() => {
    if (open && !types) listTicketTypes(e.id).then(setTypes).catch(() => setTypes([]));
  }, [open, types, e.id]);

  return (
    <div className="px-3 pb-3">
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-1 text-xs font-extrabold text-primary">
        <span className="material-symbols-outlined text-[18px]">{open ? "expand_less" : "expand_more"}</span>
        {open ? "Masquer les détails" : "Voir tous les détails"}
      </button>
      {open ? (
        <div className="mt-2 space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-surface-container-low p-3">
            <Info label="Catégorie" value={e.category} />
            <Info label="Date" value={`${formatDateFr(e.date)} · ${e.time}`} />
            <Info label="Lieu" value={e.venue} />
            <Info label="Ville" value={e.city} />
            <Info label="Organisateur" value={e.organizerName} />
          </div>
          <div>
            <p className="mb-1 font-extrabold text-on-surface">Description</p>
            <p className="whitespace-pre-line text-on-surface-variant">{e.description || "—"}</p>
          </div>
          <div>
            <p className="mb-1 font-extrabold text-on-surface">Catégories de tickets et prix</p>
            {!types ? (
              <p className="text-on-surface-variant">Chargement...</p>
            ) : types.length === 0 ? (
              <p className="font-semibold text-destructive">Aucune catégorie de ticket configurée.</p>
            ) : (
              <div className="divide-y divide-outline-variant/40 rounded-xl bg-surface-container-low">
                {types.map((t) => (
                  <div key={t.id} className="flex items-center justify-between gap-2 p-3">
                    <div className="min-w-0">
                      <p className="truncate font-bold text-on-surface">{t.name}</p>
                      <p className="text-on-surface-variant">
                        {t.sold ?? 0} vendus / {t.quantity} places
                        {t.description ? ` · ${t.description}` : ""}
                      </p>
                    </div>
                    <p className="shrink-0 font-extrabold text-primary">{formatBIF(t.price)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-on-surface-variant">{label}</p>
      <p className="truncate font-bold text-on-surface">{value || "—"}</p>
    </div>
  );
}
