import { createClient } from "@/lib/supabase/server";
import FenetreConversation from "@/components/FenetreConversation";
import { notFound } from "next/navigation";

export default async function ConversationProprietairePage({ params }) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: conversation } = await supabase
    .from("conversations")
    .select("*, residences(titre), clients(nom), proprietaires(auth_id)")
    .eq("id", params.id)
    .single();

  if (!conversation || conversation.proprietaires?.auth_id !== user.id) {
    notFound();
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <FenetreConversation
        conversationId={conversation.id}
        monType="proprietaire"
        titreResidence={conversation.residences?.titre}
        nomAutrePartie={conversation.clients?.nom}
      />
    </div>
  );
}