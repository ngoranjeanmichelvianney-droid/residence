"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Header from "@/components/Header";

function telephoneVersEmailTechnique(telephone) {
  const nettoye = telephone.replace(/[^0-9]/g, "");
  return `${nettoye}@homtesti.local`;
}

export default function LoginPage() {
  const [telephone, setTelephone] = useState("");
  const [password, setPassword] = useState("");
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";

  async function handleLogin(e) {
    e.preventDefault();
    setErreur("");
    setChargement(true);

    const supabase = createClient();
    const emailTechnique = telephoneVersEmailTechnique(telephone);

    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: emailTechnique,
      password,
    });

    if (error) {
      setErreur("Numéro de téléphone ou mot de passe incorrect.");
      setChargement(false);
      return;
    }

    const redirectExplicite = searchParams.get("redirect");

    if (redirectExplicite && redirectExplicite !== "/") {
      setChargement(false);
      router.push(redirectExplicite);
      router.refresh();
      return;
    }

    const userId = authData.user.id;

    const { data: admin } = await supabase
      .from("admins")
      .select("id")
      .eq("auth_id", userId)
      .maybeSingle();

    if (admin) {
      setChargement(false);
      router.push("/admin/proprietaires");
      router.refresh();
      return;
    }

    const { data: proprietaire } = await supabase
      .from("proprietaires")
      .select("id")
      .eq("auth_id", userId)
      .maybeSingle();

    if (proprietaire) {
      setChargement(false);
      router.push("/proprietaire/dashboard");
      router.refresh();
      return;
    }

    setChargement(false);
    router.push(redirect);
    router.refresh();
  }

  return (
    <>
      <Header />
      <div className="max-w-md mx-auto px-4 py-16">
        <h1 className="text-2xl font-bold text-anthracite-800 mb-6">
          Connexion
        </h1>

        <form onSubmit={handleLogin} className="space-y-4">
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

          <div>
            <label className="block text-sm font-medium text-anthracite-600 mb-1">
              Mot de passe
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-anthracite-100 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-bleu-500"
            />
          </div>

          {erreur && <p className="text-rouge-500 text-sm">{erreur}</p>}

          <button
            type="submit"
            disabled={chargement}
            className="w-full bg-bleu-600 hover:bg-bleu-700 text-white font-semibold py-2.5 rounded-md transition disabled:opacity-50"
          >
            {chargement ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        <p className="text-sm text-center mt-3">
          <a href="/auth/mot-de-passe-oublie" className="text-bleu-600 hover:underline">
            Mot de passe oublié ?
          </a>
        </p>

        <p className="text-sm text-anthracite-400 mt-6 text-center">
          Pas encore de compte ?{" "}
          <a
            href={`/auth/register?redirect=${encodeURIComponent(redirect)}`}
            className="text-bleu-600 font-medium hover:underline"
          >
            Inscrivez-vous
          </a>
        </p>
        <p className="text-xs text-anthracite-400 mt-2 text-center">
          Vous êtes propriétaire ?{" "}
          <a
            href="/auth/register?type=proprietaire"
            className="text-bleu-600 hover:underline"
          >
            Inscription partenaire
          </a>
        </p>
      </div>
    </>
  );
}