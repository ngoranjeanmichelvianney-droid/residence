import { createClient } from "@/lib/supabase/server";
import Header from "@/components/Header";
import ConfirmerPresence from "@/components/ConfirmerPresence";
import Image from "next/image";
import { Phone } from "lucide-react";

export default async function MesReservationsPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("auth_id", user.id)
    .single();

  if (!client) {
    return (
      <>
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <p className="text-anthracite-600">Profil introuvable.</p>
        </div>
      </>
    );
  }

  const { data: reservations } = await supabase
    .from("reservations")
    .select(
      "*, residences(id, titre, images, adresse, proprietaires(nom, telephone))"
    )
    .eq("client_id", client.id)
    .order("date_arrivee", { ascending: false });

  const enCours = (reservations || []).filter(
    (r) => r.statut !== "terminee" && r.statut !== "annulee"
  );
  const historique = (reservations || []).filter(
    (r) => r.statut === "terminee"
  );

  return (
    <>
      <Header />
      <div className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-anthracite-800 mb-8">
          Mes réservations
        </h1>

        {enCours.length > 0 && (
          <>
            <h2 className="text-lg font-bold text-anthracite-800 mb-4">
              En cours
            </h2>
            <div className="space-y-3 mb-10">
              {enCours.map((r) => {
                const telephone = r.residences?.proprietaires?.telephone;
                const nomProprietaire = r.residences?.proprietaires?.nom;

                return (
                  <div
                    key={r.id}
                    className="bg-white border border-anthracite-100 rounded-lg p-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative w-20 h-16 bg-anthracite-100 rounded-md overflow-hidden flex-shrink-0">
                        {r.residences?.images?.[0] && (
                          <Image
                            src={r.residences.images[0]}
                            alt={r.residences.titre}
                            fill
                            className="object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-anthracite-800">
                          {r.residences?.titre}
                        </p>
                        <p className="text-sm text-anthracite-400">
                          Du {r.date_arrivee} au {r.date_depart}
                        </p>
                      </div>
                      {!r.presence_confirmee_at ? (
                        <ConfirmerPresence reservationId={r.id} />
                      ) : (
                        <span className="text-xs font-semibold text-bleu-600 whitespace-nowrap">
                          Présence confirmée
                        </span>
                      )}
                    </div>

                    {r.paye && (
                      <div className="mt-3 pt-3 border-t border-anthracite-100">
                        {telephone ? (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone size={14} className="text-bleu-600 flex-shrink-0" />
                            <span className="text-anthracite-500">
                              Contact propriétaire
                              {nomProprietaire ? ` (${nomProprietaire})` : ""} — pour
                              toute information ou complication en vous rendant à la
                              résidence :
                            </span>
                            <a
                              href={`tel:${telephone}`}
                              className="text-bleu-600 font-bold hover:underline whitespace-nowrap"
                            >
                              {telephone}
                            </a>
                          </div>
                        ) : (
                          <p className="text-xs text-anthracite-400">
                            Le numéro du propriétaire n&apos;est pas encore
                            renseigné.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        <h2 className="text-lg font-bold text-anthracite-800 mb-4">
          Historique des résidences fréquentées
        </h2>
        {historique.length > 0 ? (
          <div className="space-y-3">
            {historique.map((r) => (
              <div
                key={r.id}
                className="flex items-center gap-4 bg-white border border-anthracite-100 rounded-lg p-4"
              >
                <div className="relative w-20 h-16 bg-anthracite-100 rounded-md overflow-hidden flex-shrink-0">
                  {r.residences?.images?.[0] && (
                    <Image
                      src={r.residences.images[0]}
                      alt={r.residences.titre}
                      fill
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-anthracite-800">
                    {r.residences?.titre}
                  </p>
                  <p className="text-sm text-anthracite-400">
                    Du {r.date_arrivee} au {r.date_depart}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-anthracite-400 text-sm">
            Aucune résidence fréquentée pour l&apos;instant.
          </p>
        )}
      </div>
    </>
  );
}