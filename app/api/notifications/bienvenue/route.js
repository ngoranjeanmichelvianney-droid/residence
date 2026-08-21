import { NextResponse } from "next/server";
import { envoyerEmail, emailBienvenue } from "@/lib/email";

export async function POST(request) {
  const { email, nom, typeCompte } = await request.json();

  if (!email || !nom) {
    return NextResponse.json({ error: "Données manquantes." }, { status: 400 });
  }

  const { sujet, html } = emailBienvenue({ nom, typeCompte });
  const resultat = await envoyerEmail({ destinataire: email, sujet, html });

  if (resultat.erreur) {
    // On ne bloque jamais l'inscription si l'email échoue, on log juste
    return NextResponse.json({ envoye: false });
  }

  return NextResponse.json({ envoye: true });
}