import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { envoyerEmail, emailReinitialisationMotDePasse } from "@/lib/email";
import { randomBytes } from "crypto";

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Message volontairement identique dans tous les cas d'échec,
// pour ne pas révéler si un numéro existe ou non dans la base.
const MESSAGE_GENERIQUE = {
  message:
    "Si ce numéro est associé à un compte avec un email enregistré, un lien de réinitialisation vient d'être envoyé.",
};

export async function POST(request) {
  const { telephone } = await request.json();

  if (!telephone) {
    return NextResponse.json({ error: "Numéro de téléphone requis." }, { status: 400 });
  }

  // Cherche le profil dans les 3 tables possibles
  let profil = null;
  let authId = null;

  const { data: client } = await supabaseAdmin
    .from("clients")
    .select("auth_id, nom, email")
    .eq("telephone", telephone)
    .maybeSingle();

  if (client) {
    profil = client;
    authId = client.auth_id;
  }

  if (!profil) {
    const { data: proprietaire } = await supabaseAdmin
      .from("proprietaires")
      .select("auth_id, nom, email")
      .eq("telephone", telephone)
      .maybeSingle();

    if (proprietaire) {
      profil = proprietaire;
      authId = proprietaire.auth_id;
    }
  }

  // Si aucun profil, ou profil sans email enregistré : on renvoie quand même
  // le message générique (sécurité), sans envoyer d'email.
  if (!profil || !profil.email) {
    return NextResponse.json(MESSAGE_GENERIQUE);
  }

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1h

  const { error: insertError } = await supabaseAdmin
    .from("reinitialisations_mot_de_passe")
    .insert({ auth_id: authId, token, expires_at: expiresAt });

  if (insertError) {
    console.error("Erreur création token reset :", insertError);
    return NextResponse.json(MESSAGE_GENERIQUE);
  }

  const lienReinitialisation = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reinitialiser?token=${token}`;
  const { sujet, html } = emailReinitialisationMotDePasse({ lienReinitialisation });

  await envoyerEmail({ destinataire: profil.email, sujet, html });

  return NextResponse.json(MESSAGE_GENERIQUE);
}