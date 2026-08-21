"use client";

import { useState } from "react";
import Header from "@/components/Header";

export default function MotDePasseOubliePage() {
  const [telephone, setTelephone] = useState("");
  const [message, setMessage] = useState("");
  const [chargement, setChargement] = useState(false);
  const [envoye, setEnvoye] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setChargement(true);

    const reponse = await fetch("/api/auth/mot-de-passe-oublie", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telephone }),
    });

    const donnees = await reponse.json();
    setMessage(donnees.message);
    setEnvoye(true);
    setChargement(false);
  }

  return (
    <>
      <Header />
      <div className="max-w-md mx-auto px-4 py-16">
        <h1 className="text-2xl font-bold text-anthracite-800 mb-2">
          Mot de passe oublié
        </h1>
        <p className="text-sm text-anthracite-400 mb-6">
          Entrez votre numéro de téléphone. Si un email est enregistré sur
          votre compte, vous recevrez un lien pour choisir un nouveau mot de
          passe.
        </p>

        {envoye ? (
          <div className="bg-jaune-50 border border-jaune-300 rounded-lg p-5 text-sm text-anthracite-700">
            {message}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-anthracite-600 mb-1">
                Téléphone
              </label>
              <input
                type="tel"
                required
                placeholder="+225 XX XX XX XX XX"
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                className="w-full border border-anthracite-100 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-bleu-500"
              />
            </div>

            <button
              type="submit"
              disabled={chargement}
              className="w-full bg-bleu-600 hover:bg-bleu-700 text-white font-semibold py-2.5 rounded-md transition disabled:opacity-50"
            >
              {chargement ? "Envoi..." : "Envoyer le lien"}
            </button>
          </form>
        )}
      </div>
    </>
  );
}