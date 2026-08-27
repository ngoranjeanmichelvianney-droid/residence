"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Star } from "lucide-react";

export default function NoteResidence({ residenceId }) {
  const supabase = createClient();

  const [moyenne, setMoyenne] = useState(0);
  const [nombreAvis, setNombreAvis] = useState(0);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    async function chargerAvis() {
      const { data, error } = await supabase
        .from("avis")
        .select("note")
        .eq("residence_id", residenceId);

      if (!error && data && data.length > 0) {
        const total = data.reduce((somme, item) => somme + item.note, 0);
        setMoyenne(total / data.length);
        setNombreAvis(data.length);
      }

      setChargement(false);
    }

    if (residenceId) chargerAvis();
  }, [residenceId]);

  if (chargement) return null;

  if (nombreAvis === 0) {
    return (
      <p className="text-xs text-anthracite-400">Aucun avis pour le moment</p>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((valeur) => (
          <Star
            key={valeur}
            size={16}
            className={
              moyenne >= valeur - 0.5
                ? "fill-jaune-400 text-jaune-400"
                : "text-anthracite-200"
            }
          />
        ))}
      </div>
      <span className="text-sm font-semibold text-anthracite-800">
        {moyenne.toFixed(1)}
      </span>
      <span className="text-xs text-anthracite-400">
        ({nombreAvis} avis)
      </span>
    </div>
  );
}