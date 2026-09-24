import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import type { Role } from "@/lib/types";
import { Field } from "./Field";
import { Logo } from "./Logo";

export function LoginCard({
  title,
  subtitle,
  role,
  redirectTo,
  footer,
  extraRoles,
}: {
  title: string;
  subtitle: string;
  role: Role;
  redirectTo: string;
  footer?: ReactNode;
  /** Rôles supplémentaires acceptés discrètement sur cet écran, avec leur destination. */
  extraRoles?: Partial<Record<Role, string>>;
}) {
  const { signIn, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  function targetFor(r: Role): string | null {
    if (r === role) return redirectTo;
    return extraRoles?.[r] ?? null;
  }

  useEffect(() => {
    if (loading || !profile) return;
    const target = targetFor(profile.role);
    if (target) navigate({ to: target, replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, profile, role, redirectTo, navigate]);

  async function submit() {
    if (!email.trim() || password.length < 6) {
      toast.error("Email et mot de passe (6 caractères minimum) requis");
      return;
    }
    setBusy(true);
    try {
      const profile = await signIn(email, password);
      const target = targetFor(profile.role);
      if (!target) {
        toast.error("Ce compte n'a pas le rôle requis pour cet espace.");
        return;
      }
      toast.success(`Bienvenue ${profile.fullName || profile.email}`);
      navigate({ to: target });
    } catch (e) {
      toast.error(readableAuthError(e));
    } finally {
      setBusy(false);
    }
  }


  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <Logo className="scale-125" />
          <h1 className="text-xl font-extrabold text-on-surface">{title}</h1>
          <p className="text-sm text-on-surface-variant">{subtitle}</p>
        </div>

        <div className="space-y-3 rounded-3xl bg-surface-container-lowest p-6 shadow-elevated">
          <Field label="Email" value={email} onChange={setEmail} placeholder="vous@email.com" inputMode="email" />
          <Field label="Mot de passe" value={password} onChange={setPassword} type="password" placeholder="••••••••" />
          <button
            onClick={submit}
            disabled={busy}
            className="mt-2 w-full rounded-full bg-primary py-3.5 text-sm font-extrabold text-primary-foreground shadow-soft disabled:opacity-60"
          >
            {busy ? "Connexion..." : "Se connecter"}
          </button>
          {footer}
        </div>
      </div>
    </div>
  );
}

export function readableAuthError(e: unknown): string {
  const code = typeof e === "object" && e && "code" in e ? String((e as { code: string }).code) : "";
  if (code.includes("invalid-credential") || code.includes("wrong-password") || code.includes("user-not-found"))
    return "Email ou mot de passe incorrect.";
  if (code.includes("email-already-in-use")) return "Cet email est déjà utilisé.";
  if (code.includes("weak-password")) return "Mot de passe trop faible (6 caractères minimum).";
  if (code.includes("too-many-requests")) return "Trop de tentatives, réessayez plus tard.";
  if (code.includes("network")) return "Connexion internet indisponible.";
  return e instanceof Error ? e.message : "Une erreur est survenue.";
}
