"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ProprietaireActions({ id, nom }) {
  const router = useRouter();
  const supabase = createClient();
  const [erreur, setErreur] = useState("");

  async function changerStatut(statut) {
    setErreur("");

    const { error } = await supabase
      .from("proprietaires")
      .update({ statut })
      .eq("id", id);

    if (error) {
      setErreur("Erreur : " + error.message);
      return;
    }

    router.refresh();
  }

  return (
    <div>
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
      {erreur && <p className="text-rouge-500 text-xs mt-1">{erreur}</p>}
    </div>
  );
}