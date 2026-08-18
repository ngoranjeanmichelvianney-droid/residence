import { createClient } from "@/lib/supabase/server";
import ProprietaireActions from "@/components/ProprietaireActions";

export default async function AdminProprietairesPage() {
  const supabase = createClient();

  const { data: proprietaires } = await supabase
    .from("proprietaires")
    .select("*")
    .order("created_at", { ascending: false });

  const proprietairesAvecPieces = await Promise.all(
    (proprietaires || []).map(async (p) => {
      let urlRecto = null;
      let urlVerso = null;

      if (p.piece_identite_recto_path) {
        const { data } = await supabase.storage
          .from("pieces-identite")
          .createSignedUrl(p.piece_identite_recto_path, 60 * 10);
        urlRecto = data?.signedUrl || null;
      }

      if (p.piece_identite_verso_path) {
        const { data } = await supabase.storage
          .from("pieces-identite")
          .createSignedUrl(p.piece_identite_verso_path, 60 * 10);
        urlVerso = data?.signedUrl || null;
      }

      return { ...p, urlRecto, urlVerso };
    })
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-anthracite-800 mb-6">
        Gestion des propriétaires
      </h1>

      <div className="space-y-3">
        {proprietairesAvecPieces.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between bg-white border border-anthracite-100 rounded-lg p-4"
          >
            <div>
              <p className="font-semibold text-anthracite-800">{p.nom}</p>
              <p className="text-sm text-anthracite-400">
                {p.email} · {p.telephone}
              </p>

              <div className="flex items-center gap-3 mt-1">
                {p.urlRecto ? (
                  <a
                    href={p.urlRecto}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-bleu-600 hover:underline"
                  >
                    Recto
                  </a>
                ) : (
                  <span className="text-xs text-rouge-500">Recto manquant</span>
                )}
                {p.urlVerso ? (
                  <a
                    href={p.urlVerso}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-bleu-600 hover:underline"
                  >
                    Verso
                  </a>
                ) : (
                  <span className="text-xs text-rouge-500">Verso manquant</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span
                className={`text-xs font-semibold px-3 py-1 rounded-full ${
                  p.statut === "actif"
                    ? "bg-bleu-100 text-bleu-600"
                    : p.statut === "refuse"
                    ? "bg-rouge-50 text-rouge-500"
                    : "bg-jaune-50 text-jaune-500"
                }`}
              >
                {p.statut}
              </span>
              {p.statut === "en_attente" && (
                <ProprietaireActions id={p.id} nom={p.nom} email={p.email} />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}