"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight, MapPin, Users } from "lucide-react";

export default function ResidenceCard({ residence }) {
  const [index, setIndex] = useState(0);
  const images = residence.images?.length > 0 ? residence.images : [];
  const indisponible = residence.disponible === false;

  function prev(e) {
    e.preventDefault();
    e.stopPropagation();
    setIndex((i) => (i === 0 ? images.length - 1 : i - 1));
  }

  function next(e) {
    e.preventDefault();
    e.stopPropagation();
    setIndex((i) => (i === images.length - 1 ? 0 : i + 1));
  }

  return (
    <div className="group bg-white rounded-2xl overflow-hidden border border-anthracite-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <Link href={`/residences/${residence.id}`} className="block">
        <div className="relative h-48 sm:h-56 bg-anthracite-100 overflow-hidden">
          {images.length > 0 ? (
            <>
              <Image
                src={images[index]}
                alt={residence.titre}
                fill
                className={`object-cover transition-transform duration-500 group-hover:scale-105 ${
                  indisponible ? "grayscale opacity-70" : ""
                }`}
              />

              {images.length > 1 && (
                <>
                  <button
                    onClick={prev}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-anthracite-800 rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={next}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-anthracite-800 rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                  >
                    <ChevronRight size={18} />
                  </button>

                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {images.map((_, i) => (
                      <span
                        key={i}
                        className={`w-1.5 h-1.5 rounded-full transition-all ${
                          i === index ? "bg-jaune-300 w-4" : "bg-white/70"
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}

              <span className="absolute top-3 right-3 bg-bleu-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow">
                {residence.prix_nuit?.toLocaleString("fr-FR")} F/nuit
              </span>

              {indisponible && (
                <span className="absolute top-3 left-3 bg-anthracite-800/80 text-white text-xs font-bold px-3 py-1 rounded-full shadow">
                  Indisponible
                </span>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-anthracite-400 text-sm">
              Pas d'image
            </div>
          )}
        </div>

        <div className="p-4">
          <h3 className="text-base sm:text-lg font-bold text-anthracite-800 truncate">
            {residence.titre}
          </h3>

          <div className="flex items-center gap-1 text-sm text-anthracite-400 mt-1">
            <MapPin size={14} className="flex-shrink-0" />
            <span className="truncate">{residence.adresse}</span>
          </div>

          {residence.description && (
            <p className="text-sm text-anthracite-500 mt-2 line-clamp-2">
              {residence.description}
            </p>
          )}

          <div className="flex items-center gap-1 text-sm text-anthracite-600 mt-2">
            <Users size={14} className="flex-shrink-0" />
            <span>{residence.capacite} personnes</span>
          </div>
        </div>
      </Link>

      <div className="px-4 pb-4">
        {indisponible ? (
          <div className="block w-full text-center bg-anthracite-100 text-anthracite-400 font-semibold py-2.5 rounded-lg cursor-not-allowed">
            Indisponible
          </div>
        ) : (
          <Link
            href={`/residences/${residence.id}`}
            className="block w-full text-center bg-rouge-500 hover:bg-rouge-600 text-white font-semibold py-2.5 rounded-lg transition"
          >
            Réserver
          </Link>
        )}
      </div>
    </div>
  );
}