"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Check, X } from "lucide-react";

export default function ListeDemandesAnnulation({ demandes: demandesInitiales }) {
  const supabase = createClient();

  const [demandes, setDemandes] = useState(demandesInitiales);
  const [enCours, setEnCours] = useState(null); // id de la demande en cours de traitement
  const [erreur, setErreur] = useState("");

  async function traiterDemande(demande, decision) {
    setEnCours(demande.id);
    setErreur("");

    try {
      const { error: erreurDemande } = await supabase
        .from("demandes_annulation")
        .update({
          statut: decision, // "validee" ou "refusee"
          traite_le: new Date().toISOString(),
        })
        .eq("id", demande.id);

      if (erreurDemande) throw erreurDemande;

      const nouveauStatutReservation =
        decision === "validee" ? "remboursee" : "confirmee";

      const { error: erreurReservation } = await supabase
        .from("reservations")
        .update({ statut: nouveauStatutReservation })
        .eq("id", demande.reservation_id);

      if (erreurReservation) throw erreurReservation;

      setDemandes((precedent) => precedent.filter((d) => d.id !== demande.id));
    } catch (err) {
      setErreur(err.message || "Une erreur est survenue.");
    } finally {
      setEnCours(null);
    }
  }

  if (demandes.length === 0) {
    return (
      <p className="text-sm text-anthracite-400">
        Aucune demande d'annulation en attente.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {erreur && <p className="text-rouge-500 text-sm">{erreur}</p>}

      {demandes.map((demande) => (
        <div
          key={demande.id}
          className="bg-white border border-anthracite-100 rounded-lg p-4"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-anthracite-800">
                Réservation{" "}
                <span className="font-mono text-xs">
                  {demande.reservation_id}
                </span>
              </p>
              <p className="text-sm text-anthracite-600 mt-1">
                Prix total : {Number(demande.prix_total).toFixed(2)} € —{" "}
                <span className="font-semibold">
                  à rembourser : {Number(demande.montant_rembourse).toFixed(2)} €
                </span>{" "}
                (frais de 20% retenus)
              </p>
              {demande.motif && (
                <p className="text-sm text-anthracite-500 mt-1 italic">
                  Motif : {demande.motif}
                </p>
              )}
            </div>

            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => traiterDemande(demande, "validee")}
                disabled={enCours === demande.id}
                aria-label="Valider le remboursement"
                className="bg-bleu-600 hover:bg-bleu-700 text-white p-2 rounded-md transition disabled:opacity-50"
              >
                <Check size={18} />
              </button>
              <button
                onClick={() => traiterDemande(demande, "refusee")}
                disabled={enCours === demande.id}
                aria-label="Refuser la demande"
                className="bg-rouge-500 hover:bg-rouge-600 text-white p-2 rounded-md transition disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}