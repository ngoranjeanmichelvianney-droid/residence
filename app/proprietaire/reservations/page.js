import { createClient } from "@/lib/supabase/server";
import ReservationActions from "@/components/ReservationActions";

export default async function ProprietaireReservationsPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: proprietaire } = await supabase
    .from("proprietaires")
    .select("id")
    .eq("auth_id", user.id)
    .single();

  const { data: reservations } = await supabase
    .from("reservations")
    .select("*, residences(titre, proprietaire_id)")
    .eq("residences.proprietaire_id", proprietaire.id)
    .order("created_at", { ascending: false });

  const reservationsFiltrees = reservations?.filter((r) => r.residences) || [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-anthracite-800 mb-6">
        Réservations reçues
      </h1>

      {reservationsFiltrees.length > 0 ? (
        <div className="space-y-3">
          {reservationsFiltrees.map((r) => (
            <div
              key={r.id}
              className="bg-white border border-anthracite-100 rounded-lg p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="font-semibold text-anthracite-800">
                    {r.residences?.titre}
                  </p>
                  <p className="text-sm text-anthracite-600 mt-1">
                    {r.client_nom} · {r.client_telephone}
                  </p>
                  <p className="text-sm text-anthracite-400">
                    Du {new Date(r.date_arrivee).toLocaleDateString("fr-FR")} au{" "}
                    {new Date(r.date_depart).toLocaleDateString("fr-FR")}
                  </p>
                  {r.message && (
                    <p className="text-sm text-anthracite-600 mt-2 italic">
                      &quot;{r.message}&quot;
                    </p>
                  )}
                  {r.presence_confirmee_at && (
                    <p className="text-xs font-semibold text-bleu-600 mt-2">
                      Présence confirmée par le client
                    </p>
                  )}
                </div>

                <span
                  className={`text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap ${
                    r.statut === "confirmee"
                      ? "bg-bleu-100 text-bleu-600"
                      : r.statut === "refusee"
                      ? "bg-rouge-50 text-rouge-500"
                      : r.statut === "annulee"
                      ? "bg-anthracite-100 text-anthracite-600"
                      : r.statut === "terminee"
                      ? "bg-anthracite-800 text-white"
                      : "bg-jaune-50 text-jaune-500"
                  }`}
                >
                  {r.statut === "confirmee"
                    ? "Confirmée"
                    : r.statut === "refusee"
                    ? "Refusée"
                    : r.statut === "annulee"
                    ? "Annulée"
                    : r.statut === "terminee"
                    ? "Terminée"
                    : "En attente"}
                </span>
              </div>

              {(r.statut === "en_attente" || r.statut === "confirmee") && (
                <div className="mt-3 pt-3 border-t border-anthracite-100">
                  <ReservationActions
                    id={r.id}
                    residenceId={r.residence_id}
                    statut={r.statut}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-anthracite-400">Aucune réservation pour l&apos;instant.</p>
      )}
    </div>
  );
}