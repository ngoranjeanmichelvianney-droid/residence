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

  // --- Génération du PDF ---
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4
  const policeNormale = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const policeGrasse = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const bleu = rgb(0.15, 0.35, 0.75);
  const gris = rgb(0.35, 0.35, 0.35);
  const noir = rgb(0.1, 0.1, 0.1);

  let y = 780;

  page.drawText("Reçu de paiement", {
    x: 50,
    y,
    size: 24,
    font: policeGrasse,
    color: bleu,
  });

  y -= 40;
  page.drawLine({
    start: { x: 50, y },
    end: { x: 545, y },
    thickness: 1,
    color: rgb(0.85, 0.85, 0.85),
  });

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

  const ligne = (label, valeur, taille = 12) => {
    y -= 28;
    page.drawText(label, { x: 50, y, size: taille, font: policeNormale, color: gris });
    page.drawText(String(valeur), {
      x: 250,
      y,
      size: taille,
      font: policeGrasse,
      color: noir,
    });
  };

  y -= 20;
  ligne("Référence de transaction", reservation.reference_paiement || "—");
  ligne("Méthode de paiement", reservation.methode_paiement || "—");
  ligne("Date de paiement", formaterDate(reservation.paye_at));

  y -= 20;
  page.drawLine({
    start: { x: 50, y },
    end: { x: 545, y },
    thickness: 1,
    color: rgb(0.85, 0.85, 0.85),
  });

  ligne("Résidence", reservation.residences?.titre || "—");
  ligne("Adresse", reservation.residences?.adresse || "—");
  ligne("Date d'arrivée", formaterDate(reservation.date_arrivee));
  ligne("Date de départ", formaterDate(reservation.date_depart));

  y -= 20;
  page.drawLine({
    start: { x: 50, y },
    end: { x: 545, y },
    thickness: 1,
    color: rgb(0.85, 0.85, 0.85),
  });

  y -= 40;
  page.drawText("Montant payé", {
    x: 50,
    y,
    size: 16,
    font: policeGrasse,
    color: noir,
  });
  page.drawText(formaterMontant(reservation.montant), {
    x: 250,
    y,
    size: 16,
    font: policeGrasse,
    color: bleu,
  });

  page.drawText("Ce document fait office de reçu de paiement.", {
    x: 50,
    y: 60,
    size: 9,
    font: policeNormale,
    color: gris,
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