import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function MessagesProprietairePage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: proprietaire } = await supabase
    .from("proprietaires")
    .select("id")
    .eq("auth_id", user.id)
    .single();

  const { data: conversations } = await supabase
    .from("conversations")
    .select("*, residences(titre), clients(nom)")
    .eq("proprietaire_id", proprietaire.id)
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-anthracite-800 mb-6">Messages</h1>

      {conversations && conversations.length > 0 ? (
        <div className="space-y-3">
          {conversations.map((c) => (
            <Link
              key={c.id}
              href={`/proprietaire/messages/${c.id}`}
              className="block bg-white border border-anthracite-100 rounded-lg p-4 hover:shadow-md transition"
            >
              <p className="font-semibold text-anthracite-800">{c.residences?.titre}</p>
              <p className="text-sm text-anthracite-400">Client : {c.clients?.nom}</p>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-anthracite-400">Aucune conversation pour l&apos;instant.</p>
      )}
    </div>
  );
}