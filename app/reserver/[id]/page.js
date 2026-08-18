import { createClient } from "@/lib/supabase/server";
import Header from "@/components/Header";
import ReserverResidence from "@/components/ReserverResidence";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Users } from "lucide-react";
import { notFound } from "next/navigation";

export default async function ReserverPage({ params, searchParams }) {
  const supabase = createClient();

  const { data: residence } = await supabase
    .from("residences")
    .select("*, proprietaires(nom, telephone)")
    .eq("id", params.id)
    .eq("statut", "publie")
    .single();

  if (!residence) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let clientConnecte = null;
  if (user) {
    const { data: client } = await supabase
      .from("clients")
      .select("*")
      .eq("auth_id", user.id)
      .maybeSingle();
    clientConnecte = client;
  }

  return (
    <>
      <Header />
      <div className="max-w-5xl mx-auto px-4 py-10">
        <Link
          href={`/residences/${residence.id}`}
          className="text-sm text-bleu-600 hover:underline mb-6 inline-block"
        >
          ← Retour à la résidence
        </Link>

        <h1 className="text-2xl font-bold text-anthracite-800 mb-8">
          Finaliser votre réservation
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Récap résidence, fixe en scroll */}
          <div className="md:col-span-2">
            <div className="bg-white border border-anthracite-100 rounded-xl overflow-hidden md:sticky md:top-6">
              <div className="relative h-44 w-full bg-anthracite-100">
                {residence.images?.[0] && (
                  <Image
                    src={residence.images[0]}
                    alt={residence.titre}
                    fill
                    className="object-cover"
                  />
                )}
              </div>
              <div className="p-5">
                <p className="font-bold text-anthracite-800 text-lg">
                  {residence.titre}
                </p>

                <div className="flex items-center gap-1 text-sm text-anthracite-400 mt-1">
                  <MapPin size={14} />
                  <span>{residence.adresse}</span>
                </div>

                <div className="flex items-center gap-1 text-sm text-anthracite-400 mt-1">
                  <Users size={14} />
                  <span>{residence.capacite} personnes</span>
                </div>

                <div className="border-t border-anthracite-100 mt-4 pt-4">
                  <p className="text-2xl font-bold text-bleu-600">
                    {residence.prix_nuit?.toLocaleString("fr-FR")} FCFA
                    <span className="text-anthracite-400 font-normal text-sm">
                      {" "}
                      / nuit
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Formulaire de réservation */}
          <div className="md:col-span-3">
            <div className="bg-white border border-anthracite-100 rounded-xl p-6">
              <h2 className="font-bold text-anthracite-800 mb-4">
                Vos dates de séjour
              </h2>
              <ReserverResidence
                residenceId={residence.id}
                prixNuit={residence.prix_nuit}
                client={clientConnecte}
                disponible={residence.disponible}
                proprietaireTelephone={residence.proprietaires?.telephone}
                proprietaireNom={residence.proprietaires?.nom}
                dateArriveeInitiale={searchParams?.arrivee || ""}
                dateDepartInitiale={searchParams?.depart || ""}
                messageInitial={searchParams?.message || ""}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}