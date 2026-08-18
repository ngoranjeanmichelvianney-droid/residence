import { createClient } from "@/lib/supabase/server";
import ResidenceForm from "@/components/ResidenceForm";

export default async function NouvelleResidencePage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: proprietaire } = await supabase
    .from("proprietaires")
    .select("id")
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
            Ce compte n&apos;est pas enregistré comme propriétaire.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-anthracite-800 mb-6">
        Ajouter une résidence
      </h1>
      <ResidenceForm proprietaireId={proprietaire.id} />
    </div>
  );
}