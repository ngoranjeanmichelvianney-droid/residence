"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AlertTriangle } from "lucide-react";

export default function DemandeAnnulation({
  reservationId,
  clientId,
  prixTotal,
}) {
  const router = useRouter();
  const supabase = createClient();

  const [ouvert, setOuvert] = useState(false);
  const [motif, setMotif] = useState("");
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState("");
  const [envoye, setEnvoye] = useState(false);

  const montantRembourse = Math.round(prixTotal * 0.8 * 100) / 100;
  const fraisRetenus = Math.round(prixTotal * 0.2 * 100) / 100;

  async function confirmerAnnulation() {
    setChargement(true);
    setErreur("");

    try {
      const { error: erreurDemande } = await supabase
        .from("demandes_annulation")
        .insert({
          reservation_id: reservationId,
          client_id: clientId,
          motif: motif || null,
          prix_total: prixTotal,
          montant_rembourse: montantRembourse,
        });

      if (erreurDemande) throw erreurDemande;

      const { error: erreurStatut } = await supabase
        .from("reservations")
        .update({ statut: "annulation_demandee" })
        .eq("id", reservationId);

      if (erreurStatut) throw erreurStatut;

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
        Votre demande d'annulation a été envoyée. Elle est en cours
        d'examen par notre équipe.
      </div>
    );
  }

  if (!ouvert) {
    return (
      <button
        onClick={() => setOuvert(true)}
        className="text-rouge-500 hover:text-rouge-600 font-medium text-sm underline"
      >
        Annuler ma réservation
      </button>
    );
  }

  return (
    <div className="bg-white border border-anthracite-100 rounded-lg p-5">
      <div className="flex items-start gap-3 mb-4">
        <AlertTriangle size={22} className="text-jaune-500 shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-anthracite-800">
            Confirmer l'annulation
          </h3>
          <p className="text-sm text-anthracite-600 mt-1">
            En cas d'empêchement, vous serez remboursé(e) de{" "}
            <span className="font-semibold">{montantRembourse.toFixed(2)} €</span>{" "}
            sur les {prixTotal.toFixed(2)} € payés — des frais de{" "}
            <span className="font-semibold">20% ({fraisRetenus.toFixed(2)} €)</span>{" "}
            sont retenus. Votre demande sera examinée par notre équipe avant
            validation du remboursement.
          </p>
        </div>
      </div>

      <textarea
        rows={2}
        value={motif}
        onChange={(e) => setMotif(e.target.value)}
        placeholder="Motif de l'annulation (optionnel)"
        className="w-full border border-anthracite-100 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bleu-500"
      />

      {erreur && <p className="text-rouge-500 text-sm mt-2">{erreur}</p>}

      <div className="flex gap-2 mt-3">
        <button
          onClick={confirmerAnnulation}
          disabled={chargement}
          className="bg-rouge-500 hover:bg-rouge-600 text-white font-semibold px-4 py-2 rounded-md transition disabled:opacity-50"
        >
          {chargement ? "Envoi..." : "Confirmer l'annulation"}
        </button>
        <button
          onClick={() => setOuvert(false)}
          disabled={chargement}
          className="border border-anthracite-100 text-anthracite-700 font-medium px-4 py-2 rounded-md hover:bg-anthracite-50 transition"
        >
          Retour
        </button>
      </div>
    </div>
  );
}