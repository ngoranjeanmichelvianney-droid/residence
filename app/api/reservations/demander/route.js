import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request) {
  try {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ message: "Non authentifié." }, { status: 401 });
    }

    const { data: clientRow } = await supabase
      .from("clients")
      .select("id, nom, telephone")
      .eq("auth_id", user.id)
      .single();

    if (!clientRow) {
      return NextResponse.json(
        { message: "Profil client introuvable." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { residenceId, dateArrivee, dateDepart, message } = body;

    if (!residenceId || !dateArrivee || !dateDepart) {
      return NextResponse.json({ message: "Champs manquants." }, { status: 400 });
    }

    const { data: residence } = await supabase
      .from("residences")
      .select("prix_nuit, disponible, statut")
      .eq("id", residenceId)
      .single();

    if (!residence || residence.statut !== "publie" || !residence.disponible) {
      return NextResponse.json(
        { message: "Résidence indisponible." },
        { status: 400 }
      );
    }

    const nuits = Math.round(
      (new Date(dateDepart) - new Date(dateArrivee)) / (1000 * 60 * 60 * 24)
    );

    if (nuits <= 0) {
      return NextResponse.json({ message: "Dates invalides." }, { status: 400 });
    }

    const montant = nuits * residence.prix_nuit;

    // On crée seulement la DEMANDE, sans initier de paiement. Le propriétaire
    // doit valider avant que le client puisse payer.
    const { data: reservation, error } = await supabase
      .from("reservations")
      .insert({
        residence_id: residenceId,
        client_id: clientRow.id,
        client_nom: clientRow.nom,
        client_telephone: clientRow.telephone,
        date_arrivee: dateArrivee,
        date_depart: dateDepart,
        message: message || null,
        montant,
        paye: false,
        statut: "en_attente",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { message: "Erreur lors de la demande : " + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ reservationId: reservation.id });
  } catch (err) {
    console.error("Erreur /api/reservations/demander :", err);
    return NextResponse.json({ message: "Erreur serveur." }, { status: 500 });
  }
}