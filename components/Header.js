"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Menu, X } from "lucide-react";

export default function Header() {
  const [statut, setStatut] = useState("chargement");
  const [menuOuvert, setMenuOuvert] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function verifier() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setStatut("visiteur");
        return;
      }

      const { data: admin } = await supabase
        .from("admins")
        .select("id")
        .eq("auth_id", user.id)
        .maybeSingle();

      if (admin) {
        setStatut("admin");
        return;
      }

      const { data: proprietaire } = await supabase
        .from("proprietaires")
        .select("id")
        .eq("auth_id", user.id)
        .maybeSingle();

      if (proprietaire) {
        setStatut("proprietaire");
        return;
      }

      setStatut("client");
    }
    verifier();
  }, []);

  async function deconnexion() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="bg-bleu-600 text-white shadow-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-lg sm:text-xl font-bold tracking-tight min-w-0">
          <div className="relative w-9 h-9 rounded-md overflow-hidden bg-white flex-shrink-0">
            <Image src="/images/L1.jpeg" alt="Logo" fill className="object-contain" />
          </div>
          <span className="truncate">
            Hom<span className="text-jaune-400">Testi</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium flex-shrink-0">
          <Link href="/residences" className="hover:text-jaune-300 transition">
            Nos résidences
          </Link>

          {statut === "admin" && (
            <Link href="/admin/proprietaires" className="hover:text-jaune-300 transition">
              Espace admin
            </Link>
          )}

          {statut === "proprietaire" && (
            <Link href="/proprietaire/dashboard" className="hover:text-jaune-300 transition">
              Mon espace
            </Link>
          )}

          {statut === "visiteur" && (
            <Link href="/auth/register?type=proprietaire" className="hover:text-jaune-300 transition">
              Devenir partenaire
            </Link>
          )}

          {statut === "visiteur" && (
            <Link href="/auth/register" className="hover:text-jaune-300 transition">
              Inscription
            </Link>
          )}

          {statut === "client" && (
            <Link href="/profil" className="hover:text-jaune-300 transition">
              Mon profil
            </Link>
          )}

          {statut === "client" && (
            <Link href="/mes-reservations" className="hover:text-jaune-300 transition">
              Mes réservations
            </Link>
          )}

          {(statut === "admin" || statut === "proprietaire" || statut === "client") && (
            <button onClick={deconnexion} className="hover:text-jaune-300 transition">
              Déconnexion
            </button>
          )}

          {statut === "visiteur" && (
            <Link
              href="/auth/login"
              className="bg-rouge-500 hover:bg-rouge-600 px-4 py-2 rounded-md transition"
            >
              Connexion
            </Link>
          )}
        </nav>

        <button
          className="md:hidden flex-shrink-0"
          onClick={() => setMenuOuvert(!menuOuvert)}
          aria-label="Menu"
        >
          {menuOuvert ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      {menuOuvert && (
        <nav className="md:hidden bg-bleu-700 px-4 py-4 flex flex-col gap-4 text-sm font-medium">
          <Link
            href="/residences"
            onClick={() => setMenuOuvert(false)}
            className="hover:text-jaune-300 transition"
          >
            Nos résidences
          </Link>

          {statut === "admin" && (
            <Link
              href="/admin/proprietaires"
              onClick={() => setMenuOuvert(false)}
              className="hover:text-jaune-300 transition"
            >
              Espace admin
            </Link>
          )}

          {statut === "proprietaire" && (
            <Link
              href="/proprietaire/dashboard"
              onClick={() => setMenuOuvert(false)}
              className="hover:text-jaune-300 transition"
            >
              Mon espace
            </Link>
          )}

          {statut === "visiteur" && (
            <Link
              href="/auth/register?type=proprietaire"
              onClick={() => setMenuOuvert(false)}
              className="hover:text-jaune-300 transition"
            >
              Devenir partenaire
            </Link>
          )}

          {statut === "visiteur" && (
            <Link
              href="/auth/register"
              onClick={() => setMenuOuvert(false)}
              className="hover:text-jaune-300 transition"
            >
              Inscription
            </Link>
          )}

          {statut === "client" && (
            <Link
              href="/profil"
              onClick={() => setMenuOuvert(false)}
              className="hover:text-jaune-300 transition"
            >
              Mon profil
            </Link>
          )}

          {statut === "client" && (
            <Link
              href="/mes-reservations"
              onClick={() => setMenuOuvert(false)}
              className="hover:text-jaune-300 transition"
            >
              Mes réservations
            </Link>
          )}

          {(statut === "admin" || statut === "proprietaire" || statut === "client") && (
            <button
              onClick={() => {
                setMenuOuvert(false);
                deconnexion();
              }}
              className="text-left hover:text-jaune-300 transition"
            >
              Déconnexion
            </button>
          )}

          {statut === "visiteur" && (
            <Link
              href="/auth/login"
              onClick={() => setMenuOuvert(false)}
              className="bg-rouge-500 hover:bg-rouge-600 px-4 py-2 rounded-md transition text-center"
            >
              Connexion
            </Link>
          )}
        </nav>
      )}
    </header>
  );
}