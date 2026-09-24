import { createFileRoute } from "@tanstack/react-router";
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { DashboardShell, organizerNav } from "@/components/bticket/DashboardShell";
import { Field } from "@/components/bticket/Field";
import { readableAuthError } from "@/components/bticket/LoginCard";
import { EmptyState, Loader, RequireRole } from "@/components/bticket/RequireRole";
import { StatusChip } from "@/components/bticket/StatusChip";
import { useAuth } from "@/hooks/useAuth";
import { listScannerAgents, updateUserStatus } from "@/lib/bticket";
import { db, getSecondaryAuth } from "@/lib/firebase";
import type { AppUser } from "@/lib/types";

export const Route = createFileRoute("/organisateur/agents")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Agents scanner — bTicket Burundi" },
      { name: "description", content: "Créez et gérez les comptes agents qui scannent les tickets à l'entrée." },
      { property: "og:title", content: "Agents scanner — bTicket Burundi" },
      { property: "og:description", content: "Contrôle d'accès : vos agents valident les QR codes en temps réel." },
    ],
  }),
  component: () => (
    <RequireRole role="organizer" loginPath="/organisateur/connexion">
      <Agents />
    </RequireRole>
  ),
});

const schema = z.object({
  fullName: z.string().trim().min(3, "Nom de l'agent requis").max(80),
  email: z.string().trim().email("Email invalide").max(120),
  phone: z.string().trim().regex(/^(\+257)?[0-9]{8}$/, "Numéro burundais invalide"),
  password: z.string().min(6, "6 caractères minimum").max(64),
});

function Agents() {
  const { profile } = useAuth();
  const [agents, setAgents] = useState<AppUser[] | null>(null);
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", password: "" });
  const [busy, setBusy] = useState(false);

  const reload = useCallback(() => {
    if (profile) listScannerAgents(profile.id).then(setAgents);
  }, [profile]);

  useEffect(reload, [reload]);

  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function createAgent() {
    if (!profile) return;
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Formulaire invalide");
      return;
    }
    setBusy(true);
    const secondary = getSecondaryAuth();
    try {
      const cred = await createUserWithEmailAndPassword(secondary, parsed.data.email, parsed.data.password);
      await setDoc(doc(db, "users", cred.user.uid), {
        email: parsed.data.email,
        fullName: parsed.data.fullName,
        phone: parsed.data.phone,
        role: "scanner",
        status: "approved",
        organizerId: profile.id,
        createdAt: serverTimestamp(),
      });
      await signOut(secondary);
      setForm({ fullName: "", email: "", phone: "", password: "" });
      toast.success("Agent créé, il peut se connecter à l'espace scanner.");
      reload();
    } catch (e) {
      toast.error(readableAuthError(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <DashboardShell title="Agents scanner" nav={organizerNav}>
      {!agents ? (
        <Loader />
      ) : agents.length === 0 ? (
        <EmptyState icon="badge" title="Aucun agent" hint="Créez un compte agent pour contrôler les entrées." />
      ) : (
        <div className="space-y-3">
          {agents.map((a) => (
            <div key={a.id} className="flex items-center justify-between gap-3 rounded-2xl bg-surface-container-lowest p-4 shadow-soft">
              <div className="min-w-0">
                <p className="truncate font-extrabold text-on-surface">{a.fullName}</p>
                <p className="truncate text-xs text-on-surface-variant">
                  {a.email} · {a.phone}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StatusChip status={a.status} />
                <button
                  onClick={async () => {
                    const next = a.status === "approved" ? "suspended" : "approved";
                    await updateUserStatus(a.id, next);
                    toast.success(next === "approved" ? "Agent réactivé" : "Agent suspendu");
                    reload();
                  }}
                  className="rounded-full bg-surface-container-high px-3 py-1.5 text-[11px] font-extrabold text-on-surface"
                >
                  {a.status === "approved" ? "Suspendre" : "Réactiver"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-5 space-y-3 rounded-3xl bg-surface-container-low p-5">
        <h3 className="font-extrabold text-on-surface">Nouvel agent</h3>
        <Field label="Nom complet" value={form.fullName} onChange={set("fullName")} placeholder="Agent Nshimirimana" />
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Email" value={form.email} onChange={set("email")} inputMode="email" placeholder="agent@email.com" />
          <Field label="Téléphone" value={form.phone} onChange={set("phone")} inputMode="tel" placeholder="79123456" />
        </div>
        <Field label="Mot de passe" value={form.password} onChange={set("password")} type="password" placeholder="••••••••" />
        <button
          onClick={createAgent}
          disabled={busy}
          className="w-full rounded-full bg-primary py-3.5 text-sm font-extrabold text-primary-foreground disabled:opacity-60"
        >
          {busy ? "Création..." : "Créer l'agent"}
        </button>
      </div>
    </DashboardShell>
  );
}
