import { createClient } from "@/lib/supabase/server";
import Header from "@/components/Header";

export default async function ProfilClient() {
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

  return (
    <>
      <Header />
      <div className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-anthracite-800 mb-6">Mon profil</h1>

        <div className="bg-white border border-anthracite-100 rounded-lg p-6 space-y-4">
          <div>
            <p className="text-xs text-anthracite-400 uppercase tracking-wide">Nom complet</p>
            <p className="text-anthracite-800 font-medium">{client.nom}</p>
          </div>

          <div>
            <p className="text-xs text-anthracite-400 uppercase tracking-wide">Email</p>
            <p className="text-anthracite-800 font-medium">{client.email}</p>
          </div>

          <div>
            <p className="text-xs text-anthracite-400 uppercase tracking-wide">Téléphone</p>
            <p className="text-anthracite-800 font-medium">{client.telephone}</p>
          </div>
        </div>
      </div>
    </>
  );
}