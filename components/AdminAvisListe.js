"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Star, Trash2 } from "lucide-react";

export default function AdminAvisListe({ avis: avisInitiaux }) {
  const supabase = createClient();
  const [avis, setAvis] = useState(avisInitiaux);
  const [suppressionEnCours, setSuppressionEnCours] = useState(null);
  const [erreur, setErreur] = useState("");

  async function supprimerAvis(id) {
    setSuppressionEnCours(id);
    setErreur("");

    const { error } = await supabase.from("avis").delete().eq("id", id);

    if (error) {
      setErreur("Impossible de supprimer cet avis.");
    } else {
      setAvis((precedent) => precedent.filter((a) => a.id !== id));
    }

    setSuppressionEnCours(null);
  }

  if (avis.length === 0) {
    return <p className="text-sm text-anthracite-400">Aucun avis pour le moment.</p>;
  }

  return (
    <div className="space-y-3">
      {erreur && <p className="text-rouge-500 text-sm">{erreur}</p>}

      {avis.map((item) => (
        <div
          key={item.id}
          className="bg-white border border-anthracite-100 rounded-lg p-4"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-1 mb-1">
                {[1, 2, 3, 4, 5].map((valeur) => (
                  <Star
                    key={valeur}
                    size={16}
                    className={
                      item.note >= valeur
                        ? "fill-jaune-400 text-jaune-400"
                        : "text-anthracite-200"
                    }
                  />
                ))}
                <span className="text-xs text-anthracite-400 ml-2">
                  Résidence : {item.residence_id}
                </span>
              </div>
              {item.commentaire && (
                <p className="text-sm text-anthracite-700 mt-1">
                  {item.commentaire}
                </p>
              )}
            </div>

            <button
              onClick={() => supprimerAvis(item.id)}
              disabled={suppressionEnCours === item.id}
              aria-label="Supprimer cet avis"
              className="text-rouge-500 hover:text-rouge-600 p-1 disabled:opacity-50"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}