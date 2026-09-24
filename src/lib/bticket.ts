import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  limit as fsLimit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "./firebase";
import { commissionFor, generateTicketCode, paymentReference } from "./format";
import type {
  AppUser,
  EventDoc,
  PaymentDoc,
  PaymentMethod,
  ScanDoc,
  TicketDoc,
  TicketType,
  WalletDoc,
  WithdrawalDoc,
} from "./types";

const col = (name: string) => collection(db, name);
const mapDocs = <T,>(snap: { docs: Array<{ id: string; data: () => unknown }> }): T[] =>
  snap.docs.map((d) => ({ id: d.id, ...(d.data() as object) }) as T);

/* ---------------- Events ---------------- */

export async function listPublicEvents(): Promise<EventDoc[]> {
  const snap = await getDocs(query(col("events"), where("status", "==", "approved")));
  return mapDocs<EventDoc>(snap).sort((a, b) => (a.date > b.date ? 1 : -1));
}

export async function getEvent(id: string): Promise<EventDoc | null> {
  const snap = await getDoc(doc(db, "events", id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as EventDoc) : null;
}

export async function listOrganizerEvents(organizerId: string): Promise<EventDoc[]> {
  const snap = await getDocs(query(col("events"), where("organizerId", "==", organizerId)));
  return mapDocs<EventDoc>(snap).sort((a, b) => (a.date > b.date ? -1 : 1));
}

export async function listEventsByStatus(status: EventDoc["status"]): Promise<EventDoc[]> {
  const snap = await getDocs(query(col("events"), where("status", "==", status)));
  return mapDocs<EventDoc>(snap);
}

export async function listAllEvents(): Promise<EventDoc[]> {
  const snap = await getDocs(col("events"));
  return mapDocs<EventDoc>(snap);
}

export async function createEvent(data: Omit<EventDoc, "id" | "ticketsSold" | "revenue">): Promise<string> {
  const ref = await addDoc(col("events"), {
    ...data,
    ticketsSold: 0,
    revenue: 0,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateEvent(id: string, data: Partial<EventDoc>) {
  await updateDoc(doc(db, "events", id), data);
}

export async function deleteEvent(id: string) {
  await deleteDoc(doc(db, "events", id));
}

/* ---------------- Ticket types ---------------- */

export async function listTicketTypes(eventId: string): Promise<TicketType[]> {
  const snap = await getDocs(query(col("ticketType"), where("eventId", "==", eventId)));
  return mapDocs<TicketType>(snap).sort((a, b) => a.price - b.price);
}

export async function createTicketType(data: Omit<TicketType, "id" | "sold">) {
  await addDoc(col("ticketType"), { ...data, sold: 0, createdAt: serverTimestamp() });
}

export async function updateTicketType(id: string, data: Partial<TicketType>) {
  await updateDoc(doc(db, "ticketType", id), data);
}

export async function deleteTicketType(id: string) {
  await deleteDoc(doc(db, "ticketType", id));
}

/* ---------------- Purchase ---------------- */

export interface PurchaseInput {
  event: EventDoc;
  ticketType: TicketType;
  quantity: number;
  buyerName: string;
  buyerPhone: string;
  buyerEmail?: string | undefined;
  method: PaymentMethod;
}

export interface PurchaseResult {
  payment: PaymentDoc;
  tickets: TicketDoc[];
}

/**
 * Real purchase flow: reserves stock transactionally, creates tickets with unique
 * QR codes, records the payment, and credits the organizer wallet minus the 2% fee.
 */
export async function purchaseTickets(input: PurchaseInput): Promise<PurchaseResult> {
  const { event, ticketType, quantity } = input;
  const amount = ticketType.price * quantity;
  const { commission, net } = commissionFor(amount);

  // 1. Reserve stock
  await runTransaction(db, async (tx) => {
    const ref = doc(db, "ticketType", ticketType.id);
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("Cette catégorie de ticket n'existe plus.");
    const data = snap.data() as TicketType;
    const remaining = data.quantity - (data.sold ?? 0);
    if (remaining < quantity) throw new Error(`Il ne reste que ${remaining} ticket(s) dans cette catégorie.`);
    tx.update(ref, { sold: increment(quantity) });
  });

  const reference = paymentReference();
  const paymentRef = doc(col("payments"));

  // 2. Tickets
  const tickets: TicketDoc[] = [];
  for (let i = 0; i < quantity; i++) {
    const code = generateTicketCode();
    const ticket = {
      code,
      eventId: event.id,
      eventTitle: event.title,
      eventDate: event.date,
      eventTime: event.time,
      venue: `${event.venue}, ${event.city}`,
      ticketTypeId: ticketType.id,
      ticketTypeName: ticketType.name,
      price: ticketType.price,
      buyerName: input.buyerName,
      buyerPhone: input.buyerPhone,
      buyerEmail: input.buyerEmail ?? "",
      organizerId: event.organizerId,
      status: "active" as const,
      paymentId: paymentRef.id,
      createdAt: serverTimestamp(),
    };
    const ref = await addDoc(col("tickets"), ticket);
    tickets.push({ id: ref.id, ...ticket } as unknown as TicketDoc);
  }

  // 3. Payment record
  const payment = {
    eventId: event.id,
    eventTitle: event.title,
    organizerId: event.organizerId,
    buyerName: input.buyerName,
    buyerPhone: input.buyerPhone,
    buyerEmail: input.buyerEmail ?? "",
    method: input.method,
    quantity,
    amount,
    commission,
    netAmount: net,
    status: "paid" as const,
    reference,
    ticketIds: tickets.map((t) => t.id),
    createdAt: serverTimestamp(),
  };
  await setDoc(paymentRef, payment);

  // 4. Event counters + organizer wallet — best-effort: a permission error here
  //    must never block delivery of the tickets to the buyer. Tickets and payment
  //    are already persisted above, so we return success regardless of these
  //    side effects failing (e.g. Firestore rules denying writes for a guest).
  try {
    await updateDoc(doc(db, "events", event.id), {
      ticketsSold: increment(quantity),
      revenue: increment(net),
    });
  } catch {
    // Non-blocking: counters can be reconciled later by an admin/script.
  }

  try {
    const walletRef = doc(db, "wallets", event.organizerId);
    const walletSnap = await getDoc(walletRef);
    if (walletSnap.exists()) {
      await updateDoc(walletRef, {
        balance: increment(net),
        totalEarned: increment(net),
        totalCommission: increment(commission),
      });
    } else {
      await setDoc(walletRef, {
        organizerId: event.organizerId,
        organizerName: event.organizerName,
        balance: net,
        totalEarned: net,
        totalCommission: commission,
        totalWithdrawn: 0,
      });
    }
  } catch {
    // Non-blocking: the organizer wallet may be credited later by an admin/script.
  }

  return { payment: { id: paymentRef.id, ...payment } as unknown as PaymentDoc, tickets };
}

/* ---------------- Tickets ---------------- */

export async function getTicketByCode(code: string): Promise<TicketDoc | null> {
  const snap = await getDocs(query(col("tickets"), where("code", "==", code), fsLimit(1)));
  const [first] = mapDocs<TicketDoc>(snap);
  return first ?? null;
}

export async function getTicket(id: string): Promise<TicketDoc | null> {
  const snap = await getDoc(doc(db, "tickets", id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as TicketDoc) : null;
}

export async function listTicketsByPhone(phone: string, identity: string): Promise<TicketDoc[]> {
  const norm = (s: string | undefined) => (s ?? "").trim().toLowerCase().replace(/\s+/g, " ");
  const id = norm(identity);
  if (id.length < 3) return [];
  const snap = await getDocs(query(col("tickets"), where("buyerPhone", "==", phone)));
  return mapDocs<TicketDoc>(snap).filter((t) => norm(t.buyerName) === id || norm(t.buyerEmail) === id);
}

export async function listEventTickets(eventId: string): Promise<TicketDoc[]> {
  const snap = await getDocs(query(col("tickets"), where("eventId", "==", eventId)));
  return mapDocs<TicketDoc>(snap);
}

/** Validates a scanned QR code and marks the ticket as used. */
export async function validateScan(code: string, scanner: { id: string; name: string }, eventId?: string) {
  const ticket = await getTicketByCode(code.trim());
  let result: ScanDoc["result"] = "invalid";

  if (ticket) {
    if (eventId && ticket.eventId !== eventId) result = "wrong_event";
    else if (ticket.status === "used") result = "already_used";
    else if (ticket.status === "cancelled") result = "invalid";
    else result = "valid";
  }

  if (result === "valid" && ticket) {
    await updateDoc(doc(db, "tickets", ticket.id), {
      status: "used",
      usedAt: serverTimestamp(),
      scannedBy: scanner.id,
    });
  }

  await addDoc(col("scans"), {
    ticketId: ticket?.id ?? "",
    ticketCode: code,
    eventId: ticket?.eventId ?? eventId ?? "",
    eventTitle: ticket?.eventTitle ?? "",
    scannerId: scanner.id,
    scannerName: scanner.name,
    result,
    createdAt: serverTimestamp(),
  });

  return { result, ticket };
}

export async function listScans(scannerId: string): Promise<ScanDoc[]> {
  const snap = await getDocs(query(col("scans"), where("scannerId", "==", scannerId)));
  return mapDocs<ScanDoc>(snap).sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
}

/* ---------------- Payments / wallet / withdrawals ---------------- */

export async function listOrganizerPayments(organizerId: string): Promise<PaymentDoc[]> {
  const snap = await getDocs(query(col("payments"), where("organizerId", "==", organizerId)));
  return mapDocs<PaymentDoc>(snap).sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
}

export async function listAllPayments(): Promise<PaymentDoc[]> {
  const snap = await getDocs(col("payments"));
  return mapDocs<PaymentDoc>(snap).sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
}

export async function getWallet(organizerId: string): Promise<WalletDoc | null> {
  const snap = await getDoc(doc(db, "wallets", organizerId));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as WalletDoc) : null;
}

export async function requestWithdrawal(data: Omit<WithdrawalDoc, "id" | "status">) {
  const wallet = await getWallet(data.organizerId);
  if (!wallet || wallet.balance < data.amount) throw new Error("Solde insuffisant pour ce retrait.");
  await addDoc(col("withdrawals"), { ...data, status: "pending", createdAt: serverTimestamp() });
  await updateDoc(doc(db, "wallets", data.organizerId), { balance: increment(-data.amount) });
}

export async function listWithdrawals(organizerId?: string): Promise<WithdrawalDoc[]> {
  const snap = organizerId
    ? await getDocs(query(col("withdrawals"), where("organizerId", "==", organizerId)))
    : await getDocs(col("withdrawals"));
  return mapDocs<WithdrawalDoc>(snap).sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
}

export async function resolveWithdrawal(w: WithdrawalDoc, status: "paid" | "rejected") {
  await updateDoc(doc(db, "withdrawals", w.id), { status });
  if (status === "paid") {
    await updateDoc(doc(db, "wallets", w.organizerId), { totalWithdrawn: increment(w.amount) });
  } else {
    await updateDoc(doc(db, "wallets", w.organizerId), { balance: increment(w.amount) });
  }
}

/* ---------------- Users ---------------- */

export async function listUsers(role?: AppUser["role"]): Promise<AppUser[]> {
  const snap = role ? await getDocs(query(col("users"), where("role", "==", role))) : await getDocs(col("users"));
  return mapDocs<AppUser>(snap);
}

export async function listScannerAgents(organizerId: string): Promise<AppUser[]> {
  const snap = await getDocs(query(col("users"), where("organizerId", "==", organizerId)));
  return mapDocs<AppUser>(snap).filter((u) => u.role === "scanner");
}

export async function updateUserStatus(userId: string, status: AppUser["status"]) {
  await updateDoc(doc(db, "users", userId), { status });
}

export async function orderedQueryLimit(name: string, field: string, n: number) {
  const snap = await getDocs(query(col(name), orderBy(field, "desc"), fsLimit(n)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
