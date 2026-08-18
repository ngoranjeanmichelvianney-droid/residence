import "./globals.css";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Les Résidences Testi | Trouvez votre logement",
  description: "Plateforme de réservation de résidences meublées",
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