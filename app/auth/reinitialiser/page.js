"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";

export default function ReinitialiserPage() {
  const [motDePasse, setMotDePasse] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(false);
  const [succes, setSucces] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  async function handleSubmit(e) {
    e.preventDefault();
    setErreur("");

    if (motDePasse !== confirmation) {
      setErreur("Les mots de passe ne correspondent pas.");
      return;
    }

    if (!token) {
      setErreur("Lien invalide.");
      return;
    }

    setChargement(true);

    const reponse = await fetch("/api/auth/reinitialiser", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, nouveauMotDePasse: motDePasse }),
    });

    const donnees = await reponse.json();
    setChargement(false);

    if (!reponse.ok) {
      setErreur(donnees.error || "Une erreur est survenue.");
      return;
    }

    setSucces(true);
    setTimeout(() => router.push("/auth/login"), 2500);
  }

  if (!token) {
    return (
      <>
        <Header />
        <div className="max-w-md mx-auto px-4 py-16 text-center">
          <p className="text-rouge-500">Lien invalide ou incomplet.</p>
        </div>
      </>
    );
  }

  if (succes) {
    return (
      <>
        <Header />
        <div className="max-w-md mx-auto px-4 py-16 text-center">
          <div className="bg-jaune-50 border border-jaune-300 rounded-lg p-6">
            <p className="font-semibold text-anthracite-800">
              Mot de passe mis à jour !
            </p>
            <p className="text-sm text-anthracite-600 mt-1">
              Redirection vers la connexion...
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="max-w-md mx-auto px-4 py-16">
        <h1 className="text-2xl font-bold text-anthracite-800 mb-6">
          Nouveau mot de passe
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-anthracite-600 mb-1">
              Nouveau mot de passe
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              className="w-full border border-anthracite-100 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-bleu-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-anthracite-600 mb-1">
              Confirmer le mot de passe
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              className="w-full border border-anthracite-100 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-bleu-500"
            />
          </div>

          {erreur && <p className="text-rouge-500 text-sm">{erreur}</p>}

          <button
            type="submit"
            disabled={chargement}
            className="w-full bg-bleu-600 hover:bg-bleu-700 text-white font-semibold py-2.5 rounded-md transition disabled:opacity-50"
          >
            {chargement ? "Mise à jour..." : "Réinitialiser le mot de passe"}
          </button>
        </form>
      </div>
    </>
  );
}