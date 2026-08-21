import { createClient } from "@/lib/supabase/server";
import Header from "@/components/Header";
import FenetreConversation from "@/components/FenetreConversation";
import { notFound } from "next/navigation";

export default async function ConversationClientPage({ params }) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: conversation } = await supabase
    .from("conversations")
    .select("*, residences(titre), proprietaires(nom), clients(auth_id)")
    .eq("id", params.id)
    .single();

  if (!conversation || conversation.clients?.auth_id !== user.id) {
    notFound();
  }

  return (
    <>
      <Header />
      <div className="max-w-3xl mx-auto px-4 py-10">
        <FenetreConversation
          conversationId={conversation.id}
          monType="client"
          titreResidence={conversation.residences?.titre}
          nomAutrePartie={conversation.proprietaires?.nom}
        />
      </div>
    </>
  );
}