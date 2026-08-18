export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://homtesti.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/proprietaire",
          "/auth",
          "/mes-reservations",
          "/profil",
          "/reserver",
          "/api",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}