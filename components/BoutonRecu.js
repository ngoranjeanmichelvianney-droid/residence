"use client";

import { Download } from "lucide-react";

export default function BoutonRecu({ reservationId, paye }) {
  if (!paye) return null;

  return (
    <a
      href={`/api/reservations/${reservationId}/recu`}
      className="inline-flex items-center gap-2 border border-bleu-600 text-bleu-600 hover:bg-bleu-50 font-medium text-sm px-4 py-2 rounded-md transition"
    >
      <Download size={16} />
      Télécharger mon reçu (PDF)
    </a>
  );
}