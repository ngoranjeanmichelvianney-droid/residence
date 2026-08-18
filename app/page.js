import Header from "@/components/Header";
import ResidenceCard from "@/components/ResidenceCard";
import SearchBar from "@/components/SearchBar";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = createClient();

  const { data: residences } = await supabase
    .from("residences")
    .select("*")
    .eq("statut", "publie")
    .order("created_at", { ascending: false })
    .limit(6);

  return (
    <>
      <Header />

      <section className="bg-bleu-600 text-white">
        <div className="max-w-6xl mx-auto px-4 py-20 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 break-words">
            Trouvez votre <span className="text-jaune-300">résidence</span> idéale
          </h1>
          <p className="text-base sm:text-lg text-bleu-100 max-w-xl mx-auto">
            Des logements meublés vérifiés, réservables en quelques clics.
          </p>
          <SearchBar />
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-anthracite-800 mb-8">
          Résidences disponibles
        </h2>

        {residences && residences.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {residences.map((r) => (
              <ResidenceCard key={r.id} residence={r} />
            ))}
          </div>
        ) : (
          <p className="text-anthracite-400">
            Aucune résidence disponible pour le moment.
          </p>
        )}
      </section>
    </>
  );
}