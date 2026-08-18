"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResidenceDeleteAction({ id, titre }) {
  const [confirmation, setConfirmation] = useState(false);
  const [suppression, setSuppression] = useState(false);
  const router = useRouter();

  async function supprimer() {
    setSuppression(true);
    const supabase = createClient();
    await supabase.from("residences").delete().eq("id", id);
    setSuppression(false);
    router.refresh();
  }

  if (confirmation) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-anthracite-500">Supprimer {titre} ?</span>
        <button
          onClick={supprimer}
          disabled={suppression}
          className="bg-rouge-500 hover:bg-rouge-600 text-white text-xs font-medium px-3 py-1.5 rounded-md transition disabled:opacity-50"
        >
          {suppression ? "..." : "Confirmer"}
        </button>
        <button
          onClick={() => setConfirmation(false)}
          className="text-anthracite-400 text-xs px-2 py-1.5 hover:text-anthracite-600"
        >
          Annuler
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setConfirmation(true);
      }}
      className="text-rouge-500 hover:text-rouge-600 text-xs font-medium px-2 py-1"
    >
      Supprimer
    </button>
  );
}