"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { X, Send, MessageCircle, Headset, ArrowLeft } from "lucide-react";
import { questionsFrequentes } from "@/lib/faqService";

export default function ChatServiceClient({ clientId, onFermer }) {
  const supabase = createClient();

  const [mode, setMode] = useState("menu");

  const [historiqueSimule, setHistoriqueSimule] = useState([]);
  const finDuMenu = useRef(null);

  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [texte, setTexte] = useState("");
  const [chargement, setChargement] = useState(false);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [erreur, setErreur] = useState("");
  const finDesMessages = useRef(null);

  useEffect(() => {
    finDuMenu.current?.scrollIntoView({ behavior: "smooth" });
  }, [historiqueSimule]);

  function choisirQuestion(item) {
    setHistoriqueSimule((precedent) => [
      ...precedent,
      { type: "question", texte: item.question },
      { type: "reponse", texte: item.reponse },
    ]);
  }

  async function demarrerConseiller() {
    setMode("conseiller");
    setChargement(true);
    setErreur("");

    const { data: existante, error: erreurRecherche } = await supabase
      .from("conversations_support")
      .select("id")
      .eq("client_id", clientId)
      .eq("statut", "ouverte")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (erreurRecherche) {
      setErreur("Impossible de charger la conversation.");
      setChargement(false);
      return;
    }

    let idConversation = existante?.id;

    if (!idConversation) {
      const { data: nouvelle, error: erreurCreation } = await supabase
        .from("conversations_support")
        .insert({ client_id: clientId })
        .select("id")
        .single();

      if (erreurCreation) {
        setErreur("Impossible de démarrer une conversation.");
        setChargement(false);
        return;
      }
      idConversation = nouvelle.id;
    }

    setConversationId(idConversation);
    setChargement(false);
  }

  useEffect(() => {
    if (mode !== "conseiller" || !conversationId) return;

    async function chargerMessages() {
      const { data } = await supabase
        .from("messages_support")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      setMessages(data || []);

      // Marque les messages de l'admin/IA comme lus dès que le client ouvre le chat
      await supabase
        .from("messages_support")
        .update({ lu: true })
        .eq("conversation_id", conversationId)
        .in("expediteur", ["admin", "ia"])
        .eq("lu", false);
    }

    chargerMessages();

    const canal = supabase
      .channel(`messages_support_${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages_support",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((precedent) => {
            if (precedent.some((m) => m.id === payload.new.id)) return precedent;
            return [...precedent, payload.new];
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages_support",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((precedent) =>
            precedent.map((m) => (m.id === payload.new.id ? payload.new : m))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [mode, conversationId]);

  useEffect(() => {
    finDesMessages.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function envoyerMessage(e) {
    e.preventDefault();
    if (!texte.trim() || !conversationId) return;

    setEnvoiEnCours(true);
    setErreur("");

    const { data: nouveauMessage, error } = await supabase
      .from("messages_support")
      .insert({
        conversation_id: conversationId,
        expediteur: "client",
        contenu: texte.trim(),
      })
      .select()
      .single();

    if (error) {
      setErreur("Le message n'a pas pu être envoyé.");
    } else {
      setTexte("");
      // Affiche le message immédiatement, sans attendre le temps réel
      // (évite de dépendre uniquement de Realtime, qui peut avoir un délai
      // ou ne pas être activé sur la table)
      setMessages((precedent) => {
        if (precedent.some((m) => m.id === nouveauMessage.id)) return precedent;
        return [...precedent, nouveauMessage];
      });
    }

    setEnvoiEnCours(false);
  }

  return (
    <div className="fixed bottom-4 right-4 w-full max-w-sm bg-white border border-anthracite-100 rounded-lg shadow-xl flex flex-col h-[520px] z-50">
      <div className="flex items-center justify-between bg-bleu-600 text-white px-4 py-3 rounded-t-lg">
        <div className="flex items-center gap-2">
          {mode === "conseiller" && (
            <button
              onClick={() => setMode("menu")}
              aria-label="Retour au menu"
              className="hover:bg-bleu-700 rounded p-0.5"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <MessageCircle size={20} />
          <span className="font-semibold">
            {mode === "menu" ? "Service client" : "Conseiller en ligne"}
          </span>
        </div>
        <button onClick={onFermer} aria-label="Fermer le chat">
          <X size={20} />
        </button>
      </div>

      {mode === "menu" && (
        <>
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 bg-anthracite-50/30">
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-lg px-3 py-2 text-sm bg-white border border-anthracite-100 text-anthracite-800">
                Bonjour ! Choisissez une question ci-dessous, ou parlez
                directement à un conseiller.
              </div>
            </div>

            {historiqueSimule.map((item, index) => (
              <div
                key={index}
                className={`flex ${
                  item.type === "question" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                    item.type === "question"
                      ? "bg-bleu-600 text-white"
                      : "bg-white border border-anthracite-100 text-anthracite-800"
                  }`}
                >
                  {item.texte}
                </div>
              </div>
            ))}

            <div ref={finDuMenu} />
          </div>

          <div className="border-t border-anthracite-100 p-3 space-y-2 max-h-48 overflow-y-auto">
            {questionsFrequentes.map((item) => (
              <button
                key={item.id}
                onClick={() => choisirQuestion(item)}
                className="w-full text-left text-sm border border-bleu-100 text-bleu-700 hover:bg-bleu-50 rounded-md px-3 py-2 transition"
              >
                {item.question}
              </button>
            ))}

            <button
              onClick={demarrerConseiller}
              className="w-full flex items-center justify-center gap-2 bg-anthracite-800 hover:bg-anthracite-900 text-white font-semibold text-sm rounded-md px-3 py-2 transition"
            >
              <Headset size={16} />
              Être assisté par un conseiller
            </button>
          </div>
        </>
      )}

      {mode === "conseiller" && (
        <>
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 bg-anthracite-50/30">
            {chargement && (
              <p className="text-sm text-anthracite-400 text-center mt-4">
                Connexion avec un conseiller...
              </p>
            )}

            {!chargement && messages.length === 0 && (
              <p className="text-sm text-anthracite-400 text-center mt-4">
                Posez votre question, un membre de notre équipe vous répondra.
              </p>
            )}

            {messages.map((message, i) => {
              const estDernierMessageClient =
                message.expediteur === "client" && i === messages.length - 1;

              return (
                <div
                  key={message.id}
                  className={`flex flex-col ${
                    message.expediteur === "client" ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                      message.expediteur === "client"
                        ? "bg-bleu-600 text-white"
                        : "bg-white border border-anthracite-100 text-anthracite-800"
                    }`}
                  >
                    {message.contenu}
                  </div>
                  {estDernierMessageClient && (
                    <span className="text-xs text-anthracite-400 mt-0.5 mr-1">
                      {message.lu ? "Vu" : "Envoyé"}
                    </span>
                  )}
                </div>
              );
            })}
            <div ref={finDesMessages} />
          </div>

          {erreur && (
            <p className="text-rouge-500 text-xs px-4 pb-1">{erreur}</p>
          )}

          <form
            onSubmit={envoyerMessage}
            className="flex items-center gap-2 border-t border-anthracite-100 p-3"
          >
            <input
              type="text"
              value={texte}
              onChange={(e) => setTexte(e.target.value)}
              placeholder="Écrivez votre message..."
              className="flex-1 border border-anthracite-100 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bleu-500"
              disabled={chargement || envoiEnCours}
            />
            <button
              type="submit"
              disabled={chargement || envoiEnCours || !texte.trim()}
              className="bg-bleu-600 hover:bg-bleu-700 text-white p-2 rounded-md transition disabled:opacity-50"
              aria-label="Envoyer"
            >
              <Send size={18} />
            </button>
          </form>
        </>
      )}
    </div>
  );
}