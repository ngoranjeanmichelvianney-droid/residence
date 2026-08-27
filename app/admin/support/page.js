import { createClient } from "@/lib/supabase/server";
import AdminDashboard from "@/components/AdminDashboard";

export const dynamic = "force-dynamic";

export default async function PageAdminSupport() {
  const supabase = createClient();

  const [
    { data: conversationsBrutes, error: erreurConversations },
    { data: demandesAnnulation },
    { data: avis },
  ] = await Promise.all([
    supabase
      .from("conversations_support")
      .select("*")
      .order("updated_at", { ascending: false }),
    supabase
      .from("demandes_annulation")
      .select("*")
      .eq("statut", "en_attente")
      .order("created_at", { ascending: false }),
    supabase
      .from("avis")
      .select("*")
      .order("created_at", { ascending: false }),
  ]);

  if (erreurConversations) {
    console.error("Erreur chargement conversations_support:", erreurConversations);
  }

  const listeConversations = conversationsBrutes || [];
  const idsConversations = listeConversations.map((c) => c.id);
  const idsClients = [...new Set(listeConversations.map((c) => c.client_id))];

  // Infos client (jointure manuelle via auth_id, pas de FK directe possible)
  let clientsParId = {};
  if (idsClients.length > 0) {
    const { data: clients, error: erreurClients } = await supabase
      .from("clients")
      .select("auth_id, nom, email")
      .in("auth_id", idsClients);

    if (erreurClients) {
      console.error("Erreur chargement clients:", erreurClients);
    }

    clientsParId = Object.fromEntries(
      (clients || []).map((c) => [c.auth_id, c])
    );
  }

  // Dernier message + nombre de messages non lus par conversation
  let dernierMessageParConversation = {};
  let nonLusParConversation = {};
  if (idsConversations.length > 0) {
    const { data: messagesRecents } = await supabase
      .from("messages_support")
      .select("conversation_id, contenu, expediteur, created_at, lu")
      .in("conversation_id", idsConversations)
      .order("created_at", { ascending: false });

    for (const message of messagesRecents || []) {
      if (!dernierMessageParConversation[message.conversation_id]) {
        dernierMessageParConversation[message.conversation_id] = message;
      }
      if (message.expediteur === "client" && !message.lu) {
        nonLusParConversation[message.conversation_id] =
          (nonLusParConversation[message.conversation_id] || 0) + 1;
      }
    }
  }

  const conversations = listeConversations.map((conv) => ({
    ...conv,
    clients: clientsParId[conv.client_id] || null,
    dernierMessage: dernierMessageParConversation[conv.id] || null,
    nonLus: nonLusParConversation[conv.id] || 0,
  }));

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold text-anthracite-800 mb-4">
        Gestion
      </h1>
      <AdminDashboard
        conversations={conversations}
        demandesAnnulation={demandesAnnulation || []}
        avis={avis || []}
      />
    </div>
  );
}