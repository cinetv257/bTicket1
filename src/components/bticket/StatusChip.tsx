const TONE: Record<string, string> = {
  approved: "bg-success-container text-success",
  paid: "bg-success-container text-success",
  active: "bg-success-container text-success",
  pending: "bg-gold/25 text-tertiary",
  draft: "bg-surface-container-high text-on-surface-variant",
  rejected: "bg-error-container text-destructive",
  suspended: "bg-error-container text-destructive",
  used: "bg-surface-container-high text-on-surface-variant",
  failed: "bg-error-container text-destructive",
};

const LABEL: Record<string, string> = {
  approved: "Approuvé",
  paid: "Payé",
  active: "Valide",
  pending: "En attente",
  draft: "Brouillon",
  rejected: "Refusé",
  suspended: "Suspendu",
  used: "Utilisé",
  failed: "Échoué",
};

export function StatusChip({ status }: { status: string }) {
  return (
    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-extrabold ${TONE[status] ?? TONE['draft']}`}>
      {LABEL[status] ?? status}
    </span>
  );
}
