"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Send, Bot, ArrowLeft } from "lucide-react";

const ETIQUETTES_EXPEDITEUR = {
  client: { label: null, style: "bg-white border border-anthracite-100 text-anthracite-800" },
  ia: {
    label: "Réponse auto",
    icone: Bot,
    style: "bg-white border border-anthracite-100 text-anthracite-800",
  },
  admin: { label: null, style: "bg-bleu-600 text-white" },
};

export default function ConversationSupportDetail({ conversationId, client }) {
  const supabase = createClient();
  const router = useRouter();

  const [messages, setMessages] = useState([]);
  const [texte, setTexte] = useState("");
  const [chargement, setChargement] = useState(true);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [erreur, setErreur] = useState("");
  const finDesMessages = useRef(null);

  const nomClient = client?.nom || client?.email || "Client";
  const initiales = nomClient
    .split(" ")
    .map((mot) => mot[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  function retourALaListe() {
    // Force Next.js à recharger les données de la page de liste
    // (sinon le compteur de non-lus resterait affiché avec l'ancienne valeur)
    router.push("/admin/support");
    router.refresh();
  }

  useEffect(() => {
    async function chargerMessages() {
      setChargement(true);
      const { data } = await supabase
        .from("messages_support")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      setMessages(data || []);
      setChargement(false);

      // Marque les messages du client comme lus dès que l'admin ouvre la conversation
      await supabase
        .from("messages_support")
        .update({ lu: true })
        .eq("conversation_id", conversationId)
        .eq("expediteur", "client")
        .eq("lu", false);
    }

    chargerMessages();

    const canal = supabase
      .channel(`admin_conversation_${conversationId}`)
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

          // Si un nouveau message client arrive pendant que la conversation
          // est déjà ouverte, on le marque lu immédiatement aussi
          if (payload.new.expediteur === "client") {
            supabase
              .from("messages_support")
              .update({ lu: true })
              .eq("id", payload.new.id)
              .then(() => {});
          }
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
  }, [conversationId]);

  useEffect(() => {
    finDesMessages.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function envoyerReponseAdmin(e) {
    e.preventDefault();
    if (!texte.trim()) return;

    setEnvoiEnCours(true);
    setErreur("");

    const { data: nouveauMessage, error } = await supabase
      .from("messages_support")
      .insert({
        conversation_id: conversationId,
        expediteur: "admin",
        contenu: texte.trim(),
      })
      .select()
      .single();

    if (error) {
      setErreur(`Le message n'a pas pu être envoyé : ${error.message}`);
    } else {
      setTexte("");
      setMessages((precedent) => {
        if (precedent.some((m) => m.id === nouveauMessage.id)) return precedent;
        return [...precedent, nouveauMessage];
      });
    }

    setEnvoiEnCours(false);
  }

  return (
    <div className="flex flex-col border border-anthracite-100 rounded-lg overflow-hidden h-[600px]">
      {/* En-tête profil */}
      <div className="flex items-center gap-3 border-b border-anthracite-100 px-4 py-3 bg-white">
        <button
          onClick={retourALaListe}
          aria-label="Retour à la liste"
          className="text-anthracite-500 hover:text-anthracite-800"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="w-9 h-9 rounded-full bg-bleu-600 text-white flex items-center justify-center text-xs font-semibold shrink-0">
          {initiales || "?"}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-anthracite-800 text-sm truncate">
            {nomClient}
          </p>
          {client?.email && (
            <p className="text-xs text-anthracite-400 truncate">{client.email}</p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 bg-anthracite-50/30">
        {chargement && (
          <p className="text-sm text-anthracite-400 text-center mt-8">
            Chargement...
          </p>
        )}

        {messages.map((message, i) => {
          const infos = ETIQUETTES_EXPEDITEUR[message.expediteur] || ETIQUETTES_EXPEDITEUR.admin;
          const estClient = message.expediteur === "client";
          const estDernierMessageAdmin =
            !estClient && i === messages.length - 1 && message.expediteur === "admin";

          return (
            <div key={message.id} className={`flex flex-col ${estClient ? "items-start" : "items-end"}`}>
              <div className={`max-w-[70%] rounded-lg px-3 py-2 text-sm ${infos.style}`}>
                {infos.label && (
                  <div className="flex items-center gap-1 text-xs opacity-70 mb-1">
                    {infos.icone && <infos.icone size={12} />}
                    {infos.label}
                  </div>
                )}
                {message.contenu}
              </div>
              {estDernierMessageAdmin && (
                <span className="text-xs text-anthracite-400 mt-0.5 mr-1">
                  {message.lu ? "Vu" : "Envoyé"}
                </span>
              )}
            </div>
          );
        })}
        <div ref={finDesMessages} />
      </div>

      {erreur && <p className="text-rouge-500 text-xs px-4 pt-1">{erreur}</p>}

      {/* Saisie */}
      <form
        onSubmit={envoyerReponseAdmin}
        className="flex items-center gap-2 border-t border-anthracite-100 p-3"
      >
        <input
          type="text"
          value={texte}
          onChange={(e) => setTexte(e.target.value)}
          placeholder="Répondre..."
          className="flex-1 border border-anthracite-100 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bleu-500"
        />
        <button
          type="submit"
          disabled={envoiEnCours || !texte.trim()}
          className="bg-bleu-600 hover:bg-bleu-700 text-white p-2 rounded-md transition disabled:opacity-50"
          aria-label="Envoyer"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}