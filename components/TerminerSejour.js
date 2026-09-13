"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import ModalNoterResidence from "@/components/ModalNoterResidence";

// À afficher sur chaque réservation "confirmee" dans la liste "mes-reservations"
// du client. Il peut cliquer lui-même quand il quitte la résidence : le statut
// passe à "terminee" et la modal de notation s'ouvre immédiatement (puisqu'il
// est présent à cet instant, contrairement à quand c'est le propriétaire qui
// termine la réservation depuis son dashboard).
//
// Props attendues :
// - reservation : objet réservation, avec au minimum { id, statut, residences: { id, titre } }
// - clientId    : id du client connecté (table clients, pas auth.uid())

export default function TerminerSejour({ reservation, clientId }) {
  const supabase = createClient();

  const [statut, setStatut] = useState(reservation.statut);
  const [modalOuverte, setModalOuverte] = useState(false);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState(null);

  async function terminerSejour() {
    setEnCours(true);
    setErreur(null);

    const { error } = await supabase
      .from("reservations")
      .update({ statut: "terminee" })
      .eq("id", reservation.id)
      .eq("client_id", clientId);

    setEnCours(false);

    if (error) {
      setErreur("Impossible de terminer le séjour. Réessayez.");
      return;
    }

    setStatut("terminee");
    setModalOuverte(true);
  }

  if (statut !== "confirmee") return null;

  return (
    <>
      <div className="flex flex-col gap-1">
        <button
          type="button"
          onClick={terminerSejour}
          disabled={enCours}
          className="self-start rounded-lg border border-anthracite-200 px-3 py-1.5 text-xs font-medium text-anthracite-600 disabled:opacity-50"
        >
          {enCours ? "..." : "J'ai libéré la résidence"}
        </button>
        {erreur && <p className="text-xs text-red-600">{erreur}</p>}
      </div>

      {modalOuverte && (
        <ModalNoterResidence
          residence={reservation.residences}
          reservationId={reservation.id}
          clientId={clientId}
          onFerme={() => setModalOuverte(false)}
        />
      )}
    </>
  );
}