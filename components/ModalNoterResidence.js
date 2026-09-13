"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Star, X } from "lucide-react";

// Modal affichée par-dessus l'écran, déclenchée par VerificationAvisEnAttente
// quand le client a une réservation terminée sans avis. Le client peut noter
// (envoi + fermeture automatique) ou fermer sans rien donner ("Plus tard").

export default function ModalNoterResidence({ residence, reservationId, clientId, onFerme }) {
  const supabase = createClient();

  const [note, setNote] = useState(0);
  const [survol, setSurvol] = useState(0);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState(null);

  async function soumettre() {
    if (note === 0) {
      setErreur("Choisissez une note entre 1 et 5 étoiles.");
      return;
    }

    setEnvoi(true);
    setErreur(null);

    const { error } = await supabase.from("avis").insert({
      residence_id: residence.id,
      reservation_id: reservationId,
      client_id: clientId,
      note,
    });

    setEnvoi(false);

    if (error) {
      setErreur(
        error.code === "23505"
          ? "Vous avez déjà noté ce séjour."
          : "Impossible d'enregistrer votre avis. Réessayez."
      );
      return;
    }

    onFerme(); // disparaît automatiquement une fois l'avis envoyé
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <button
          type="button"
          onClick={onFerme}
          aria-label="Fermer"
          className="absolute right-4 top-4 text-anthracite-400 hover:text-anthracite-600"
        >
          <X size={20} />
        </button>

        <p className="text-xs font-medium text-anthracite-400 mb-1">
          Séjour terminé
        </p>
        <h2 className="text-lg font-bold text-anthracite-800 mb-4 pr-6">
          {residence.titre}
        </h2>

        <p className="text-sm text-anthracite-600 mb-3">
          Comment s'est passé votre séjour ?
        </p>

        <div className="flex items-center gap-1 mb-4">
          {[1, 2, 3, 4, 5].map((valeur) => (
            <button
              key={valeur}
              type="button"
              onClick={() => setNote(valeur)}
              onMouseEnter={() => setSurvol(valeur)}
              onMouseLeave={() => setSurvol(0)}
              className="p-0.5"
              aria-label={`${valeur} étoile${valeur > 1 ? "s" : ""} sur 5`}
            >
              <Star
                size={32}
                className={
                  (survol || note) >= valeur
                    ? "fill-jaune-400 text-jaune-400"
                    : "text-anthracite-200"
                }
              />
            </button>
          ))}
        </div>

        {erreur && <p className="text-xs text-red-600 mb-3">{erreur}</p>}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onFerme}
            className="flex-1 rounded-lg border border-anthracite-200 py-2 text-sm font-medium text-anthracite-600"
          >
            Plus tard
          </button>
          <button
            type="button"
            onClick={soumettre}
            disabled={envoi}
            className="flex-1 rounded-lg bg-anthracite-900 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {envoi ? "Envoi..." : "Envoyer"}
          </button>
        </div>
      </div>
    </div>
  );
}