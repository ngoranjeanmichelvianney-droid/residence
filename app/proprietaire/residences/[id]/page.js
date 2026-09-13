import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ResidenceForm from "@/components/ResidenceForm";

export default async function ModifierResidencePage({ params }) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/connexion");
  }

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

  const { data: residence } = await supabase
    .from("residences")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!residence) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-anthracite-600">Résidence introuvable.</p>
      </div>
    );
  }

  // Sécurité : on vérifie que la résidence appartient bien à ce propriétaire.
  // Sans ce contrôle, n'importe quel propriétaire connecté pourrait modifier
  // la résidence d'un autre simplement en changeant l'id dans l'URL.
  if (residence.proprietaire_id !== proprietaire.id) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="bg-rouge-50 border border-rouge-500 rounded-lg p-8">
          <h1 className="text-xl font-bold text-anthracite-800 mb-2">
            Accès refusé
          </h1>
          <p className="text-anthracite-600 text-sm">
            Cette résidence ne vous appartient pas.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-anthracite-800 mb-6">
        Modifier la résidence
      </h1>
      <ResidenceForm proprietaireId={proprietaire.id} residence={residence} />
    </div>
  );
}