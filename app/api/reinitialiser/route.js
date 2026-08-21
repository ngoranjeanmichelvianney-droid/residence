import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  const { token, nouveauMotDePasse } = await request.json();

  if (!token || !nouveauMotDePasse) {
    return NextResponse.json({ error: "Données manquantes." }, { status: 400 });
  }

  if (nouveauMotDePasse.length < 6) {
    return NextResponse.json(
      { error: "Le mot de passe doit contenir au moins 6 caractères." },
      { status: 400 }
    );
  }

  const { data: reset, error: resetError } = await supabaseAdmin
    .from("reinitialisations_mot_de_passe")
    .select("*")
    .eq("token", token)
    .single();

  if (resetError || !reset) {
    return NextResponse.json({ error: "Lien invalide ou déjà utilisé." }, { status: 400 });
  }

  if (reset.utilise) {
    return NextResponse.json({ error: "Ce lien a déjà été utilisé." }, { status: 400 });
  }

  if (new Date(reset.expires_at) < new Date()) {
    return NextResponse.json({ error: "Ce lien a expiré. Refaites une demande." }, { status: 400 });
  }

  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(reset.auth_id, {
    password: nouveauMotDePasse,
  });

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  await supabaseAdmin
    .from("reinitialisations_mot_de_passe")
    .update({ utilise: true })
    .eq("token", token);

  return NextResponse.json({ succes: true });
}