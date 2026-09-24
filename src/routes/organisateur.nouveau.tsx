import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { DashboardShell, organizerNav } from "@/components/bticket/DashboardShell";
import { Field, Select, TextArea } from "@/components/bticket/Field";
import { RequireRole } from "@/components/bticket/RequireRole";
import { useAuth } from "@/hooks/useAuth";
import { createEvent } from "@/lib/bticket";
import { uploadImage } from "@/lib/imgbb";

export const Route = createFileRoute("/organisateur/nouveau")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Créer un événement — bTicket Burundi" },
      { name: "description", content: "Publiez un nouvel événement sur bTicket Burundi avec affiche et billetterie." },
      { property: "og:title", content: "Créer un événement — bTicket Burundi" },
      { property: "og:description", content: "Formulaire de création d'événement pour organisateurs bTicket." },
    ],
  }),
  component: () => (
    <RequireRole role="organizer" loginPath="/organisateur/connexion">
      <NewEvent />
    </RequireRole>
  ),
});

const CATEGORIES = ["Concert", "Festival", "Sport", "Conférence", "Théâtre", "Autre"];

const schema = z.object({
  title: z.string().trim().min(4, "Titre trop court").max(100),
  description: z.string().trim().min(20, "Décrivez l'événement (20 caractères minimum)").max(2000),
  venue: z.string().trim().min(2, "Lieu requis").max(100),
  city: z.string().trim().min(2, "Ville requise").max(60),
  date: z.string().min(1, "Date requise"),
  time: z.string().min(1, "Heure requise"),
});

function NewEvent() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    description: "",
    venue: "",
    city: "Bujumbura",
    date: "",
    time: "19:00",
  });
  const [category, setCategory] = useState(CATEGORIES[0]!);
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);

  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function onFile(file: File | undefined) {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Image trop lourde (8 Mo maximum)");
      return;
    }
    setUploading(true);
    try {
      setImageUrl(await uploadImage(file));
      toast.success("Affiche téléversée");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Téléversement impossible");
    } finally {
      setUploading(false);
    }
  }

  async function submit(status: "draft" | "pending") {
    if (!profile) return;
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Formulaire invalide");
      return;
    }
    if (!imageUrl) {
      toast.error("Ajoutez une affiche pour votre événement");
      return;
    }
    setBusy(true);
    try {
      const id = await createEvent({
        ...parsed.data,
        category,
        imageUrl,
        organizerId: profile.id,
        organizerName: profile.organizationName || profile.fullName,
        status,
      });
      toast.success(status === "pending" ? "Événement soumis à validation" : "Brouillon enregistré");
      navigate({ to: "/organisateur/evenement/$id", params: { id } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Création impossible");
    } finally {
      setBusy(false);
    }
  }

  return (
    <DashboardShell title="Créer un événement" nav={organizerNav}>
      <div className="space-y-4 rounded-3xl bg-surface-container-lowest p-5 shadow-soft">
        <div>
          <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-on-surface-variant">Affiche</span>
          <label className="flex h-44 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-outline-variant bg-surface-container-low">
            {imageUrl ? (
              <img src={imageUrl} alt="Affiche" className="h-full w-full object-cover" />
            ) : (
              <span className="flex flex-col items-center gap-1 text-on-surface-variant">
                <span className="material-symbols-outlined text-[28px] text-primary">add_photo_alternate</span>
                <span className="text-xs font-semibold">{uploading ? "Téléversement..." : "Choisir une image"}</span>
              </span>
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onFile(e.target.files?.[0])}
            />
          </label>
        </div>

        <Field label="Titre" value={form.title} onChange={set("title")} placeholder="Festival Karibu Live 2026" />
        <TextArea
          label="Description"
          value={form.description}
          onChange={set("description")}
          placeholder="Programme, artistes, informations pratiques..."
        />
        <Select label="Catégorie" value={category} onChange={setCategory} options={CATEGORIES} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Lieu" value={form.venue} onChange={set("venue")} placeholder="Stade Intwari" />
          <Field label="Ville" value={form.city} onChange={set("city")} placeholder="Bujumbura" />
          <Field label="Date" value={form.date} onChange={set("date")} type="date" />
          <Field label="Heure" value={form.time} onChange={set("time")} type="time" />
        </div>

        <div className="flex flex-col gap-2 pt-2 sm:flex-row">
          <button
            onClick={() => submit("draft")}
            disabled={busy}
            className="flex-1 rounded-full bg-surface-container-high py-3.5 text-sm font-extrabold text-on-surface disabled:opacity-60"
          >
            Enregistrer en brouillon
          </button>
          <button
            onClick={() => submit("pending")}
            disabled={busy}
            className="flex-1 rounded-full bg-primary py-3.5 text-sm font-extrabold text-primary-foreground shadow-soft disabled:opacity-60"
          >
            {busy ? "Envoi..." : "Soumettre à validation"}
          </button>
        </div>
      </div>
    </DashboardShell>
  );
}
