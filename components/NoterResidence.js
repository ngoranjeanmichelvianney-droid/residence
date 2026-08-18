"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Star } from "lucide-react";

export default function NoterResidence({ residenceId, clientId, reservationId }) {
  const router = useRouter();
  const supabase = createClient();

  const [note, setNote] = useState(0);
  const [survol, setSurvol] = useState(0);
  const [commentaire, setCommentaire] = useState("");
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState("");
  const [envoye, setEnvoye] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErreur("");

    if (note === 0) {
      setErreur("Merci de choisir une note.");
      return;
    }

    setChargement(true);

    try {
      const { error } = await supabase.from("avis").insert({
        residence_id: residenceId,
        client_id: clientId,
        reservation_id: reservationId,
        note,
        commentaire: commentaire || null,
      });

      if (error) throw error;

      setEnvoye(true);
      router.refresh();
    } catch (err) {
      setErreur(err.message || "Une erreur est survenue.");
    } finally {
      setChargement(false);
    }
  }

  if (envoye) {
    return (
      <div className="bg-bleu-50 border border-bleu-100 rounded-lg p-4 text-sm text-bleu-700">
        Merci pour votre avis !
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-anthracite-100 rounded-lg p-5"
    >
      <h3 className="font-semibold text-anthracite-800 mb-3">
        Laisser un avis sur cette résidence
      </h3>

      <div className="flex items-center gap-1 mb-4">
        {[1, 2, 3, 4, 5].map((valeur) => (
          <button
            key={valeur}
            type="button"
            onClick={() => setNote(valeur)}
            onMouseEnter={() => setSurvol(valeur)}
            onMouseLeave={() => setSurvol(0)}
            aria-label={`${valeur} étoile${valeur > 1 ? "s" : ""}`}
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
        rows={3}
        value={commentaire}
        onChange={(e) => setCommentaire(e.target.value)}
        placeholder="Votre commentaire (optionnel)"
        className="w-full border border-anthracite-100 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bleu-500"
      />

      {erreur && <p className="text-rouge-500 text-sm mt-2">{erreur}</p>}

      <button
        type="submit"
        disabled={chargement}
        className="mt-3 bg-bleu-600 hover:bg-bleu-700 text-white font-semibold px-5 py-2 rounded-md transition disabled:opacity-50"
      >
        {chargement ? "Envoi..." : "Envoyer mon avis"}
      </button>
    </form>
  );
}