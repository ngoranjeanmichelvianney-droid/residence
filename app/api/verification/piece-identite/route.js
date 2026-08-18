import { NextResponse } from "next/server";
import { createWorker } from "tesseract.js";

// Mots-clés / motifs typiques d'une pièce d'identité ivoirienne.
// À ajuster/compléter selon les vrais documents que vous recevez
// (CNI, passeport, attestation d'identité...).
const MOTIFS_CNI = [
  /R[ÉE]PUBLIQUE.{0,20}C[ÔO]TE.{0,5}D.{0,3}IVOIRE/i,
  /CARTE NATIONALE D.{0,2}IDENTIT[ÉE]/i,
  /NATIONAL IDENTITY CARD/i,
  /PASSEPORT/i,
];

// Un numéro de document ressemble en général à une suite de chiffres/lettres
// assez longue (CNI ivoirienne : ex. CI0012345678 ou similaire selon le format réel).
const MOTIF_NUMERO = /[A-Z]{0,3}\d{6,}/;

export async function POST(request) {
  try {
    const body = await request.json();
    const { imageUrl } = body;

    if (!imageUrl) {
      return NextResponse.json({ message: "imageUrl requis" }, { status: 400 });
    }

    const worker = await createWorker("fra");
    const {
      data: { text },
    } = await worker.recognize(imageUrl);
    await worker.terminate();

    const texteNettoye = text.replace(/\s+/g, " ").trim();

    const contientMotifCNI = MOTIFS_CNI.some((regex) => regex.test(texteNettoye));
    const contientNumero = MOTIF_NUMERO.test(texteNettoye);

    const valide = contientMotifCNI || contientNumero;

    return NextResponse.json({
      valide,
      texteDetecte: texteNettoye.slice(0, 500), // utile pour debug/admin
    });
  } catch (err) {
    console.error("Erreur OCR pièce d'identité :", err);
    // En cas d'échec technique de l'OCR, on ne bloque pas l'inscription :
    // le document part quand même en validation manuelle par l'admin.
    return NextResponse.json({
      valide: true,
      texteDetecte: "",
      avertissement: "Vérification automatique indisponible, validation manuelle requise.",
    });
  }
}