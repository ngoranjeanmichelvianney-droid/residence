import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request) {
  const supabase = createClient();
  const { searchParams, origin } = new URL(request.url);
  const residenceId = searchParams.get("residenceId");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !residenceId) {
    return NextResponse.redirect(`${origin}/auth/login`);
  }

  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("auth_id", user.id)
    .single();

  if (!client) {
    return NextResponse.redirect(`${origin}/`);
  }

  const { data: conversationExistante } = await supabase
    .from("conversations")
    .select("id")
    .eq("residence_id", residenceId)
    .eq("client_id", client.id)
    .maybeSingle();

  if (conversationExistante) {
    return NextResponse.redirect(`${origin}/mes-messages/${conversationExistante.id}`);
  }

  const { data: residence } = await supabase
    .from("residences")
    .select("proprietaire_id")
    .eq("id", residenceId)
    .single();

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
    return NextResponse.redirect(`${origin}/`);
  }

  return NextResponse.redirect(`${origin}/mes-messages/${nouvelleConversation.id}`);
}