"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function BanneurValidationCompte({ proprietaireId }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    async function marquerVue() {
      const supabase = createClient();
      await supabase
        .from("proprietaires")
        .update({ validation_vue: true })
        .eq("id", proprietaireId);
    }
    marquerVue();
  }, [proprietaireId]);

  if (!visible) return null;

  return (
    <div className="bg-jaune-50 border border-jaune-300 rounded-lg p-4 mb-6 flex items-center justify-between">
      <p className="text-sm text-anthracite-700">
        <span className="font-semibold">Bonne nouvelle !</span> Votre compte a
        été validé par l&apos;administrateur. Vous pouvez maintenant publier
        vos résidences.
      </p>
      <button
        onClick={() => setVisible(false)}
        className="text-anthracite-400 hover:text-anthracite-600 text-sm ml-4"
        aria-label="Fermer"
      >
        ✕
      </button>
    </div>
  );
}