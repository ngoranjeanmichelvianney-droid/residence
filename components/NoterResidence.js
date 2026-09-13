"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Star } from "lucide-react";

// À afficher quand la réservation passe en statut "terminée" / résidence
// libérée par le client (ex: dans "mes-reservations", sur la carte de la
// réservation concernée), tant que le client n'a pas déjà laissé d'avis
// pour CETTE réservation précise.
//
// Props attendues :
// - residenceId   : id de la résidence concernée
// - reservationId : id de la réservation terminée (sert à éviter qu'un
//                   même client note plusieurs fois le même séjour)
// - clientId      : id du client connecté
// - onEnvoye      : callback optionnel appelé une fois l'avis enregistré
//                   (ex: pour masquer le formulaire dans le parent)

export default function NoterResidence({ residenceId, reservationId, clientId, onEnvoye }) {
  const supabase = createClient();

  const [note, setNote] = useState(0);
  const [survol, setSurvol] = useState(0);
  const [commentaire, setCommentaire] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [envoye, setEnvoye] = useState(false);

  async function soumettre() {
    if (note === 0) {
      setErreur("Choisissez une note entre 1 et 5 étoiles.");
      return;
    }

    setEnvoi(true);
    setErreur(null);

    const { error } = await supabase.from("avis").insert({
      residence_id: residenceId,
      reservation_id: reservationId,
      client_id: clientId,
      note,
      commentaire: commentaire.trim() || null,
    });

    setEnvoi(false);

    if (error) {
      // Le code 23505 correspond à une violation de contrainte unique :
      // pratique si vous ajoutez une contrainte unique sur reservation_id
      // pour empêcher un second avis sur le même séjour.
      if (error.code === "23505") {
        setErreur("Vous avez déjà noté ce séjour.");
      } else {
        setErreur("Impossible d'enregistrer votre avis. Réessayez.");
      }
      return;
    }

    setEnvoye(true);
    onEnvoye?.();
  }

  if (envoye) {
    return (
      <p className="text-sm text-anthracite-600">
        Merci, votre avis a été enregistré.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-medium text-anthracite-800">
        Comment s'est passé votre séjour ?
      </p>

      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((valeur) => (
          <button
            key={valeur}
            type="button"
            onClick={() => setNote(valeur)}
            onMouseEnter={() => setSurvol(valeur)}
            onMouseLeave={() => setSurvol(0)}
            className="p-0.5 transition-transform hover:scale-110"
            aria-label={`${valeur} étoile${valeur > 1 ? "s" : ""} sur 5`}
          >
            <Star
              size={28}
              className={
                (survol || note) >= valeur
                  ? "fill-jaune-400 text-jaune-400"
                  : "text-anthracite-200"
              }
            />
          </button>
        ))}
      </div>

      <textarea
        value={commentaire}
        onChange={(e) => setCommentaire(e.target.value)}
        placeholder="Un commentaire à ajouter ? (facultatif)"
        rows={3}
        maxLength={500}
        className="w-full rounded-lg border border-anthracite-200 p-2 text-sm text-anthracite-800 focus:outline-none focus:ring-2 focus:ring-anthracite-300"
      />

      {erreur && <p className="text-xs text-red-600">{erreur}</p>}

      <button
        type="button"
        onClick={soumettre}
        disabled={envoi}
        className="self-start rounded-lg bg-anthracite-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {envoi ? "Envoi..." : "Envoyer mon avis"}
      </button>
    </div>
  );
}