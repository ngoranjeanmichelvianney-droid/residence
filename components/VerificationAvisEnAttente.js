"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import ModalNoterResidence from "@/components/ModalNoterResidence";

// À placer une seule fois, quelque part que le client visite après un séjour
// (ex: layout de "mes-reservations", ou layout global authentifié).
// Dès qu'une réservation "terminee" du client n'a pas encore d'avis associé,
// la modal apparaît. "Plus tard" la ferme sans rien enregistrer.

export default function VerificationAvisEnAttente({ clientId }) {
  const supabase = createClient();
  const [reservationANoter, setReservationANoter] = useState(null);
  const [ferme, setFerme] = useState(false);

  useEffect(() => {
    async function verifier() {
      if (!clientId) return;

      const { data: reservations } = await supabase
        .from("reservations")
        .select("id, residence_id, residences(id, titre)")
        .eq("client_id", clientId)
        .eq("statut", "terminee");

      if (!reservations || reservations.length === 0) return;

      // Cherche la première réservation terminée qui n'a pas encore d'avis.
      for (const reservation of reservations) {
        const { data: avisExistant } = await supabase
          .from("avis")
          .select("id")
          .eq("reservation_id", reservation.id)
          .maybeSingle();

        if (!avisExistant) {
          setReservationANoter(reservation);
          break;
        }
      }
    }

    verifier();
  }, [clientId]);

  if (!reservationANoter || ferme) return null;

  return (
    <ModalNoterResidence
      residence={reservationANoter.residences}
      reservationId={reservationANoter.id}
      clientId={clientId}
      onFerme={() => setFerme(true)}
    />
  );
}