"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ProprietaireLayout({ children }) {
  const [menuOuvert, setMenuOuvert] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleDeconnexion = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-anthracite-50">
      <header className="bg-bleu-600 text-white relative">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold">
            Résidences<span className="text-jaune-400">.</span>
          </Link>

          {/* Nav desktop */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link href="/proprietaire/dashboard" className="hover:text-jaune-300 transition">
              Mes résidences
            </Link>
            <Link href="/proprietaire/reservations" className="hover:text-jaune-300 transition">
              Réservations
            </Link>
            <Link href="/proprietaire/profil" className="hover:text-jaune-300 transition">
              Mon profil
            </Link>
            <button
              onClick={handleDeconnexion}
              className="text-jaune-300 hover:text-white transition"
            >
              Déconnexion
            </button>
          </nav>

          {/* Burger mobile */}
          <button
            onClick={() => setMenuOuvert(!menuOuvert)}
            className="md:hidden p-2"
            aria-label="Menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {menuOuvert ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Dropdown mobile */}
        {menuOuvert && (
          <nav className="md:hidden flex flex-col bg-bleu-600 border-t border-bleu-500 px-4 pb-4 text-sm font-medium">
            <Link
              href="/proprietaire/dashboard"
              onClick={() => setMenuOuvert(false)}
              className="py-3 border-b border-bleu-500/50 hover:text-jaune-300 transition"
            >
              Mes résidences
            </Link>
            <Link
              href="/proprietaire/reservations"
              onClick={() => setMenuOuvert(false)}
              className="py-3 border-b border-bleu-500/50 hover:text-jaune-300 transition"
            >
              Réservations
            </Link>
            <Link
              href="/proprietaire/profil"
              onClick={() => setMenuOuvert(false)}
              className="py-3 border-b border-bleu-500/50 hover:text-jaune-300 transition"
            >
              Mon profil
            </Link>
            <button
              onClick={handleDeconnexion}
              className="py-3 text-left text-jaune-300 hover:text-white transition"
            >
              Déconnexion
            </button>
          </nav>
        )}
      </header>
      {children}
    </div>
  );
}