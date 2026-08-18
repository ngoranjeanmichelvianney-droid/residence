import "./globals.css";
import Footer from "@/components/Footer";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://homtesti.com";

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Les Résidences Testi | Trouvez votre logement",
    template: "%s | Les Résidences Testi",
  },
  description:
    "Des logements meublés vérifiés en Côte d'Ivoire, réservables en quelques clics.",
  openGraph: {
    siteName: "Les Résidences Testi",
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        <div className="flex-1">{children}</div>
        <Footer />
      </body>
    </html>
  );
}