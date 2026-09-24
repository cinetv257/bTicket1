import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Field } from "@/components/bticket/Field";
import { Logo } from "@/components/bticket/Logo";
import { readableAuthError } from "@/components/bticket/LoginCard";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/organisateur/inscription")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Devenir organisateur — bTicket Burundi" },
      { name: "description", content: "Créez votre compte organisateur bTicket et vendez vos tickets au Burundi." },
      { property: "og:title", content: "Devenir organisateur — bTicket Burundi" },
      { property: "og:description", content: "Publiez vos événements et encaissez vos ventes avec bTicket." },
    ],
  }),
  component: SignUp,
});

const schema = z.object({
  fullName: z.string().trim().min(3, "Nom complet requis").max(80),
  organizationName: z.string().trim().min(2, "Nom de l'organisation requis").max(80),
  phone: z.string().trim().regex(/^(\+257)?[0-9]{8}$/, "Numéro burundais invalide"),
  email: z.string().trim().email("Email invalide").max(120),
  password: z.string().min(6, "6 caractères minimum").max(64),
});

function SignUp() {
  const { signUpOrganizer } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: "", organizationName: "", phone: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);

  async function submit() {
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Formulaire invalide");
      return;
    }
    setBusy(true);
    try {
      await signUpOrganizer(parsed.data);
      toast.success("Compte créé ! Il sera actif après validation par bTicket.");
      navigate({ to: "/organisateur" });
    } catch (e) {
      toast.error(readableAuthError(e));
    } finally {
      setBusy(false);
    }
  }

  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <Logo className="scale-125" />
          <h1 className="text-xl font-extrabold text-on-surface">Devenir organisateur</h1>
          <p className="text-sm text-on-surface-variant">
            Votre compte est vérifié par l'équipe bTicket avant la mise en vente.
          </p>
        </div>
        <div className="space-y-3 rounded-3xl bg-surface-container-lowest p-6 shadow-elevated">
          <Field label="Nom complet" value={form.fullName} onChange={set("fullName")} placeholder="Jean Ndayisenga" />
          <Field
            label="Organisation"
            value={form.organizationName}
            onChange={set("organizationName")}
            placeholder="Burundi Live Events"
          />
          <Field label="Téléphone" value={form.phone} onChange={set("phone")} placeholder="79123456" inputMode="tel" />
          <Field label="Email" value={form.email} onChange={set("email")} placeholder="vous@email.com" inputMode="email" />
          <Field label="Mot de passe" value={form.password} onChange={set("password")} type="password" placeholder="••••••••" />
          <button
            onClick={submit}
            disabled={busy}
            className="mt-2 w-full rounded-full bg-primary py-3.5 text-sm font-extrabold text-primary-foreground shadow-soft disabled:opacity-60"
          >
            {busy ? "Création..." : "Créer mon compte"}
          </button>
          <p className="pt-1 text-center text-xs text-on-surface-variant">
            Déjà inscrit ?{" "}
            <Link to="/organisateur/connexion" className="font-bold text-primary">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
