import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non connecté." }, { status: 401 });
  }

  const { residenceId } = await request.json();

  if (!residenceId) {
    return NextResponse.json({ error: "Résidence manquante." }, { status: 400 });
  }

  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("auth_id", user.id)
    .single();

  if (!client) {
    return NextResponse.json({ error: "Profil client introuvable." }, { status: 400 });
  }

  // Vérifie qu'une réservation existe bien pour cette résidence + ce client
  const { data: reservation } = await supabase
    .from("reservations")
    .select("id")
    .eq("residence_id", residenceId)
    .eq("client_id", client.id)
    .maybeSingle();

  if (!reservation) {
    return NextResponse.json(
      { error: "Vous devez avoir réservé cette résidence pour contacter le propriétaire." },
      { status: 403 }
    );
  }

  const { data: residence } = await supabase
    .from("residences")
    .select("proprietaire_id")
    .eq("id", residenceId)
    .single();

  // Cherche une conversation existante, sinon la crée
  const { data: conversationExistante } = await supabase
    .from("conversations")
    .select("id")
    .eq("residence_id", residenceId)
    .eq("client_id", client.id)
    .maybeSingle();

  if (conversationExistante) {
    return NextResponse.json({ conversationId: conversationExistante.id });
  }

  const { data: nouvelleConversation, error } = await supabase
    .from("conversations")
    .insert({
      residence_id: residenceId,
      client_id: client.id,
      proprietaire_id: residence.proprietaire_id,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ conversationId: nouvelleConversation.id });
}