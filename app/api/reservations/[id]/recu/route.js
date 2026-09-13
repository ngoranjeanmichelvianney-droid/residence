import { NextResponse } from "next/server";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { createClient } from "@/lib/supabase/server";

export async function GET(request, { params }) {
  const { id: reservationId } = params;
  const supabase = createClient();

  // RLS s'applique ici : le client ne peut récupérer que ses propres réservations
  const { data: reservation, error } = await supabase
    .from("reservations")
    .select(
      `
      id,
      date_arrivee,
      date_depart,
      montant,
      paye,
      paye_at,
      reference_paiement,
      methode_paiement,
      statut,
      residences ( titre, adresse )
    `
    )
    .eq("id", reservationId)
    .single();

  if (error || !reservation) {
    return NextResponse.json(
      { error: "Réservation introuvable." },
      { status: 404 }
    );
  }

  if (!reservation.paye) {
    return NextResponse.json(
      { error: "Cette réservation n'est pas encore payée." },
      { status: 400 }
    );
  }

  // --- Couleurs de la charte HomTesti ---
  const bleuFonce = rgb(0.118, 0.227, 0.541); // #1e3a8a
  const jauneAccent = rgb(0.984, 0.749, 0.141); // #fbbf24
  const grisTexte = rgb(0.38, 0.4, 0.44);
  const grisClair = rgb(0.96, 0.97, 0.98);
  const noir = rgb(0.1, 0.11, 0.13);
  const blanc = rgb(1, 1, 1);
  const bordure = rgb(0.9, 0.91, 0.93);

  // --- Génération du PDF ---
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4
  const police = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const policeGrasse = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const largeurPage = 595;
  const margeX = 50;
  const largeurContenu = largeurPage - margeX * 2;

  // --- Bandeau d'en-tête ---
  const hauteurBandeau = 110;
  page.drawRectangle({
    x: 0,
    y: 842 - hauteurBandeau,
    width: largeurPage,
    height: hauteurBandeau,
    color: bleuFonce,
  });

  page.drawText("Hom", {
    x: margeX,
    y: 842 - 52,
    size: 26,
    font: policeGrasse,
    color: blanc,
  });
  const largeurHom = policeGrasse.widthOfTextAtSize("Hom", 26);
  page.drawText("Testi", {
    x: margeX + largeurHom,
    y: 842 - 52,
    size: 26,
    font: policeGrasse,
    color: jauneAccent,
  });

  page.drawText("REÇU DE PAIEMENT", {
    x: margeX,
    y: 842 - 78,
    size: 11,
    font: policeGrasse,
    color: rgb(0.85, 0.88, 0.97),
  });

  // Numéro de reçu aligné à droite du bandeau
  const numeroRecu = `N° ${reservation.id.slice(0, 8).toUpperCase()}`;
  const largeurNumero = police.widthOfTextAtSize(numeroRecu, 10);
  page.drawText(numeroRecu, {
    x: largeurPage - margeX - largeurNumero,
    y: 842 - 78,
    size: 10,
    font: police,
    color: rgb(0.85, 0.88, 0.97),
  });

  let y = 842 - hauteurBandeau - 45;

  const formaterMontant = (valeur) =>
    `${Number(valeur || 0).toLocaleString("fr-FR")} FCFA`;

  const formaterDate = (valeur) =>
    valeur
      ? new Date(valeur).toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })
      : "—";

  // --- Bloc d'informations avec fond gris clair et lignes zébrées ---
  function dessinerBloc(titre, lignes) {
    page.drawText(titre.toUpperCase(), {
      x: margeX,
      y,
      size: 10,
      font: policeGrasse,
      color: bleuFonce,
    });
    y -= 18;

    const hauteurLigne = 26;
    const hauteurBloc = lignes.length * hauteurLigne;

    page.drawRectangle({
      x: margeX,
      y: y - hauteurBloc + hauteurLigne - 8,
      width: largeurContenu,
      height: hauteurBloc,
      color: grisClair,
      borderColor: bordure,
      borderWidth: 1,
    });

    lignes.forEach(([label, valeur], index) => {
      const yLigne = y - index * hauteurLigne;
      page.drawText(label, {
        x: margeX + 16,
        y: yLigne - 10,
        size: 10.5,
        font: police,
        color: grisTexte,
      });
      const texteValeur = String(valeur);
      const largeurValeur = policeGrasse.widthOfTextAtSize(texteValeur, 10.5);
      page.drawText(texteValeur, {
        x: margeX + largeurContenu - 16 - largeurValeur,
        y: yLigne - 10,
        size: 10.5,
        font: policeGrasse,
        color: noir,
      });

      if (index < lignes.length - 1) {
        page.drawLine({
          start: { x: margeX + 16, y: yLigne - hauteurLigne + 8 },
          end: { x: margeX + largeurContenu - 16, y: yLigne - hauteurLigne + 8 },
          thickness: 0.5,
          color: bordure,
        });
      }
    });

    y -= hauteurBloc + 30;
  }

  dessinerBloc("Détails du paiement", [
    ["Référence de transaction", reservation.reference_paiement || "—"],
    ["Méthode de paiement", reservation.methode_paiement || "—"],
    ["Date de paiement", formaterDate(reservation.paye_at)],
  ]);

  dessinerBloc("Résidence réservée", [
    ["Résidence", reservation.residences?.titre || "—"],
    ["Adresse", reservation.residences?.adresse || "—"],
    ["Date d'arrivée", formaterDate(reservation.date_arrivee)],
    ["Date de départ", formaterDate(reservation.date_depart)],
  ]);

  // --- Bloc montant total, mis en avant ---
  const hauteurMontant = 60;
  page.drawRectangle({
    x: margeX,
    y: y - hauteurMontant + 30,
    width: largeurContenu,
    height: hauteurMontant,
    color: bleuFonce,
  });
  page.drawText("MONTANT TOTAL PAYÉ", {
    x: margeX + 20,
    y: y + 4,
    size: 10,
    font: policeGrasse,
    color: rgb(0.85, 0.88, 0.97),
  });
  const texteMontant = formaterMontant(reservation.montant);
  const largeurMontant = policeGrasse.widthOfTextAtSize(texteMontant, 20);
  page.drawText(texteMontant, {
    x: margeX + largeurContenu - 20 - largeurMontant,
    y: y - 2,
    size: 20,
    font: policeGrasse,
    color: jauneAccent,
  });

  // --- Pied de page ---
  page.drawLine({
    start: { x: margeX, y: 70 },
    end: { x: largeurPage - margeX, y: 70 },
    thickness: 0.5,
    color: bordure,
  });
  page.drawText("Ce document fait office de reçu de paiement.", {
    x: margeX,
    y: 52,
    size: 9,
    font: police,
    color: grisTexte,
  });
  page.drawText("HomTesti — Abidjan, Côte d'Ivoire", {
    x: margeX,
    y: 38,
    size: 9,
    font: police,
    color: grisTexte,
  });

  const pdfBytes = await pdfDoc.save();

  return new NextResponse(pdfBytes, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="recu-reservation-${reservationId}.pdf"`,
    },
  });
}