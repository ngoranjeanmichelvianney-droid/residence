import "./globals.css";
import Footer from "@/components/Footer";
import ServiceClientGate from "@/components/ServiceClientGate";
import { createClient } from "@/lib/supabase/server";

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

export default async function RootLayout({ children }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang="fr">
      <body>
        <div className="flex-1">{children}</div>
        <Footer />
        {user && <ServiceClientGate clientId={user.id} />}
      </body>
    </html>
  );
}