import { createClient } from "@/lib/supabase/server";
import ConversationSupportDetail from "@/components/ConversationSupportDetail";

export const dynamic = "force-dynamic";

export default async function PageConversationSupport({ params }) {
  const { id } = params;
  const supabase = createClient();

  const { data: conversation } = await supabase
    .from("conversations_support")
    .select("*")
    .eq("id", id)
    .single();

  let client = null;
  if (conversation) {
    const { data } = await supabase
      .from("clients")
      .select("auth_id, nom, email")
      .eq("auth_id", conversation.client_id)
      .maybeSingle();
    client = data;
  }

  return (
    <div className="p-6">
      <ConversationSupportDetail conversationId={id} client={client} />
    </div>
  );
}