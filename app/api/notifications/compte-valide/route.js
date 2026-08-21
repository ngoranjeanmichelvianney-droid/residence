import { NextResponse } from "next/server";
import { envoyerEmail, emailCompteValide } from "@/lib/email";

export async function POST(request) {
  const { email, nom } = await request.json();

  if (!email || !nom) {
    return NextResponse.json({ error: "Données manquantes." }, { status: 400 });
  }

  const { sujet, html } = emailCompteValide({ nom });
  const resultat = await envoyerEmail({ destinataire: email, sujet, html });

  if (resultat.erreur) {
    return NextResponse.json({ envoye: false });
  }

  return NextResponse.json({ envoye: true });
}