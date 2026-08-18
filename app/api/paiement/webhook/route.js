import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Ce endpoint doit être enregistré via l'API GeniusPay (POST /api/v1/merchant/webhooks)
// avec l'URL ngrok en dev, et le vrai domaine en production.

export async function POST(request) {
  try {
    const payload = await request.json();

    // Structure réelle GeniusPay : { event, data: { status, reference, metadata }, environment }
    const evenement = payload?.event; // ex: "payment.success" | "payment.failed"
    const statut = payload?.data?.status; // ex: "completed" | "failed"
    const reference = payload?.data?.reference;
    const reservationId = payload?.data?.metadata?.reservation_id;

    if (!reference && !reservationId) {
      return NextResponse.json({ message: "Payload invalide" }, { status: 400 });
    }

    const supabase = createClient();

    let query = supabase.from("reservations").select("*");
    query = reservationId
      ? query.eq("id", reservationId)
      : query.eq("reference_paiement", reference);

    const { data: reservation } = await query.single();

    if (!reservation) {
      return NextResponse.json({ message: "Réservation introuvable" }, { status: 404 });
    }

    if (evenement === "payment.success" && statut === "completed") {
      // Paiement réussi = réservation confirmée directement, aucune validation
      // supplémentaire du propriétaire n'est nécessaire.
      await supabase
        .from("reservations")
        .update({
          paye: true,
          paye_at: new Date().toISOString(),
          statut: "confirmee",
        })
        .eq("id", reservation.id);

      await supabase
        .from("residences")
        .update({ disponible: false })
        .eq("id", reservation.residence_id);
    } else if (evenement === "payment.failed") {
      await supabase
        .from("reservations")
        .update({ statut: "paiement_echoue" })
        .eq("id", reservation.id);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Erreur webhook GeniusPay :", err);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}