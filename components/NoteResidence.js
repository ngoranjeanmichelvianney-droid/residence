"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Star } from "lucide-react";

// Note de départ affichée en l'absence (ou quasi-absence) d'avis réels,
// et "poids" de cette note de départ exprimé en nombre d'avis fictifs
// équivalents : plus POIDS_DEPART est grand, plus il faut d'avis réels
// pour faire bouger sensiblement la moyenne affichée.
const NOTE_DEPART = 4;
const POIDS_DEPART = 8;

export default function NoteResidence({ residenceId }) {
  const supabase = createClient();

  const [moyenne, setMoyenne] = useState(NOTE_DEPART);
  const [nombreAvis, setNombreAvis] = useState(0);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    async function chargerAvis() {
      const { data, error } = await supabase
        .from("avis")
        .select("note")
        .eq("residence_id", residenceId);

      if (!error && data) {
        const nombreReel = data.length;
        const totalReel = data.reduce((somme, item) => somme + item.note, 0);

        // Moyenne pondérée : mélange la note de départ (comme si
        // POIDS_DEPART avis fictifs à NOTE_DEPART existaient déjà) avec
        // les vrais avis. Avec 0 avis réel -> exactement NOTE_DEPART.
        // Plus les avis réels s'accumulent, plus leur poids l'emporte.
        const moyennePonderee =
          (POIDS_DEPART * NOTE_DEPART + totalReel) / (POIDS_DEPART + nombreReel);

        setMoyenne(Math.min(moyennePonderee, 5));
        setNombreAvis(nombreReel);
      }

      setChargement(false);
    }

    if (residenceId) chargerAvis();
  }, [residenceId]);

  if (chargement) return null;

  // Style compact façon Yango : une seule étoile pleine + le chiffre,
  // et le nombre d'avis en petit à côté seulement s'il y en a.
  return (
    <div className="flex items-center gap-1">
      <Star size={14} className="fill-jaune-400 text-jaune-400 shrink-0" />
      <span className="text-sm font-semibold text-anthracite-800">
        {moyenne.toFixed(1)}
      </span>
      {nombreAvis > 0 && (
        <span className="text-xs text-anthracite-400">
          ({nombreAvis} avis)
        </span>
      )}
    </div>
  );
}