import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { envoyerEmail, emailConfirmationPaiement } from "@/lib/email";

// Un webhook est appelé directement par GeniusPay, sans session utilisateur
// (pas de cookies). On utilise donc la clé service_role, qui contourne les
// règles RLS habituelles — nécessaire ici, sinon la mise à jour échouerait
// silencieusement faute d'utilisateur identifié.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Ce endpoint doit être enregistré via l'API GeniusPay (POST /api/v1/merchant/webhooks)
// avec l'URL ngrok en dev, et le vrai domaine en production.

export async function POST(request) {
  try {
    // --- IMPORTANT : lire le corps en texte brut AVANT de le parser,
    // la vérification de signature a besoin du JSON exact envoyé par GeniusPay ---
    const texteBrut = await request.text();

    const signature = request.headers.get("x-webhook-signature");
    const timestamp = request.headers.get("x-webhook-timestamp");

    const secret = process.env.GENIUSPAY_WEBHOOK_SECRET;
    const donneesAVerifier = `${timestamp}.${texteBrut}`;
    const signatureAttendue = crypto
      .createHmac("sha256", secret)
      .update(donneesAVerifier)
      .digest("hex");

    const signatureValide =
      signature &&
      signature.length === signatureAttendue.length &&
      crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(signatureAttendue)
      );

    if (!signatureValide) {
      console.error("Webhook GeniusPay : signature invalide, requête rejetée.");
      return NextResponse.json({ message: "Signature invalide" }, { status: 401 });
    }

    // Protection anti-rejeu : refuse un webhook de plus de 5 minutes
    const maintenant = Math.floor(Date.now() / 1000);
    if (Math.abs(maintenant - Number(timestamp)) > 300) {
      return NextResponse.json({ message: "Timestamp expiré" }, { status: 400 });
    }

    const payload = JSON.parse(texteBrut);

    const evenement = payload?.event; // ex: "payment.success" | "payment.failed"
    const statut = payload?.data?.status; // ex: "completed" | "failed"
    const reference = payload?.data?.reference;
    const methodePaiement = payload?.data?.provider || payload?.data?.payment_method;
    const reservationId = payload?.data?.metadata?.reservation_id;

    if (!reference && !reservationId) {
      return NextResponse.json({ message: "Payload invalide" }, { status: 400 });
    }

    let query = supabaseAdmin.from("reservations").select("*");
    query = reservationId
      ? query.eq("id", reservationId)
      : query.eq("reference_paiement", reference);

    const { data: reservation } = await query.single();

    if (!reservation) {
      return NextResponse.json({ message: "Réservation introuvable" }, { status: 404 });
    }

    if (evenement === "payment.success" && statut === "completed") {
      await supabaseAdmin
        .from("reservations")
        .update({
          paye: true,
          paye_at: new Date().toISOString(),
          statut: "confirmee",
          methode_paiement: methodePaiement || null,
        })
        .eq("id", reservation.id);

      await supabaseAdmin
        .from("residences")
        .update({ disponible: false })
        .eq("id", reservation.residence_id);

      // Envoie l'email de confirmation si le client a renseigné une adresse
      const { data: details } = await supabaseAdmin
        .from("reservations")
        .select("*, residences(id, titre), clients(nom, email)")
        .eq("id", reservation.id)
        .single();

      const emailClient = details?.clients?.email;

      if (emailClient) {
        // Cherche la conversation existante (créée seulement une fois
        // que le client clique "Contacter le propriétaire"), sinon le
        // lien pointera simplement vers la page de la résidence.
        const { data: conversation } = await supabaseAdmin
          .from("conversations")
          .select("id")
          .eq("residence_id", details.residence_id)
          .eq("client_id", details.client_id)
          .maybeSingle();

        const lienConversation = conversation
          ? `${process.env.NEXT_PUBLIC_SITE_URL}/mes-messages/${conversation.id}`
          : `${process.env.NEXT_PUBLIC_SITE_URL}/api/messages/conversation/creer-et-rediriger?residenceId=${details.residence_id}`;

        const { sujet, html } = emailConfirmationPaiement({
          nomClient: details.clients.nom,
          titreResidence: details.residences?.titre || "votre résidence",
          dateArrivee: new Date(details.date_arrivee).toLocaleDateString("fr-FR"),
          dateDepart: new Date(details.date_depart).toLocaleDateString("fr-FR"),
          montant: details.montant,
          lienConversation,
        });

        envoyerEmail({ destinataire: emailClient, sujet, html }).catch((err) =>
          console.error("Erreur envoi email confirmation paiement :", err)
        );
      }
    } else if (evenement === "payment.failed") {
      await supabaseAdmin
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