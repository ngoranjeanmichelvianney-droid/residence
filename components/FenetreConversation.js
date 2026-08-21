"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

export default function FenetreConversation({ conversationId, monType, titreResidence, nomAutrePartie }) {
  const [messages, setMessages] = useState([]);
  const [texte, setTexte] = useState("");
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(false);
  const finDesMessagesRef = useRef(null);

  useEffect(() => {
    const supabase = createClient();

    async function chargerMessages() {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });
      setMessages(data || []);
    }

    chargerMessages();

    // Abonnement temps réel : nouveaux messages affichés instantanément
    const canal = supabase
      .channel(`conversation-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((precedents) => [...precedents, payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [conversationId]);

  useEffect(() => {
    finDesMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function envoyerMessage(e) {
    e.preventDefault();
    if (!texte.trim()) return;

    setErreur("");
    setChargement(true);

    const reponse = await fetch("/api/messages/envoyer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId, contenu: texte }),
    });

    const donnees = await reponse.json();
    setChargement(false);

    if (!reponse.ok) {
      setErreur(donnees.error || "Erreur lors de l'envoi.");
      return;
    }

    setTexte("");
    // Le message envoyé par SOI-MÊME n'arrive pas toujours via le canal temps réel
    // (selon la config Supabase), donc on l'ajoute aussi manuellement ici.
    setMessages((precedents) => [...precedents, donnees.message]);
  }

  return (
    <div className="bg-white border border-anthracite-100 rounded-lg flex flex-col h-[70vh]">
      <div className="border-b border-anthracite-100 p-4">
        <p className="font-semibold text-anthracite-800">{titreResidence}</p>
        <p className="text-xs text-anthracite-400">Conversation avec {nomAutrePartie}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-sm text-anthracite-400 text-center mt-8">
            Aucun message pour l&apos;instant. Dites bonjour !
          </p>
        )}

        {messages.map((m) => {
          const estMoi = m.expediteur_type === monType;
          return (
            <div key={m.id} className={`flex ${estMoi ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                  estMoi
                    ? "bg-bleu-600 text-white"
                    : "bg-anthracite-100 text-anthracite-800"
                }`}
              >
                {m.contenu}
              </div>
            </div>
          );
        })}
        <div ref={finDesMessagesRef} />
      </div>

      <div className="border-t border-anthracite-100 p-3">
        {erreur && (
          <p className="text-rouge-500 text-xs mb-2 bg-rouge-50 rounded-md p-2">{erreur}</p>
        )}
        <p className="text-xs text-anthracite-400 mb-2">
          Le partage de numéro de téléphone n&apos;est pas autorisé.
        </p>
        <form onSubmit={envoyerMessage} className="flex gap-2">
          <input
            type="text"
            value={texte}
            onChange={(e) => setTexte(e.target.value)}
            placeholder="Écrivez votre message..."
            className="flex-1 border border-anthracite-100 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bleu-500"
          />
          <button
            type="submit"
            disabled={chargement}
            className="bg-rouge-500 hover:bg-rouge-600 text-white font-semibold px-4 py-2 rounded-md transition disabled:opacity-50"
          >
            Envoyer
          </button>
        </form>
      </div>
    </div>
  );
}