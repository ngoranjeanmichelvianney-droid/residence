import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-bleu-700 text-white mt-16">
      <div className="max-w-6xl mx-auto px-4 py-12 grid grid-cols-1 sm:grid-cols-3 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="relative w-9 h-9 rounded-md overflow-hidden bg-white flex-shrink-0">
              <Image src="/images/L1.jpeg" alt="Logo" fill className="object-contain" />
            </div>
            <span className="font-bold text-lg">
              Hom<span className="text-jaune-300">Testi</span>
            </span>
          </div>
          <p className="text-sm text-bleu-100">
            Des logements meublés vérifiés en Côte d&apos;Ivoire, réservables en quelques clics.
          </p>
        </div>

        <div>
          <h3 className="font-semibold mb-3 text-jaune-300">Liens rapides</h3>
          <ul className="space-y-2 text-sm text-bleu-100">
            <li>
              <Link href="/" className="hover:text-white transition">
                Accueil
              </Link>
            </li>
            <li>
              <Link href="/residences" className="hover:text-white transition">
                Résidences
              </Link>
            </li>
            <li>
              <Link href="/proprietaire/dashboard" className="hover:text-white transition">
                Devenir propriétaire
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold mb-3 text-jaune-300">Contact</h3>
          <ul className="space-y-2 text-sm text-bleu-100">
            <li>+225 XX XX XX XX XX</li>
            <li>contact@homtesti.com</li>
            <li>Abidjan, Côte d&apos;Ivoire</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-bleu-500">
        <p className="max-w-6xl mx-auto px-4 py-4 text-xs text-bleu-200 text-center">
          © {new Date().getFullYear()} HomTesti. Tous droits réservés.
        </p>
      </div>
    </footer>
  );
}