import { createFileRoute } from "@tanstack/react-router";
import { LoginCard } from "@/components/bticket/LoginCard";

export const Route = createFileRoute("/scanner/connexion")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Connexion agent scanner — bTicket Burundi" },
      { name: "description", content: "Espace agent bTicket : validez les tickets à l'entrée de l'événement." },
      { property: "og:title", content: "Connexion agent scanner — bTicket Burundi" },
      { property: "og:description", content: "Contrôle d'accès par QR code pour les événements bTicket." },
    ],
  }),
  component: () => (
    <LoginCard
      title="Espace Agent Scanner"
      subtitle="Connectez-vous avec le compte fourni par votre organisateur."
      role="scanner"
      redirectTo="/scanner"
    />
  ),
});
