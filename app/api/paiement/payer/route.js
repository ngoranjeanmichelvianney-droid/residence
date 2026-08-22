import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { creerPaiementGenius } from "@/lib/geniuspay";

export async function POST(request) {
  try {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ message: "Non authentifié." }, { status: 401 });
    }

    const { data: client } = await supabase
      .from("clients")
      .select("id")
      .eq("auth_id", user.id)
      .single();

    if (!client) {
      return NextResponse.json({ message: "Client introuvable." }, { status: 403 });
    }

    const body = await request.json();
    const { reservationId } = body;

    if (!reservationId) {
      return NextResponse.json({ message: "reservationId requis." }, { status: 400 });
    }

    const { data: reservation } = await supabase
      .from("reservations")
      .select("*")
      .eq("id", reservationId)
      .eq("client_id", client.id)
      .single();

    if (!reservation) {
      return NextResponse.json({ message: "Réservation introuvable." }, { status: 404 });
    }

    if (reservation.statut !== "en_attente_paiement") {
      return NextResponse.json(
        { message: "Cette réservation n'est pas en attente de paiement." },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;
    const successUrl = `${baseUrl}/reservation/confirmation/${reservation.id}`;
    const errorUrl = `${baseUrl}/mes-reservations?erreur=paiement`;

    let paiement;
    try {
      paiement = await creerPaiementGenius({
        montant: reservation.montant,
        clientNom: reservation.client_nom,
        clientTelephone: reservation.client_telephone,
        reservationId: reservation.id,
        successUrl,
        errorUrl,
      });
    } catch (geniusError) {
      console.error("Erreur GeniusPay :", geniusError);
      return NextResponse.json(
        { message: geniusError.message || "Erreur lors de l'initiation du paiement." },
        { status: 502 }
      );
    }

    if (!paiement?.checkout_url) {
      console.error("Réponse GeniusPay sans checkout_url :", paiement);
      return NextResponse.json(
        { message: "Lien de paiement introuvable." },
        { status: 502 }
      );
    }

    await supabase
      .from("reservations")
      .update({ reference_paiement: paiement.reference })
      .eq("id", reservation.id);

    return NextResponse.json({ paymentLink: paiement.checkout_url });
  } catch (err) {
    console.error("Erreur /api/paiement/payer :", err);
    return NextResponse.json({ message: "Erreur serveur." }, { status: 500 });
  }
}