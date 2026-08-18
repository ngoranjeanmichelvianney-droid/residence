import { createClient } from "@/lib/supabase/server";
import { verifierPaiementGenius } from "@/lib/geniuspay";
import Header from "@/components/Header";
import Link from "next/link";
import { CheckCircle2, Clock, MapPin, Phone } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ConfirmationPage({ params }) {
  const supabase = createClient();

  let { data: reservation } = await supabase
    .from("reservations")
    .select("*, residences(titre, adresse, proprietaires(nom, telephone))")
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

  // Si pas encore marqué payé en base (ex: pas de webhook en local),
  // on vérifie directement auprès de GeniusPay avant d'afficher la page.
  if (!reservation.paye && reservation.reference_paiement) {
    try {
      const paiement = await verifierPaiementGenius(reservation.reference_paiement);

      // En sandbox, GeniusPay renvoie "scenario" plutôt que "status".
      const succes = paiement.status === "success" || paiement.scenario === "success";

      if (succes) {
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

        // On relit la réservation à jour pour l'affichage
        const { data: reservationMaj } = await supabase
          .from("reservations")
          .select("*, residences(titre, adresse, proprietaires(nom, telephone))")
          .eq("id", reservation.id)
          .single();

        reservation = reservationMaj;
      }
    } catch (err) {
      console.error("Erreur vérification paiement GeniusPay :", err);
    }
  }

  const residence = reservation.residences;
  const proprietaireTelephone = residence?.proprietaires?.telephone;
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
            <div className="border-t border-anthracite-100 pt-3">
              {proprietaireTelephone ? (
                <div className="bg-bleu-50 rounded-md p-3 flex items-center gap-3">
                  <Phone size={18} className="text-bleu-600 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-anthracite-500">
                      Contact du propriétaire
                      {proprietaireNom ? ` (${proprietaireNom})` : ""} — pour toute
                      information ou complication en vous rendant à la résidence
                    </p>
                    <a
                      href={`tel:${proprietaireTelephone}`}
                      className="text-bleu-600 font-bold text-base hover:underline"
                    >
                      {proprietaireTelephone}
                    </a>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-anthracite-500">
                  Le numéro du propriétaire n&apos;est pas encore renseigné. Vous
                  serez contacté directement pour les détails d&apos;arrivée.
                </p>
              )}
            </div>
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