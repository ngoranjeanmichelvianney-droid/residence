"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResidenceValidationActions({ id }) {
  const router = useRouter();
  const supabase = createClient();

  async function changerStatut(statut) {
    await supabase.from("residences").update({ statut }).eq("id", id);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2 justify-center">
      <button
        onClick={() => changerStatut("publie")}
        className="bg-bleu-600 hover:bg-bleu-700 text-white text-sm font-medium px-3 py-1.5 rounded-md transition"
      >
        Publier
      </button>
      <button
        onClick={() => changerStatut("refuse")}
        className="bg-rouge-500 hover:bg-rouge-600 text-white text-sm font-medium px-3 py-1.5 rounded-md transition"
      >
        Refuser
      </button>
    </div>
  );
}