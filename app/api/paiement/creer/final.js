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
      return NextResponse.json({ message: "Non authentifié" }, { status: 401 });
    }

    const { data: client } = await supabase
      .from("clients")
      .select("*")
      .eq("auth_id", user.id)
      .single();

    if (!client) {
      return NextResponse.json({ message: "Client introuvable" }, { status: 403 });
    }

    const body = await request.json();
    const { residenceId, dateArrivee, dateDepart, message } = body;

    if (!residenceId || !dateArrivee || !dateDepart) {
      return NextResponse.json({ message: "Champs manquants" }, { status: 400 });
    }

    const { data: residence } = await supabase
      .from("residences")
      .select("prix_nuit, disponible, statut")
      .eq("id", residenceId)
      .single();

    if (!residence || residence.statut !== "publie" || !residence.disponible) {
      return NextResponse.json(
        { message: "Résidence indisponible" },
        { status: 400 }
      );
    }

    const nuits = Math.round(
      (new Date(dateDepart) - new Date(dateArrivee)) / (1000 * 60 * 60 * 24)
    );

    if (nuits <= 0) {
      return NextResponse.json({ message: "Dates invalides" }, { status: 400 });
    }

    const montant = nuits * residence.prix_nuit;

    const { data: reservation, error: reservationError } = await supabase
      .from("reservations")
      .insert({
        residence_id: residenceId,
        client_id: client.id,
        client_nom: client.nom,
        client_telephone: client.telephone,
        client_email: client.email,
        date_arrivee: dateArrivee,
        date_depart: dateDepart,
        message: message || null,
        montant,
        paye: false,
        statut: "en_attente_paiement",
      })
      .select()
      .single();

    if (reservationError) {
      return NextResponse.json(
        { message: "Erreur création réservation : " + reservationError.message },
        { status: 500 }
      );
    }

    // Origine du site (fonctionne en local avec localhost:3000/3001 et en prod)
    const origin = request.nextUrl.origin;
    const successUrl = `${origin}/reservation/confirmation/${reservation.id}`;
    const errorUrl = `${origin}/reserver/${residenceId}?erreur=paiement`;

    try {
      const paiement = await creerPaiementGenius({
        montant,
        clientNom: client.nom,
        clientTelephone: client.telephone,
        reservationId: reservation.id,
        successUrl,
        errorUrl,
      });

      await supabase
        .from("reservations")
        .update({ reference_paiement: paiement.reference })
        .eq("id", reservation.id);

      return NextResponse.json({
        paymentLink: paiement.checkout_url,
        reservationId: reservation.id,
      });
    } catch (paiementErr) {
      await supabase.from("reservations").delete().eq("id", reservation.id);

      return NextResponse.json(
        { message: paiementErr.message || "Erreur lors de l'initiation du paiement" },
        { status: 500 }
      );
    }
  } catch (err) {
    return NextResponse.json(
      { message: err.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}