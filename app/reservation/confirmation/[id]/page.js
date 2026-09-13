import { createClient } from "@/lib/supabase/server";
import Header from "@/components/Header";
import BoutonRecu from "@/components/BoutonRecu";
import Link from "next/link";
import { CheckCircle2, Clock, MapPin, MessageCircle } from "lucide-react";
import { envoyerEmail, emailConfirmationPaiement } from "@/lib/email";

export const dynamic = "force-dynamic";

export default async function ConfirmationPage({ params, searchParams }) {
  const supabase = createClient();

  let { data: reservation } = await supabase
    .from("reservations")
    .select("*, residences(id, titre, adresse, proprietaires(nom)), clients(nom, email)")
    .eq("id", params.id)
    .single();

  if (!reservation) {
    return (
      <>
        <Header />
        <div className="max-w-md mx-auto px-4 py-24 text-center">
          <p className="text-anthracite-600">Réservation introuvable.</p>
          <Link href="/" className="text-bleu-600 hover:underline text-sm mt-4 inline-block">
            Retour à l&apos;accueil
          </Link>
        </div>
      </>
    );
  }

  const statutRetour = searchParams?.status;
  const referenceRetour = searchParams?.reference;

  const paiementConfirmeParRetour =
    statutRetour === "completed" || statutRetour === "success";

  // Filet de sécurité : si le webhook GeniusPay n'est pas encore arrivé quand
  // le client revient sur cette page après paiement, on marque la réservation
  // comme payée ici. On envoie alors le même email de confirmation que le
  // webhook envoie normalement, pour ne pas laisser le client sans reçu.
  if (!reservation.paye && paiementConfirmeParRetour) {
    const referenceValide =
      !reservation.reference_paiement || reservation.reference_paiement === referenceRetour;

    if (referenceValide) {
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

      const { data: reservationMaj } = await supabase
        .from("reservations")
        .select("*, residences(id, titre, adresse, proprietaires(nom)), clients(nom, email)")
        .eq("id", reservation.id)
        .single();

      reservation = reservationMaj;

      const emailClient = reservation?.clients?.email;

      if (emailClient) {
        const { data: conversation } = await supabase
          .from("conversations")
          .select("id")
          .eq("residence_id", reservation.residence_id)
          .eq("client_id", reservation.client_id)
          .maybeSingle();

        const lienConversation = conversation
          ? `${process.env.NEXT_PUBLIC_SITE_URL}/mes-messages/${conversation.id}`
          : `${process.env.NEXT_PUBLIC_SITE_URL}/api/messages/conversation/creer-et-rediriger?residenceId=${reservation.residence_id}`;

        const { sujet, html } = emailConfirmationPaiement({
          nomClient: reservation.clients.nom,
          titreResidence: reservation.residences?.titre || "votre résidence",
          dateArrivee: new Date(reservation.date_arrivee).toLocaleDateString("fr-FR"),
          dateDepart: new Date(reservation.date_depart).toLocaleDateString("fr-FR"),
          montant: reservation.montant,
          lienConversation,
        });

        envoyerEmail({ destinataire: emailClient, sujet, html }).catch((err) =>
          console.error("Erreur envoi email confirmation paiement (fallback page) :", err)
        );
      }
    }
  }

  const residence = reservation.residences;
  const proprietaireNom = residence?.proprietaires?.nom;

  return (
    <>
      <Header />
      <div className="max-w-lg mx-auto px-4 py-16">
        {reservation.paye ? (
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-bleu-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} className="text-bleu-600" />
            </div>
            <h1 className="text-xl font-bold text-anthracite-800 mb-1">
              Paiement confirmé !
            </h1>
            <p className="text-sm text-anthracite-500">
              Votre réservation est validée, aucune autre étape n&apos;est nécessaire.
            </p>
          </div>
        ) : (
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-jaune-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock size={32} className="text-jaune-500" />
            </div>
            <h1 className="text-xl font-bold text-anthracite-800 mb-1">
              Traitement du paiement en cours...
            </h1>
            <p className="text-sm text-anthracite-500">
              Actualisez cette page dans quelques instants si la confirmation n&apos;apparaît pas.
            </p>
          </div>
        )}

        <div className="bg-white border border-anthracite-100 rounded-xl p-5 space-y-3">
          <div>
            <p className="font-bold text-anthracite-800">{residence?.titre}</p>
            <div className="flex items-center gap-1 text-sm text-anthracite-400 mt-1">
              <MapPin size={14} />
              <span>{residence?.adresse}</span>
            </div>
          </div>

          <div className="border-t border-anthracite-100 pt-3 text-sm text-anthracite-600">
            <p>
              Du{" "}
              <strong>
                {new Date(reservation.date_arrivee).toLocaleDateString("fr-FR")}
              </strong>{" "}
              au{" "}
              <strong>
                {new Date(reservation.date_depart).toLocaleDateString("fr-FR")}
              </strong>
            </p>
            <p className="mt-1">
              Montant payé :{" "}
              <strong className="text-bleu-600">
                {reservation.montant?.toLocaleString("fr-FR")} FCFA
              </strong>
            </p>
          </div>

          {reservation.paye && (
            <>
              <div className="border-t border-anthracite-100 pt-3">
                <p className="text-xs text-anthracite-500 mb-2">
                  Pour toute question ou précision sur votre arrivée, contactez
                  {proprietaireNom ? ` ${proprietaireNom}` : " le propriétaire"} directement
                  via la messagerie HomTesti.
                </p>
                <ContacterProprietaireBouton residenceId={residence?.id} />
              </div>

              <div className="border-t border-anthracite-100 pt-3">
                <BoutonRecu reservationId={reservation.id} paye={reservation.paye} />
              </div>
            </>
          )}
        </div>

        <Link
          href="/"
          className="block text-center text-bleu-600 hover:underline text-sm mt-6"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    </>
  );
}

function ContacterProprietaireBouton({ residenceId }) {
  return (
    <a
      href={`/api/messages/conversation/creer-et-rediriger?residenceId=${residenceId}`}
      className="flex items-center justify-center gap-2 w-full bg-bleu-600 hover:bg-bleu-700 text-white font-semibold py-2.5 rounded-md transition"
    >
      <MessageCircle size={18} />
      Contacter le propriétaire
    </a>
  );
}