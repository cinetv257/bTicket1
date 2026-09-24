import { createFileRoute } from "@tanstack/react-router";
import { LoginCard } from "@/components/bticket/LoginCard";

export const Route = createFileRoute("/admin/connexion")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Connexion administrateur — bTicket Burundi" },
      { name: "description", content: "Espace d'administration bTicket : validations, paiements et retraits." },
      { property: "og:title", content: "Connexion administrateur — bTicket Burundi" },
      { property: "og:description", content: "Pilotage de la plateforme de billetterie bTicket Burundi." },
    ],
  }),
  component: () => (
    <LoginCard
      title="Administration bTicket"
      subtitle="Réservé à l'équipe bTicket Burundi."
      role="admin"
      redirectTo="/admin"
    />
  ),
});
