import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import ResidenceDeleteAction from "@/components/ResidenceDeleteAction";

export default async function DashboardProprietaire() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: proprietaire } = await supabase
    .from("proprietaires")
    .select("*")
    .eq("auth_id", user.id)
    .single();

  if (!proprietaire) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="bg-anthracite-100 rounded-lg p-8">
          <h1 className="text-xl font-bold text-anthracite-800 mb-2">
            Aucun profil propriétaire trouvé
          </h1>
          <p className="text-anthracite-600 text-sm">
            Ce compte n&apos;est pas enregistré comme propriétaire. Si vous
            pensez que c&apos;est une erreur, contactez l&apos;administrateur.
          </p>
        </div>
      </div>
    );
  }

  // Compte en attente de validation par l'admin
  if (proprietaire?.statut === "en_attente") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="bg-jaune-50 border border-jaune-300 rounded-lg p-8">
          <h1 className="text-xl font-bold text-anthracite-800 mb-2">
            Compte en attente de validation
          </h1>
          <p className="text-anthracite-600 text-sm">
            Votre compte doit être validé par l&apos;administrateur avant de
            pouvoir ajouter des résidences.
          </p>
        </div>
      </div>
    );
  }

  if (proprietaire?.statut === "refuse") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="bg-rouge-50 border border-rouge-500 rounded-lg p-8">
          <h1 className="text-xl font-bold text-anthracite-800 mb-2">
            Compte refusé
          </h1>
          <p className="text-anthracite-600 text-sm">
            Contactez l&apos;administrateur pour plus d&apos;informations.
          </p>
        </div>
      </div>
    );
  }

  const { data: residences } = await supabase
    .from("residences")
    .select("*, reservations(count)")
    .eq("proprietaire_id", proprietaire.id)
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-anthracite-800">
            Bonjour, {proprietaire.nom}
          </h1>
          <p className="text-anthracite-400 text-sm">Votre espace propriétaire</p>
        </div>
        <Link
          href="/proprietaire/residences/nouvelle"
          className="bg-rouge-500 hover:bg-rouge-600 text-white font-semibold px-5 py-2.5 rounded-md transition"
        >
          + Ajouter une résidence
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        <div className="bg-bleu-50 border border-bleu-100 rounded-lg p-5">
          <p className="text-sm text-anthracite-400">Résidences</p>
          <p className="text-2xl font-bold text-bleu-600">
            {residences?.length || 0}
          </p>
        </div>
        <div className="bg-jaune-50 border border-jaune-300 rounded-lg p-5">
          <p className="text-sm text-anthracite-400">Publiées</p>
          <p className="text-2xl font-bold text-anthracite-800">
            {residences?.filter((r) => r.statut === "publie").length || 0}
          </p>
        </div>
        <div className="bg-rouge-50 border border-rouge-500/20 rounded-lg p-5">
          <p className="text-sm text-anthracite-400">En brouillon</p>
          <p className="text-2xl font-bold text-anthracite-800">
            {residences?.filter((r) => r.statut === "brouillon").length || 0}
          </p>
        </div>
      </div>

      <h2 className="text-lg font-bold text-anthracite-800 mb-4">
        Mes résidences
      </h2>

      {residences && residences.length > 0 ? (
        <div className="space-y-3">
          {residences.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between bg-white border border-anthracite-100 rounded-lg p-4 hover:shadow-md transition"
            >
              <Link href={`/proprietaire/residences/${r.id}`} className="flex-1">
                <p className="font-semibold text-anthracite-800">{r.titre}</p>
                <p className="text-sm text-anthracite-400">
                  {r.prix_nuit?.toLocaleString("fr-FR")} FCFA / nuit
                </p>
              </Link>
              <div className="flex items-center gap-3">
                <span
                  className={`text-xs font-semibold px-3 py-1 rounded-full ${
                    r.statut === "publie"
                      ? "bg-bleu-100 text-bleu-600"
                      : r.statut === "en_attente_validation"
                      ? "bg-jaune-50 text-jaune-500"
                      : "bg-anthracite-100 text-anthracite-600"
                  }`}
                >
                  {r.statut === "publie"
                    ? "Publiée"
                    : r.statut === "en_attente_validation"
                    ? "En attente"
                    : "Brouillon"}
                </span>
                <ResidenceDeleteAction id={r.id} titre={r.titre} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-anthracite-400">
          Aucune résidence pour l&apos;instant. Ajoutez-en une !
        </p>
      )}
    </div>
  );
}