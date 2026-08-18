import Link from "next/link";
import Header from "@/components/Header";

export default function NotFound() {
  return (
    <>
      <Header />
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <p className="text-6xl font-bold text-bleu-600 mb-4">404</p>
        <h1 className="text-xl font-bold text-anthracite-800 mb-2">
          Page introuvable
        </h1>
        <p className="text-anthracite-500 text-sm mb-8">
          Cette page ou cette résidence n&apos;existe pas ou n&apos;est plus disponible.
        </p>
        <Link
          href="/"
          className="inline-block bg-rouge-500 hover:bg-rouge-600 text-white font-semibold px-6 py-3 rounded-md transition"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    </>
  );
}