"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function GalerieImages({ images = [], titre = "" }) {
  const [index, setIndex] = useState(0);

  const liste = images?.length > 0 ? images : [];

  function prev() {
    setIndex((i) => (i === 0 ? liste.length - 1 : i - 1));
  }

  function next() {
    setIndex((i) => (i === liste.length - 1 ? 0 : i + 1));
  }

  if (liste.length === 0) {
    return (
      <div className="w-full h-80 bg-bleu-50 rounded-xl flex items-center justify-center text-anthracite-400 text-sm">
        Pas d&apos;image disponible
      </div>
    );
  }

  return (
    <div>
      <div className="relative w-full h-80 rounded-xl overflow-hidden bg-anthracite-100">
        <Image
          src={liste[index]}
          alt={titre}
          fill
          className="object-cover"
          priority
        />

        {liste.length > 1 && (
          <>
            <button
              onClick={prev}
              aria-label="Image précédente"
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-anthracite-800 rounded-full w-9 h-9 flex items-center justify-center transition"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={next}
              aria-label="Image suivante"
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-anthracite-800 rounded-full w-9 h-9 flex items-center justify-center transition"
            >
              <ChevronRight size={20} />
            </button>

            <span className="absolute bottom-3 right-3 bg-bleu-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
              {index + 1} / {liste.length}
            </span>
          </>
        )}
      </div>

      {liste.length > 1 && (
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
          {liste.map((img, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`relative w-20 h-16 flex-shrink-0 rounded-md overflow-hidden border-2 transition ${
                i === index ? "border-bleu-600" : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              <Image src={img} alt={`${titre} ${i + 1}`} fill className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}