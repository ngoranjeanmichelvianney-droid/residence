"use client";

import { usePathname } from "next/navigation";
import BoutonServiceClient from "./BoutonServiceClient";

export default function ServiceClientGate({ clientId }) {
  const pathname = usePathname();

  // Le bouton "Contacter le service client" n'a pas sa place
  // dans les pages d'administration.
  if (pathname?.startsWith("/admin")) return null;

  return <BoutonServiceClient clientId={clientId} />;
}