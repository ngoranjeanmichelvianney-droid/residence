import { NextResponse } from "next/server";
import { createWorker } from "tesseract.js";
import { createClient } from "@/lib/supabase/server";

const MOTIFS_CNI = [
  /R[ÉE]PUBLIQUE.{0,20}C[ÔO]TE.{0,5}D.{0,3}IVOIRE/i,
  /CARTE NATIONALE D.{0,2}IDENTIT[ÉE]/i,
  /NATIONAL IDENTITY CARD/i,
  /PASSEPORT/i,
];

const MOTIF_NUMERO = /[A-Z]{0,3}\d{6,}/;

export async function POST(request) {
  try {
    const body = await request.json();
    const { imageUrl, proprietaireId } = body;

    if (!imageUrl || !proprietaireId) {
      return NextResponse.json(
        { message: "imageUrl et proprietaireId requis" },
        { status: 400 }
      );
    }

    const supabase = createClient();

    let valide = true;
    let texteDetecte = "";

    try {
      const worker = await createWorker("fra");
      const {
        data: { text },
      } = await worker.recognize(imageUrl);
      await worker.terminate();

      const texteNettoye = text.replace(/\s+/g, " ").trim();
      const contientMotifCNI = MOTIFS_CNI.some((regex) => regex.test(texteNettoye));
      const contientNumero = MOTIF_NUMERO.test(texteNettoye);

      valide = contientMotifCNI || contientNumero;
      texteDetecte = texteNettoye.slice(0, 500);
    } catch (ocrErr) {
      console.error("Erreur OCR pièce d'identité :", ocrErr);
      // Échec technique : on ne bloque pas le propriétaire, l'admin validera
      // manuellement. On laisse une trace claire dans la base.
      valide = true;
      texteDetecte = "Vérification automatique indisponible.";
    }

    // On met à jour la base directement depuis cette route, puisque le
    // formulaire d'inscription n'attend plus cette réponse.
    await supabase
      .from("proprietaires")
      .update({
        piece_identite_ocr_valide: valide,
        piece_identite_ocr_texte: texteDetecte,
      })
      .eq("id", proprietaireId);

    return NextResponse.json({ valide, texteDetecte });
  } catch (err) {
    console.error("Erreur route vérification pièce d'identité :", err);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}