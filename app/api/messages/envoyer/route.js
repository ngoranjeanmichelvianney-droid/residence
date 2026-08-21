import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { contientNumeroTelephone, messageErreurNumero } from "@/lib/filtreMessages";

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non connecté." }, { status: 401 });
  }

  const { conversationId, contenu } = await request.json();

  if (!conversationId || !contenu || !contenu.trim()) {
    return NextResponse.json({ error: "Message vide." }, { status: 400 });
  }

  // Détermine si l'utilisateur est le client ou le propriétaire de cette conversation
  const { data: conversation } = await supabase
    .from("conversations")
    .select("*, clients(auth_id), proprietaires(auth_id)")
    .eq("id", conversationId)
    .single();

  if (!conversation) {
    return NextResponse.json({ error: "Conversation introuvable." }, { status: 404 });
  }

  let expediteurType = null;
  if (conversation.clients?.auth_id === user.id) {
    expediteurType = "client";
  } else if (conversation.proprietaires?.auth_id === user.id) {
    expediteurType = "proprietaire";
  } else {
    return NextResponse.json({ error: "Accès refusé à cette conversation." }, { status: 403 });
  }

  // Filtre anti-numéro de téléphone : le message n'est JAMAIS enregistré s'il en contient
  if (contientNumeroTelephone(contenu)) {
    return NextResponse.json({ error: messageErreurNumero() }, { status: 400 });
  }

  const { data: message, error } = await supabaseAdmin
    .from("messages")
    .insert({
      conversation_id: conversationId,
      expediteur_type: expediteurType,
      contenu: contenu.trim(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message });
}