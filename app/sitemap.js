import { createClient } from "@/lib/supabase/server";

export default async function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://homtesti.com";
  const supabase = createClient();

  const { data: residences } = await supabase
    .from("residences")
    .select("id, updated_at")
    .eq("statut", "publie");

  const pagesResidences = (residences || []).map((r) => ({
    url: `${baseUrl}/residences/${r.id}`,
    lastModified: r.updated_at ? new Date(r.updated_at) : new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const pagesStatiques = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/residences`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];

  return [...pagesStatiques, ...pagesResidences];
}