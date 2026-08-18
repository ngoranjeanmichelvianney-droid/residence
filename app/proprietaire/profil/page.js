import { createClient } from "@/lib/supabase/server";

export default async function ProfilProprietaire() {
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
        <p className="text-anthracite-600">Profil introuvable.</p>
      </div>
    );
  }

  let urlRecto = null;
  let urlVerso = null;

  if (proprietaire.piece_identite_recto_path) {
    const { data } = await supabase.storage
      .from("pieces-identite")
      .createSignedUrl(proprietaire.piece_identite_recto_path, 60 * 10);
    urlRecto = data?.signedUrl || null;
  }

  if (proprietaire.piece_identite_verso_path) {
    const { data } = await supabase.storage
      .from("pieces-identite")
      .createSignedUrl(proprietaire.piece_identite_verso_path, 60 * 10);
    urlVerso = data?.signedUrl || null;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-anthracite-800 mb-6">Mon profil</h1>

      <div className="bg-white border border-anthracite-100 rounded-lg p-6 space-y-4">
        <div>
          <p className="text-xs text-anthracite-400 uppercase tracking-wide">Nom complet</p>
          <p className="text-anthracite-800 font-medium">{proprietaire.nom}</p>
        </div>

        <div>
          <p className="text-xs text-anthracite-400 uppercase tracking-wide">Email</p>
          <p className="text-anthracite-800 font-medium">{proprietaire.email}</p>
        </div>

        <div>
          <p className="text-xs text-anthracite-400 uppercase tracking-wide">Téléphone</p>
          <p className="text-anthracite-800 font-medium">{proprietaire.telephone}</p>
        </div>

        <div>
          <p className="text-xs text-anthracite-400 uppercase tracking-wide">Statut du compte</p>
          <span
            className={`inline-block mt-1 text-xs font-semibold px-3 py-1 rounded-full ${
              proprietaire.statut === "actif"
                ? "bg-bleu-100 text-bleu-600"
                : proprietaire.statut === "refuse"
                ? "bg-rouge-50 text-rouge-500"
                : "bg-jaune-50 text-jaune-500"
            }`}
          >
            {proprietaire.statut}
          </span>
        </div>

        <div>
          <p className="text-xs text-anthracite-400 uppercase tracking-wide mb-1">
            Pièce d&apos;identité
          </p>
          <div className="flex gap-3">
            {urlRecto ? (
              <a
                href={urlRecto}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-bleu-600 hover:underline"
              >
                Voir le recto
              </a>
            ) : (
              <span className="text-sm text-anthracite-400">Recto non fourni</span>
            )}
            {urlVerso ? (
              <a
                href={urlVerso}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-bleu-600 hover:underline"
              >
                Voir le verso
              </a>
            ) : (
              <span className="text-sm text-anthracite-400">Verso non fourni</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}