"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DateRangePicker from "./DateRangePicker";

export default function ReserverResidence({
  residenceId,
  prixNuit,
  client,
  disponible,
  dateArriveeInitiale = "",
  dateDepartInitiale = "",
  messageInitial = "",
}) {
  const [dateArrivee, setDateArrivee] = useState(dateArriveeInitiale);
  const [dateDepart, setDateDepart] = useState(dateDepartInitiale);
  const [message, setMessage] = useState(messageInitial);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState("");
  const [demandeEnvoyee, setDemandeEnvoyee] = useState(false);
  const router = useRouter();

  const nuits =
    dateArrivee && dateDepart && dateDepart > dateArrivee
      ? Math.round(
          (new Date(dateDepart) - new Date(dateArrivee)) / (1000 * 60 * 60 * 24)
        )
      : 0;
  const montant = nuits * prixNuit;

  function allerVersConnexion() {
    const params = new URLSearchParams();
    if (dateArrivee) params.set("arrivee", dateArrivee);
    if (dateDepart) params.set("depart", dateDepart);
    if (message) params.set("message", message);

    const retour = `/reserver/${residenceId}${
      params.toString() ? "?" + params.toString() : ""
    }`;

    router.push(`/auth/login?redirect=${encodeURIComponent(retour)}`);
  }

  async function handleDemande(e) {
    e.preventDefault();
    setErreur("");

    if (!dateArrivee || !dateDepart) {
      setErreur("Choisissez une date d'arrivée et de départ.");
      return;
    }

    if (dateDepart <= dateArrivee) {
      setErreur("La date de départ doit être après la date d'arrivée.");
      return;
    }

    if (!client) {
      allerVersConnexion();
      return;
    }

    setChargement(true);

    try {
      const reponse = await fetch("/api/reservations/demander", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          residenceId,
          dateArrivee,
          dateDepart,
          message,
        }),
      });

      const donnees = await reponse.json();

      if (!reponse.ok) {
        throw new Error(donnees.message || "Erreur lors de la demande de réservation.");
      }

      setDemandeEnvoyee(true);
      router.refresh();
    } catch (err) {
      setErreur(err.message || "Une erreur est survenue.");
      setChargement(false);
    }
  }

  if (!disponible) {
    return (
      <div className="w-full bg-anthracite-100 text-anthracite-500 font-semibold py-3 rounded-lg text-center">
        Résidence actuellement indisponible
      </div>
    );
  }

  if (demandeEnvoyee) {
    return (
      <div className="bg-jaune-50 border border-jaune-300 rounded-lg p-5 text-sm text-anthracite-700">
        <p className="font-semibold text-anthracite-800 mb-1">
          Demande envoyée !
        </p>
        <p>
          Le propriétaire doit valider votre demande. Une fois validée, vous
          pourrez procéder au paiement depuis « Mes réservations ».
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleDemande} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-anthracite-600 mb-1">
          Dates du séjour
        </label>
        <DateRangePicker
          dateArrivee={dateArrivee}
          dateDepart={dateDepart}
          onChange={({ arrivee, depart }) => {
            setDateArrivee(arrivee);
            setDateDepart(depart);
          }}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-anthracite-600 mb-1">
          Message (optionnel)
        </label>
        <textarea
          rows={2}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full border border-anthracite-100 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-bleu-500"
        />
      </div>

      {nuits > 0 && (
        <div className="bg-bleu-50 border border-bleu-100 rounded-md px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-anthracite-600">
            {nuits} nuit{nuits > 1 ? "s" : ""} × {prixNuit.toLocaleString("fr-FR")} FCFA
          </span>
          <span className="font-bold text-bleu-600">
            {montant.toLocaleString("fr-FR")} FCFA
          </span>
        </div>
      )}

      {erreur && <p className="text-rouge-500 text-sm">{erreur}</p>}

      <button
        type="submit"
        disabled={chargement}
        className="w-full bg-rouge-500 hover:bg-rouge-600 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
      >
        {chargement
          ? "Envoi de la demande..."
          : client
          ? "Envoyer la demande de réservation"
          : "Se connecter et réserver"}
      </button>
    </form>
  );
}