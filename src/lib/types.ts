import type { Timestamp } from "firebase/firestore";

export type Role = "admin" | "organizer" | "scanner";

export interface AppUser {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: Role;
  organizationName?: string;
  /** Organizers must be approved by an admin before publishing. */
  status: "pending" | "approved" | "rejected" | "suspended";
  /** For scanner agents: the organizer that created them. */
  organizerId?: string;
  createdAt?: Timestamp;
}

export type EventStatus = "draft" | "pending" | "approved" | "rejected";

export interface EventDoc {
  id: string;
  title: string;
  description: string;
  category: string;
  venue: string;
  city: string;
  date: string; // ISO date
  time: string; // HH:mm
  imageUrl: string;
  organizerId: string;
  organizerName: string;
  status: EventStatus;
  rejectionReason?: string;
  ticketsSold: number;
  revenue: number;
  createdAt?: Timestamp;
}

export interface TicketType {
  id: string;
  eventId: string;
  name: string;
  price: number; // BIF
  quantity: number;
  sold: number;
  description?: string;
  color?: string;
}

export interface TicketDoc {
  id: string;
  code: string; // unique QR payload
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  venue: string;
  ticketTypeId: string;
  ticketTypeName: string;
  price: number;
  buyerName: string;
  buyerPhone: string;
  buyerEmail?: string;
  organizerId: string;
  status: "active" | "used" | "cancelled";
  usedAt?: Timestamp;
  scannedBy?: string;
  paymentId: string;
  createdAt?: Timestamp;
}

export type PaymentMethod = "lumicash" | "ecocash" | "bancobu" | "card";

export interface PaymentDoc {
  id: string;
  eventId: string;
  eventTitle: string;
  organizerId: string;
  buyerName: string;
  buyerPhone: string;
  buyerEmail?: string;
  method: PaymentMethod;
  quantity: number;
  amount: number;
  commission: number;
  netAmount: number;
  status: "pending" | "paid" | "failed" | "refunded";
  reference: string;
  ticketIds: string[];
  createdAt?: Timestamp;
}

export interface WalletDoc {
  id: string; // organizerId
  organizerId: string;
  organizerName: string;
  balance: number;
  totalEarned: number;
  totalCommission: number;
  totalWithdrawn: number;
}

export interface WithdrawalDoc {
  id: string;
  organizerId: string;
  organizerName: string;
  amount: number;
  method: string;
  accountNumber: string;
  accountName?: string;
  status: "pending" | "approved" | "rejected" | "paid";
  createdAt?: Timestamp;
}

export interface ScanDoc {
  id: string;
  ticketId: string;
  ticketCode: string;
  eventId: string;
  eventTitle: string;
  scannerId: string;
  scannerName: string;
  result: "valid" | "already_used" | "invalid" | "wrong_event";
  createdAt?: Timestamp;
}
