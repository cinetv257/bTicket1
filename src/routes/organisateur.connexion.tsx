import { createFileRoute, Link } from "@tanstack/react-router";
import { LoginCard } from "@/components/bticket/LoginCard";

export const Route = createFileRoute("/organisateur/connexion")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Connexion organisateur — bTicket Burundi" },
      { name: "description", content: "Espace organisateur bTicket : gérez vos événements, ventes et revenus." },
      { property: "og:title", content: "Connexion organisateur — bTicket Burundi" },
      { property: "og:description", content: "Accédez à votre tableau de bord organisateur bTicket." },
    ],
  }),
  component: () => (
    <LoginCard
      title="Espace Organisateur"
      subtitle="Gérez vos événements, vos ventes et vos revenus."
      role="organizer"
      redirectTo="/organisateur"
      extraRoles={{ admin: "/admin" }}

      footer={
        <p className="pt-2 text-center text-xs text-on-surface-variant">
          Pas encore de compte ?{" "}
          <Link to="/organisateur/inscription" className="font-bold text-primary">
            Créer un compte organisateur
          </Link>
        </p>
      }
    />
  ),
});
