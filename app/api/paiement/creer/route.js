// app/api/paiement/creer/route.js
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { creerPaiementGenius } from "@/lib/geniuspay";

export async function POST(request) {
  try {
    const body = await request.json();
    const { residenceId, dateArrivee, dateDepart, message } = body;

    if (!residenceId || !dateArrivee || !dateDepart) {
      return NextResponse.json(
        { message: "Champs manquants (residenceId, dateArrivee, dateDepart requis)." },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // 1. Vérifier que l'utilisateur est connecté
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ message: "Non authentifié." }, { status: 401 });
    }

    // 2. Récupérer la fiche client liée à cet utilisateur (clients.auth_id = user.id)
    const { data: clientRow, error: clientError } = await supabase
      .from("clients")
      .select("id, nom, telephone")
      .eq("auth_id", user.id)
      .single();

    if (clientError || !clientRow) {
      return NextResponse.json(
        { message: "Profil client introuvable. Complétez votre profil avant de réserver." },
        { status: 400 }
      );
    }

    // 3. Récupérer la résidence pour le prix et la disponibilité
    const { data: residence, error: residenceError } = await supabase
      .from("residences")
      .select("id, prix_nuit, disponible")
      .eq("id", residenceId)
      .single();

    if (residenceError || !residence) {
      return NextResponse.json({ message: "Résidence introuvable." }, { status: 404 });
    }

    if (!residence.disponible) {
      return NextResponse.json({ message: "Résidence indisponible." }, { status: 400 });
    }

    // 4. Calculer le montant
    const nuits = Math.round(
      (new Date(dateDepart) - new Date(dateArrivee)) / (1000 * 60 * 60 * 24)
    );

    if (nuits <= 0) {
      return NextResponse.json(
        { message: "La date de départ doit être après la date d'arrivée." },
        { status: 400 }
      );
    }

    const montant = nuits * residence.prix_nuit;

    // 5. Créer la réservation, statut "en_attente_paiement" avant paiement
    const { data: reservation, error: insertError } = await supabase
      .from("reservations")
      .insert({
        residence_id: residenceId,
        client_id: clientRow.id,
        client_nom: clientRow.nom,
        client_telephone: clientRow.telephone,
        client_email: user.email,
        date_arrivee: dateArrivee,
        date_depart: dateDepart,
        message: message || null,
        montant,
        statut: "en_attente_paiement",
        paye: false,
      })
      .select()
      .single();

    if (insertError || !reservation) {
      console.error("Erreur création réservation :", insertError);
      return NextResponse.json(
        { message: "Impossible de créer la réservation." },
        { status: 500 }
      );
    }

    // 6. Initier le paiement GeniusPay
    // On utilise l'origine réelle de la requête en priorité (fonctionne en local
    // ET en prod sans dépendre d'une variable d'env à tenir à jour manuellement).
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;

    // On redirige vers la page de confirmation, qui vérifie elle-même le
    // paiement auprès de GeniusPay à l'affichage (ne dépend pas d'un webhook).
    const successUrl = `${baseUrl}/reservation/confirmation/${reservation.id}`;
    const errorUrl = `${baseUrl}/reserver/${residenceId}?erreur=paiement`;

    let paiement;
    try {
      paiement = await creerPaiementGenius({
        montant,
        clientNom: clientRow.nom,
        clientTelephone: clientRow.telephone,
        reservationId: reservation.id,
        successUrl,
        errorUrl,
      });
    } catch (geniusError) {
      await supabase.from("reservations").delete().eq("id", reservation.id);
      console.error("Erreur GeniusPay :", geniusError);
      return NextResponse.json(
        { message: geniusError.message || "Erreur lors de l'initiation du paiement." },
        { status: 502 }
      );
    }

    // 7. Sauvegarder la référence de paiement
    if (paiement?.reference) {
      await supabase
        .from("reservations")
        .update({ reference_paiement: paiement.reference })
        .eq("id", reservation.id);
    }

    // 8. Renvoyer le lien de paiement au frontend
    // IMPORTANT : GeniusPay renvoie le champ "checkout_url", pas "payment_link".
    if (!paiement?.checkout_url) {
      console.error("Réponse GeniusPay sans checkout_url :", paiement);
      await supabase.from("reservations").delete().eq("id", reservation.id);
      return NextResponse.json(
        { message: "Lien de paiement introuvable dans la réponse GeniusPay." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      paymentLink: paiement.checkout_url,
      reservationId: reservation.id,
    });
  } catch (err) {
    console.error("Erreur /api/paiement/creer :", err);
    return NextResponse.json({ message: "Erreur serveur." }, { status: 500 });
  }
}