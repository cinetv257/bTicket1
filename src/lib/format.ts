import { COMMISSION_RATE } from "./firebase";

export function formatBIF(amount: number): string {
  return `${Math.round(amount).toLocaleString("fr-FR").replace(/\u202f|\u00a0/g, " ")} BIF`;
}

export function commissionFor(amount: number) {
  const commission = Math.round(amount * COMMISSION_RATE);
  return { commission, net: amount - commission };
}

/** Accepts an ISO string, a Date, or a Firestore timestamp-like object. */
function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === "object") {
    const ts = value as { seconds?: number; toDate?: () => Date };
    if (typeof ts.toDate === "function") return ts.toDate();
    if (typeof ts.seconds === "number") return new Date(ts.seconds * 1000);
    return null;
  }
  const d = new Date(value as string | number);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDateFr(iso: unknown): string {
  const d = toDate(iso);
  if (!d) return typeof iso === "string" ? iso : "";
  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

export function formatShortDate(iso: unknown): string {
  const d = toDate(iso);
  if (!d) return typeof iso === "string" ? iso : "";
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

/** Formats a Firestore timestamp (or anything with seconds) in French. */
export function formatTimestamp(ts?: { seconds: number } | null): string {
  if (!ts?.seconds) return "—";
  return new Date(ts.seconds * 1000).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function generateTicketCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  for (const b of bytes) out += chars[b % chars.length];
  return `BT-${out.slice(0, 4)}-${out.slice(4, 8)}-${out.slice(8, 12)}`;
}

export function paymentReference(): string {
  return `PAY-${Date.now().toString(36).toUpperCase()}`;
}
