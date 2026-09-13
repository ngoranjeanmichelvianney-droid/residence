import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { envoyerEmail, emailReinitialisationMotDePasse } from "@/lib/email";
import { randomBytes } from "crypto";

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const MESSAGE_GENERIQUE = {
  message:
    "Si ce numéro est associé à un compte avec un email enregistré, un lien de réinitialisation vient d'être envoyé.",
};

// Ne garde que les chiffres, pour comparer "0767366585" et "+225 07 67 36 65 85"
// de la même façon peu importe le format saisi.
function chiffresUniquement(telephone) {
  return telephone.replace(/[^0-9]/g, "");
}

export async function POST(request) {
  const { telephone } = await request.json();

  if (!telephone) {
    return NextResponse.json({ error: "Numéro de téléphone requis." }, { status: 400 });
  }

  const chiffres = chiffresUniquement(telephone);
  // Compare sur les 10 derniers chiffres pour ignorer un éventuel indicatif pays (+225)
  const dixDerniersChiffres = chiffres.slice(-10);

  let profil = null;
  let authId = null;

  const { data: clientsTrouves } = await supabaseAdmin
    .from("clients")
    .select("auth_id, nom, email, telephone");

  const clientCorrespondant = clientsTrouves?.find(
    (c) => chiffresUniquement(c.telephone || "").slice(-10) === dixDerniersChiffres
  );

  if (clientCorrespondant) {
    profil = clientCorrespondant;
    authId = clientCorrespondant.auth_id;
  }

  if (!profil) {
    const { data: proprietairesTrouves } = await supabaseAdmin
      .from("proprietaires")
      .select("auth_id, nom, email, telephone");

    const proprietaireCorrespondant = proprietairesTrouves?.find(
      (p) => chiffresUniquement(p.telephone || "").slice(-10) === dixDerniersChiffres
    );

    if (proprietaireCorrespondant) {
      profil = proprietaireCorrespondant;
      authId = proprietaireCorrespondant.auth_id;
    }
  }

  if (!profil || !profil.email) {
    return NextResponse.json(MESSAGE_GENERIQUE);
  }

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

  const { error: insertError } = await supabaseAdmin
    .from("reinitialisations_mot_de_passe")
    .insert({ auth_id: authId, token, expires_at: expiresAt });

  if (insertError) {
    console.error("Erreur création token reset :", insertError);
    return NextResponse.json(MESSAGE_GENERIQUE);
  }

  const lienReinitialisation = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reinitialiser?token=${token}`;
  const { sujet, html } = emailReinitialisationMotDePasse({ lienReinitialisation });

  const resultat = await envoyerEmail({ destinataire: profil.email, sujet, html });

  if (resultat.erreur) {
    console.error("Erreur envoi email réinitialisation :", resultat.erreur);
  }

  return NextResponse.json(MESSAGE_GENERIQUE);
}