"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Header from "@/components/Header";

export default function RegisterPage() {
  const [nom, setNom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pieceRecto, setPieceRecto] = useState(null);
  const [pieceVerso, setPieceVerso] = useState(null);
  const [cguAcceptees, setCguAcceptees] = useState(false);
  const [erreur, setErreur] = useState("");
  const [succes, setSucces] = useState(false);
  const [chargement, setChargement] = useState(false);
  const [etapeChargement, setEtapeChargement] = useState("");

  const router = useRouter();
  const searchParams = useSearchParams();
  const typeProprietaire = searchParams.get("type") === "proprietaire";
  const redirect = searchParams.get("redirect") || "/";

  async function handleRegister(e) {
    e.preventDefault();
    setErreur("");

    if (!cguAcceptees) {
      setErreur("Vous devez accepter les conditions générales pour continuer.");
      return;
    }

    setChargement(true);
    setEtapeChargement("Création du compte...");

    const supabase = createClient();

    // 1. Créer le compte auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      setErreur(authError.message);
      setChargement(false);
      return;
    }

    const maintenant = new Date().toISOString();

    // 2. Si inscription propriétaire, uploader recto/verso puis créer le profil
    if (typeProprietaire) {
      const extRecto = pieceRecto.name.split(".").pop();
      const extVerso = pieceVerso.name.split(".").pop();
      const cheminRecto = `${authData.user.id}/piece-recto.${extRecto}`;
      const cheminVerso = `${authData.user.id}/piece-verso.${extVerso}`;

      setEtapeChargement("Envoi de la pièce d'identité...");

      const { error: uploadRectoError } = await supabase.storage
        .from("pieces-identite")
        .upload(cheminRecto, pieceRecto, { upsert: true });

      if (uploadRectoError) {
        setErreur("Erreur lors de l'envoi du recto : " + uploadRectoError.message);
        setChargement(false);
        return;
      }

      const { error: uploadVersoError } = await supabase.storage
        .from("pieces-identite")
        .upload(cheminVerso, pieceVerso, { upsert: true });

      if (uploadVersoError) {
        setErreur("Erreur lors de l'envoi du verso : " + uploadVersoError.message);
        setChargement(false);
        return;
      }

      // 2.5 Vérification automatique que le document ressemble bien à une
      // pièce d'identité (OCR). Ne remplace pas la validation manuelle par
      // l'admin, mais bloque tout de suite les cas évidents (mauvaise photo,
      // document non lisible, fichier non pertinent...).
      setEtapeChargement("Vérification du document...");

      let ocrValide = true;
      let ocrTexte = "";

      try {
        const { data: signedUrlData } = await supabase.storage
          .from("pieces-identite")
          .createSignedUrl(cheminRecto, 60 * 5);

        if (signedUrlData?.signedUrl) {
          const reponseOcr = await fetch("/api/verification/piece-identite", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageUrl: signedUrlData.signedUrl }),
          });
          const resultatOcr = await reponseOcr.json();
          ocrValide = resultatOcr.valide;
          ocrTexte = resultatOcr.texteDetecte || "";
        }
      } catch (ocrErr) {
        console.error("Erreur vérification OCR :", ocrErr);
        // On ne bloque pas l'inscription si l'OCR échoue techniquement,
        // l'admin validera manuellement.
      }

      if (!ocrValide) {
        setErreur(
          "Le document envoyé (recto) ne semble pas être une pièce d'identité lisible. Merci de vérifier la photo (bien cadrée, nette, non coupée) et réessayer."
        );
        setChargement(false);
        return;
      }

      setEtapeChargement("Finalisation...");

      const { error: profilError } = await supabase.from("proprietaires").insert({
        auth_id: authData.user.id,
        nom,
        telephone,
        email,
        piece_identite_recto_path: cheminRecto,
        piece_identite_verso_path: cheminVerso,
        piece_identite_ocr_valide: ocrValide,
        piece_identite_ocr_texte: ocrTexte,
        cgu_accepted_at: maintenant,
      });

      setChargement(false);

      if (profilError) {
        setErreur("Erreur lors de la création du profil : " + profilError.message);
        return;
      }

      setSucces(true);
      return;
    }

    // 3. Inscription client : créer le profil dans la table clients
    const { error: clientError } = await supabase.from("clients").insert({
      auth_id: authData.user.id,
      nom,
      telephone,
      email,
      cgu_accepted_at: maintenant,
    });

    setChargement(false);

    if (clientError) {
      setErreur("Erreur lors de la création du profil : " + clientError.message);
      return;
    }

    router.push(redirect);
    router.refresh();
  }

  if (succes) {
    return (
      <>
        <Header />
        <div className="max-w-md mx-auto px-4 py-16 text-center">
          <div className="bg-jaune-50 border border-jaune-300 rounded-lg p-6">
            <h1 className="text-xl font-bold text-anthracite-800 mb-2">
              Inscription reçue !
            </h1>
            <p className="text-anthracite-600 text-sm">
              Votre compte propriétaire est en attente de validation par
              l&apos;administrateur. Vous recevrez un accès dès que votre
              compte sera activé.
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
        <h1 className="text-2xl font-bold text-anthracite-800 mb-2">
          {typeProprietaire ? "Devenir partenaire" : "Créer un compte"}
        </h1>
        <p className="text-sm text-anthracite-400 mb-6">
          {typeProprietaire
            ? "Inscrivez-vous pour proposer vos résidences sur la plateforme. Votre compte sera activé après validation."
            : "Créez votre compte pour réserver et suivre vos demandes."}
        </p>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-anthracite-600 mb-1">
              Nom complet
            </label>
            <input
              type="text"
              required
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              className="w-full border border-anthracite-100 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-bleu-500"
            />
          </div>

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

          {typeProprietaire && (
            <>
              <div>
                <label className="block text-sm font-medium text-anthracite-600 mb-1">
                  Pièce d&apos;identité — recto
                </label>
                <input
                  type="file"
                  required
                  accept="image/*,.pdf"
                  onChange={(e) => setPieceRecto(e.target.files[0])}
                  className="w-full border border-anthracite-100 rounded-md px-3 py-2 text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:bg-bleu-50 file:text-bleu-600 file:text-sm file:font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-anthracite-600 mb-1">
                  Pièce d&apos;identité — verso
                </label>
                <input
                  type="file"
                  required
                  accept="image/*,.pdf"
                  onChange={(e) => setPieceVerso(e.target.files[0])}
                  className="w-full border border-anthracite-100 rounded-md px-3 py-2 text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:bg-bleu-50 file:text-bleu-600 file:text-sm file:font-medium"
                />
                <p className="text-xs text-anthracite-400 mt-1">
                  CNI, passeport ou carte de séjour. Nécessaire pour la validation de votre compte.
                </p>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-anthracite-600 mb-1">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-anthracite-100 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-bleu-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-anthracite-600 mb-1">
              Mot de passe
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-anthracite-100 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-bleu-500"
            />
          </div>

          <label className="flex items-start gap-2 text-sm text-anthracite-600">
            <input
              type="checkbox"
              required
              checked={cguAcceptees}
              onChange={(e) => setCguAcceptees(e.target.checked)}
              className="mt-1"
            />
            <span>
              J&apos;ai lu et j&apos;accepte les{" "}
              <Link href="/conditions" target="_blank" className="text-bleu-600 hover:underline">
                conditions générales d&apos;utilisation
              </Link>
              .
            </span>
          </label>

          {erreur && <p className="text-rouge-500 text-sm">{erreur}</p>}

          <button
            type="submit"
            disabled={chargement}
            className="w-full bg-bleu-600 hover:bg-bleu-700 text-white font-semibold py-2.5 rounded-md transition disabled:opacity-50"
          >
            {chargement ? etapeChargement || "Inscription..." : "S'inscrire"}
          </button>
        </form>
      </div>
    </>
  );
}