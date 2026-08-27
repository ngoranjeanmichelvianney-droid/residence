"use client";

import { useState } from "react";
import { Headset, XCircle, Star } from "lucide-react";
import ListeConversationsSupport from "./ListeConversationsSupport";
import ListeDemandesAnnulation from "./ListeDemandesAnnulation";
import AdminAvisListe from "./AdminAvisListe";

const ONGLETS = [
  { id: "support", label: "Support client", icone: Headset },
  { id: "annulations", label: "Demandes d'annulation", icone: XCircle },
  { id: "avis", label: "Avis clients", icone: Star },
];

export default function AdminDashboard({ conversations, demandesAnnulation, avis }) {
  const [ongletActif, setOngletActif] = useState("support");

  const compteurs = {
    support: conversations.filter((c) => c.nonLus > 0).length,
    annulations: demandesAnnulation.length,
    avis: avis.length,
  };

  return (
    <div>
      <div className="flex gap-2 border-b border-anthracite-100 mb-6">
        {ONGLETS.map((onglet) => {
          const Icone = onglet.icone;
          const actif = ongletActif === onglet.id;
          return (
            <button
              key={onglet.id}
              onClick={() => setOngletActif(onglet.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition ${
                actif
                  ? "border-bleu-600 text-bleu-600"
                  : "border-transparent text-anthracite-500 hover:text-anthracite-700"
              }`}
            >
              <Icone size={16} />
              {onglet.label}
              {compteurs[onglet.id] > 0 && (
                <span
                  className={`text-xs rounded-full px-2 py-0.5 ${
                    actif
                      ? "bg-bleu-100 text-bleu-700"
                      : "bg-anthracite-100 text-anthracite-600"
                  }`}
                >
                  {compteurs[onglet.id]}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {ongletActif === "support" && (
        <ListeConversationsSupport conversations={conversations} />
      )}

      {ongletActif === "annulations" && (
        <ListeDemandesAnnulation demandes={demandesAnnulation} />
      )}

      {ongletActif === "avis" && <AdminAvisListe avis={avis} />}
    </div>
  );
}