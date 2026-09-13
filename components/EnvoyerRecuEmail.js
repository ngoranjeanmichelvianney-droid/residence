"use client";

import { useState } from "react";
import { Mail, CheckCircle2 } from "lucide-react";

export default function EnvoyerRecuEmail({ reservationId }) {
  const [chargement, setChargement] = useState(false);
  const [envoye, setEnvoye] = useState(false);
  const [erreur, setErreur] = useState("");

  async function handleEnvoyer() {
    setChargement(true);
    setErreur("");

    try {
      const res = await fetch(`/api/reservations/${reservationId}/envoyer-recu`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Échec de l'envoi du reçu.");
      }

      setEnvoye(true);
    } catch (err) {
      setErreur(err.message || "Une erreur est survenue.");
    } finally {
      setChargement(false);
    }
  }

  if (envoye) {
    return (
      <div className="flex items-center gap-2 text-sm text-bleu-600 font-medium">
        <CheckCircle2 size={18} />
        Reçu envoyé par email
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleEnvoyer}
        disabled={chargement}
        className="flex items-center justify-center gap-2 w-full border border-anthracite-200 hover:border-anthracite-400 text-anthracite-800 font-semibold py-2.5 rounded-md transition disabled:opacity-50"
      >
        <Mail size={18} />
        {chargement ? "Envoi en cours..." : "Envoyer le reçu par email"}
      </button>
      {erreur && (
        <p className="text-rouge-500 text-xs mt-2">{erreur}</p>
      )}
    </div>
  );
}