"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import emailjs from "@emailjs/browser";

// À remplir une fois le nom de domaine et le compte EmailJS configurés
const EMAILJS_SERVICE_ID = "TON_SERVICE_ID";
const EMAILJS_TEMPLATE_ID = "TON_TEMPLATE_ID";
const EMAILJS_PUBLIC_KEY = "TA_PUBLIC_KEY";

export default function ProprietaireActions({ id, nom, email }) {
  const router = useRouter();
  const supabase = createClient();

  async function changerStatut(statut) {
    const updates = { statut };

    // Si validation, on marque la bannière de bienvenue à afficher côté propriétaire
    if (statut === "actif") {
      updates.validation_vue = false;
    }

    await supabase.from("proprietaires").update(updates).eq("id", id);

    if (statut === "actif") {
      try {
        await emailjs.send(
          EMAILJS_SERVICE_ID,
          EMAILJS_TEMPLATE_ID,
          {
            to_name: nom,
            to_email: email,
          },
          EMAILJS_PUBLIC_KEY
        );
      } catch (err) {
        // On n'empêche pas la validation si l'email échoue (ex: pas encore configuré)
        console.error("Erreur envoi email de validation :", err);
      }
    }

    router.refresh();
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => changerStatut("actif")}
        className="bg-bleu-600 hover:bg-bleu-700 text-white text-sm font-medium px-3 py-1.5 rounded-md transition"
      >
        Valider
      </button>
      <button
        onClick={() => changerStatut("refuse")}
        className="bg-rouge-500 hover:bg-rouge-600 text-white text-sm font-medium px-3 py-1.5 rounded-md transition"
      >
        Refuser
      </button>
    </div>
  );
}