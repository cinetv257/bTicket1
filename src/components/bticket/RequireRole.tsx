import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { Role } from "@/lib/types";

export function Loader({ label = "Chargement..." }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-on-surface-variant">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-outline-variant border-t-primary" />
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}

export function EmptyState({ icon, title, hint }: { icon: string; title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-outline-variant bg-surface-container-low px-6 py-12 text-center">
      <span className="material-symbols-outlined text-[32px] text-primary">{icon}</span>
      <p className="font-bold text-on-surface">{title}</p>
      {hint ? <p className="text-sm text-on-surface-variant">{hint}</p> : null}
    </div>
  );
}

export function RequireRole({
  role,
  loginPath,
  children,
}: {
  role: Role;
  loginPath: string;
  children: ReactNode;
}) {
  const { profile, loading } = useAuth();

  if (loading) return <Loader />;

  if (!profile || profile.role !== role) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
        <span className="material-symbols-outlined text-[36px] text-primary">lock</span>
        <h1 className="text-xl font-extrabold text-on-surface">Accès réservé</h1>
        <p className="text-sm text-on-surface-variant">
          Connectez-vous avec un compte {role === "admin" ? "administrateur" : role === "scanner" ? "agent scanner" : "organisateur"} pour continuer.
        </p>
        <Link
          to={loginPath}
          className="rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-soft"
        >
          Se connecter
        </Link>
      </div>
    );
  }

  if (profile.status === "pending") {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
        <span className="material-symbols-outlined text-[36px] text-tertiary">hourglass_top</span>
        <h1 className="text-xl font-extrabold text-on-surface">Compte en attente de validation</h1>
        <p className="text-sm text-on-surface-variant">
          L'équipe bTicket examine votre demande. Vous recevrez l'accès dès l'approbation.
        </p>
        <Link to="/" className="rounded-full bg-surface-container-high px-6 py-3 text-sm font-bold text-on-surface">
          Retour à l'accueil
        </Link>
      </div>
    );
  }

  if (profile.status === "rejected" || profile.status === "suspended") {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
        <span className="material-symbols-outlined text-[36px] text-destructive">block</span>
        <h1 className="text-xl font-extrabold text-on-surface">Compte {profile.status === "rejected" ? "refusé" : "suspendu"}</h1>
        <p className="text-sm text-on-surface-variant">Contactez le support bTicket Burundi pour plus d'informations.</p>
      </div>
    );
  }

  return <>{children}</>;
}
