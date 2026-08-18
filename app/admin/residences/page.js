import { createClient } from "@/lib/supabase/server";
import ResidenceValidationActions from "@/components/ResidenceValidationActions";
import ResidenceDeleteAction from "@/components/ResidenceDeleteAction";
import Image from "next/image";

export default async function AdminResidencesPage() {
  const supabase = createClient();

  const { data: residences } = await supabase
    .from("residences")
    .select("*, proprietaires(nom, telephone, email)")
    .order("created_at", { ascending: false });

  const enAttente = residences?.filter((r) => r.statut === "en_attente_validation") || [];
  const autres = residences?.filter((r) => r.statut !== "en_attente_validation") || [];

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-anthracite-800 mb-6">
        Gestion des résidences
      </h1>

      {enAttente.length > 0 && (
        <>
          <h2 className="text-lg font-bold text-jaune-500 mb-4">
            En attente de validation ({enAttente.length})
          </h2>
          <div className="space-y-4 mb-10">
            {enAttente.map((r) => (
              <div
                key={r.id}
                className="bg-white border border-jaune-300 rounded-lg p-4 flex gap-4"
              >
                <div className="relative w-32 h-24 bg-anthracite-100 rounded-md overflow-hidden flex-shrink-0">
                  {r.images?.[0] && (
                    <Image src={r.images[0]} alt={r.titre} fill className="object-cover" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-anthracite-800">{r.titre}</p>
                  <p className="text-sm text-anthracite-400">
                    Par {r.proprietaires?.nom} · {r.proprietaires?.telephone}
                  </p>
                  <p className="text-sm text-bleu-600 font-medium mt-1">
                    {r.prix_nuit?.toLocaleString("fr-FR")} FCFA / nuit
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <ResidenceValidationActions id={r.id} />
                  <ResidenceDeleteAction id={r.id} titre={r.titre} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <h2 className="text-lg font-bold text-anthracite-800 mb-4">
        Toutes les résidences
      </h2>
      <div className="space-y-3">
        {autres.map((r) => (
          <div
            key={r.id}
            className="flex items-center justify-between bg-white border border-anthracite-100 rounded-lg p-4"
          >
            <div>
              <p className="font-semibold text-anthracite-800">{r.titre}</p>
              <p className="text-sm text-anthracite-400">
                Par {r.proprietaires?.nom}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`text-xs font-semibold px-3 py-1 rounded-full ${
                  r.statut === "publie"
                    ? "bg-bleu-100 text-bleu-600"
                    : r.statut === "refuse"
                    ? "bg-rouge-50 text-rouge-500"
                    : "bg-anthracite-100 text-anthracite-600"
                }`}
              >
                {r.statut === "publie" ? "Publiée" : r.statut === "refuse" ? "Refusée" : "Brouillon"}
              </span>
              <ResidenceDeleteAction id={r.id} titre={r.titre} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}