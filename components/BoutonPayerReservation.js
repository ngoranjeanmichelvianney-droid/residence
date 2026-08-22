"use client";

import { useState } from "react";

export default function BoutonPayerReservation({ reservationId, montant }) {
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState("");

  async function handlePayer() {
    setErreur("");
    setChargement(true);

    try {
      const reponse = await fetch("/api/paiement/payer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservationId }),
      });

      const donnees = await reponse.json();

      if (!reponse.ok) {
        throw new Error(donnees.message || "Erreur lors de l'initiation du paiement.");
      }

      window.location.href = donnees.paymentLink;
    } catch (err) {
      setErreur(err.message || "Une erreur est survenue.");
      setChargement(false);
    }
  }

  return (
    <div>
      <button
        onClick={handlePayer}
        disabled={chargement}
        className="w-full sm:w-auto bg-rouge-500 hover:bg-rouge-600 text-white font-semibold px-5 py-2.5 rounded-md transition disabled:opacity-50"
      >
        {chargement
          ? "Redirection..."
          : `Payer ${montant?.toLocaleString("fr-FR")} FCFA`}
      </button>
      {erreur && <p className="text-rouge-500 text-xs mt-1">{erreur}</p>}
    </div>
  );
}