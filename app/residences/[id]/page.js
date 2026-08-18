import { createClient } from "@/lib/supabase/server";
import Header from "@/components/Header";
import GalerieImages from "@/components/GalerieImages";
import NoterResidence from "@/components/NoterResidence";
import { MapPin, Users, Star } from "lucide-react";
import Link from "next/link";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://homtesti.com";

export async function generateMetadata({ params }) {
  const supabase = createClient();

  const { data: residence } = await supabase
    .from("residences")
    .select("titre, description, adresse, prix_nuit, images")
    .eq("id", params.id)
    .single();

  if (!residence) {
    return { title: "Résidence introuvable | Les Résidences Testi" };
  }

  const titre = `${residence.titre} — ${residence.adresse} | Les Résidences Testi`;
  const description =
    residence.description?.slice(0, 155) ||
    `Réservez ${residence.titre} à ${residence.adresse}, à partir de ${residence.prix_nuit?.toLocaleString("fr-FR")} FCFA / nuit.`;
  const image = residence.images?.[0];

  return {
    title: titre,
    description,
    openGraph: {
      title: titre,
      description,
      url: `${SITE_URL}/residences/${params.id}`,
      siteName: "Les Résidences Testi",
      images: image ? [{ url: image, width: 1200, height: 630 }] : [],
      locale: "fr_FR",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: titre,
      description,
      images: image ? [image] : [],
    },
  };
}

export default async function ResidenceDetailPage({ params, searchParams }) {
  const supabase = createClient();

  const { data: residence } = await supabase
    .from("residences")
    .select("*, proprietaires(nom, telephone)")
    .eq("id", params.id)
    .single();

  if (!residence) {
    return (
      <>
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <p className="text-anthracite-600">Résidence introuvable.</p>
        </div>
      </>
    );
  }

  const { data: avis } = await supabase
    .from("avis")
    .select("note")
    .eq("residence_id", residence.id);

  const nombreAvis = avis?.length || 0;
  const noteMoyenne =
    nombreAvis > 0
      ? avis.reduce((somme, a) => somme + a.note, 0) / nombreAvis
      : null;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let peutNoter = false;
  let clientConnecte = null;
  let reservationId = null;

  if (user) {
    const { data: client } = await supabase
      .from("clients")
      .select("*")
      .eq("auth_id", user.id)
      .maybeSingle();

    if (client) {
      clientConnecte = client;

      const { data: reservation } = await supabase
        .from("reservations")
        .select("id")
        .eq("residence_id", residence.id)
        .eq("client_id", client.id)
        .eq("statut", "terminee")
        .maybeSingle();

      if (reservation) {
        const { data: avisExistant } = await supabase
          .from("avis")
          .select("id")
          .eq("reservation_id", reservation.id)
          .maybeSingle();

        if (!avisExistant) {
          peutNoter = true;
          reservationId = reservation.id;
        }
      }
    }
  }

  // Données structurées pour les moteurs de recherche (schema.org)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    name: residence.titre,
    description: residence.description,
    address: {
      "@type": "PostalAddress",
      addressLocality: residence.adresse,
      addressCountry: "CI",
    },
    image: residence.images?.[0],
    priceRange: `${residence.prix_nuit} XOF`,
    ...(noteMoyenne !== null && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: noteMoyenne.toFixed(1),
        reviewCount: nombreAvis,
      },
    }),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-10">
        <GalerieImages images={residence.images} titre={residence.titre} />

        <div className="flex items-start justify-between mt-6 mb-2">
          <h1 className="text-2xl font-bold text-anthracite-800">
            {residence.titre}
          </h1>
          <span className="text-lg font-bold text-bleu-600 whitespace-nowrap ml-4">
            {residence.prix_nuit?.toLocaleString("fr-FR")} FCFA / nuit
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm text-anthracite-500 mb-4">
          <div className="flex items-center gap-1">
            <MapPin size={16} />
            <span>{residence.adresse}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users size={16} />
            <span>{residence.capacite} personnes</span>
          </div>
          {noteMoyenne !== null && (
            <div className="flex items-center gap-1">
              <Star size={16} className="fill-jaune-400 text-jaune-400" />
              <span>
                {noteMoyenne.toFixed(1)} ({nombreAvis} avis)
              </span>
            </div>
          )}
        </div>

        {residence.description && (
          <p className="text-anthracite-600 leading-relaxed mb-8">
            {residence.description}
          </p>
        )}

        {residence.video_url && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-anthracite-800 mb-2">Vidéo</h2>
            <a
              href={residence.video_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-bleu-600 hover:underline text-sm"
            >
              Voir la vidéo de présentation
            </a>
          </div>
        )}

        {residence.latitude && residence.longitude && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-anthracite-800 mb-2">
              Localisation
            </h2>
            <div className="w-full h-72 rounded-xl overflow-hidden border border-anthracite-100">
              <iframe
                title="Localisation de la résidence"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                src={`https://www.google.com/maps?q=${residence.latitude},${residence.longitude}&z=15&output=embed`}
              />
            </div>
          </div>
        )}

        {peutNoter && (
          <div className="mb-8">
            <NoterResidence
              residenceId={residence.id}
              clientId={clientConnecte.id}
              reservationId={reservationId}
            />
          </div>
        )}

        {residence.disponible ? (
          <Link
            href={`/reserver/${residence.id}`}
            className="block w-full bg-rouge-500 hover:bg-rouge-600 text-white font-semibold py-3 rounded-lg transition text-center"
          >
            Réserver cette résidence
          </Link>
        ) : (
          <div className="w-full bg-anthracite-100 text-anthracite-500 font-semibold py-3 rounded-lg text-center">
            Résidence actuellement indisponible
          </div>
        )}
      </div>
    </>
  );
}