"use client";

import { useRouter } from "next/navigation";

export default function ListeConversationsSupport({ conversations }) {
  const router = useRouter();

  function ouvrirConversation(id) {
    router.push(`/admin/support/${id}`);
  }

  if (conversations.length === 0) {
    return (
      <p className="text-sm text-anthracite-400 p-4">Aucune conversation.</p>
    );
  }

  return (
    <div className="border border-anthracite-100 rounded-lg overflow-hidden divide-y divide-anthracite-100">
      {conversations.map((conv) => {
        const nomAffiche = conv.clients?.nom || conv.clients?.email || "Client";
        const initiales = nomAffiche
          .split(" ")
          .map((mot) => mot[0])
          .slice(0, 2)
          .join("")
          .toUpperCase();

        const heureDernierMessage = conv.dernierMessage
          ? new Date(conv.dernierMessage.created_at).toLocaleTimeString("fr-FR", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : null;

        const apercu = conv.dernierMessage
          ? `${conv.dernierMessage.expediteur === "client" ? "" : "Vous : "}${conv.dernierMessage.contenu}`
          : "Aucun message";

        return (
          <button
            key={conv.id}
            onClick={() => ouvrirConversation(conv.id)}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-anthracite-50 transition bg-white text-left"
          >
            <div className="w-10 h-10 rounded-full bg-bleu-600 text-white flex items-center justify-center text-xs font-semibold shrink-0">
              {initiales || "?"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className={`text-sm truncate ${conv.nonLus > 0 ? "font-bold text-anthracite-900" : "font-medium text-anthracite-800"}`}>
                  {nomAffiche}
                </p>
                {heureDernierMessage && (
                  <span className="text-xs text-anthracite-400 shrink-0">
                    {heureDernierMessage}
                  </span>
                )}
              </div>
              <p className={`text-xs truncate ${conv.nonLus > 0 ? "text-anthracite-700 font-medium" : "text-anthracite-500"}`}>
                {apercu}
              </p>
            </div>
            {conv.nonLus > 0 && (
              <span className="bg-bleu-600 text-white text-xs font-semibold rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center shrink-0">
                {conv.nonLus}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}