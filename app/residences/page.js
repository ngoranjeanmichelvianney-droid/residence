import { createClient } from "@/lib/supabase/server";
import Header from "@/components/Header";
import ResidenceCard from "@/components/ResidenceCard";
import SearchBar from "@/components/SearchBar";

export default async function ResidencesListPage({ searchParams }) {
  const supabase = createClient();
  const q = searchParams?.q?.trim() || "";

  let query = supabase
    .from("residences")
    .select("*")
    .eq("statut", "publie")
    .order("created_at", { ascending: false });

  if (q) {
    query = query.or(`titre.ilike.%${q}%,adresse.ilike.%${q}%`);
  }

  const { data: residences } = await query;

  return (
    <>
      <Header />
      <div className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-anthracite-800 mb-4">
          Toutes nos résidences
        </h1>

        <SearchBar />

        {q && (
          <p className="text-sm text-anthracite-400 mt-6 mb-2">
            Résultats pour « {q} »
          </p>
        )}

        {residences && residences.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {residences.map((r) => (
              <ResidenceCard key={r.id} residence={r} />
            ))}
          </div>
        ) : (
          <p className="text-anthracite-400 mt-6">
            Aucune résidence trouvée{q && ` pour « ${q} »`}.
          </p>
        )}
      </div>
    </>
  );
}