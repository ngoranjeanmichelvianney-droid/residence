"use client";

import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import ChatServiceClient from "./ChatServiceClient";

export default function BoutonServiceClient({ clientId }) {
  const [ouvert, setOuvert] = useState(false);

  if (!clientId) return null;

  return (
    <>
      {ouvert && (
        <ChatServiceClient
          clientId={clientId}
          onFermer={() => setOuvert(false)}
        />
      )}

      {!ouvert && (
        <button
          onClick={() => setOuvert(true)}
          className="fixed bottom-4 right-4 bg-bleu-600 hover:bg-bleu-700 text-white rounded-full shadow-lg px-5 py-3 flex items-center gap-2 font-semibold z-50 transition"
        >
          <MessageCircle size={20} />
          Contacter le service client
        </button>
      )}
    </>
  );
}