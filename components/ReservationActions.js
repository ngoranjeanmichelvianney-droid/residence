"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ReservationActions({ id, residenceId, statut }) {
  const router = useRouter();
  const supabase = createClient();

  async function changerStatut(nouveauStatut) {
    await supabase.from("reservations").update({ statut: nouveauStatut }).eq("id", id);

    // Refusée ou terminée : la résidence redevient disponible
    if (nouveauStatut === "refusee" || nouveauStatut === "terminee") {
      await supabase
        .from("residences")
        .update({ disponible: true })
        .eq("id", residenceId);
    }

    router.refresh();
  }

  if (statut === "en_attente") {
    return (
      <div className="flex gap-2">
        <button
          onClick={() => changerStatut("confirmee")}
          className="bg-bleu-600 hover:bg-bleu-700 text-white text-sm font-medium px-4 py-2 rounded-md transition"
        >
          Confirmer
        </button>
        <button
          onClick={() => changerStatut("refusee")}
          className="bg-rouge-500 hover:bg-rouge-600 text-white text-sm font-medium px-4 py-2 rounded-md transition"
        >
          Refuser
        </button>
      </div>
    );
  }

  if (statut === "confirmee") {
    return (
      <button
        onClick={() => changerStatut("terminee")}
        className="bg-jaune-400 hover:bg-jaune-500 text-anthracite-800 text-sm font-medium px-4 py-2 rounded-md transition"
      >
        Marquer comme terminée
      </button>
    );
  }

  return null;
}