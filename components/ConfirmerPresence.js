"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ConfirmerPresence({ reservationId }) {
  const [chargement, setChargement] = useState(false);
  const [confirme, setConfirme] = useState(false);
  const [erreur, setErreur] = useState("");
  const router = useRouter();

  async function confirmerPresence() {
    setChargement(true);
    setErreur("");

    const supabase = createClient();
    const { error } = await supabase
      .from("reservations")
      .update({ presence_confirmee_at: new Date().toISOString() })
      .eq("id", reservationId);

    setChargement(false);

    if (error) {
      setErreur("Erreur lors de la confirmation : " + error.message);
      return;
    }

    setConfirme(true);
    router.refresh();
  }

  if (confirme) {
    return (
      <span className="text-xs font-semibold text-bleu-600">
        Présence confirmée
      </span>
    );
  }

  return (
    <div>
      <button
        onClick={confirmerPresence}
        disabled={chargement}
        className="bg-bleu-600 hover:bg-bleu-700 text-white text-xs font-semibold px-3 py-1.5 rounded-md transition disabled:opacity-50"
      >
        {chargement ? "..." : "Je suis dans la résidence"}
      </button>
      {erreur && <p className="text-rouge-500 text-xs mt-1">{erreur}</p>}
    </div>
  );
}