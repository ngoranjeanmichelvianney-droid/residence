"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

const DUREE_AVANT_FERMETURE = 2200; // ms

export default function IntroSplash() {
  const [visible, setVisible] = useState(null); // null = pas encore déterminé
  const [enSortie, setEnSortie] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    const dejaVu = sessionStorage.getItem("introVue");
    if (dejaVu) {
      setVisible(false);
      return;
    }
    setVisible(true);

    // On tente de jouer le son automatiquement. Les navigateurs mobiles
    // bloquent souvent l'autoplay avec son : si ça échoue, l'animation
    // visuelle se joue quand même, silencieusement.
    audioRef.current?.play().catch(() => {});

    const timer = setTimeout(() => {
      fermerIntro();
    }, DUREE_AVANT_FERMETURE);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function fermerIntro() {
    setEnSortie(true);
    sessionStorage.setItem("introVue", "1");
    setTimeout(() => setVisible(false), 600); // laisse le temps au fondu
  }

  if (visible === false) return null;
  if (visible === null) return null; // évite un flash avant la vérification

  return (
    <div
      onClick={fermerIntro}
      className={`fixed inset-0 z-[9999] bg-bleu-600 flex items-center justify-center cursor-pointer ${
        enSortie ? "intro-overlay-sortie" : ""
      }`}
    >
      <audio ref={audioRef} src="/sounds/intro-ding.mp3" preload="auto" />

      <div className="relative overflow-hidden">
        <div className="intro-logo relative w-28 h-28 rounded-2xl overflow-hidden bg-white shadow-2xl">
          <Image
            src="/images/L1.jpeg"
            alt="Les Résidences Testi"
            fill
            className="object-contain p-3"
            priority
          />
          <div className="intro-shine absolute inset-0 w-1/3 bg-white/40 blur-sm" />
        </div>
      </div>
    </div>
  );
}