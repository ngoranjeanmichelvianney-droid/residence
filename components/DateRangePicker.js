"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

const MOIS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];
const JOURS = ["L", "M", "M", "J", "V", "S", "D"];

function formatISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatAffichage(iso) {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return `${d.getDate()} ${MOIS[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;
}

export default function DateRangePicker({ dateArrivee, dateDepart, onChange }) {
  const [ouvert, setOuvert] = useState(false);
  const [moisAffiche, setMoisAffiche] = useState(new Date());

  const aujourdHui = new Date();
  aujourdHui.setHours(0, 0, 0, 0);

  function joursDuMois(date) {
    const annee = date.getFullYear();
    const mois = date.getMonth();
    const premierJour = new Date(annee, mois, 1);
    const dernierJour = new Date(annee, mois + 1, 0);

    // Lundi = 0 ... Dimanche = 6
    const decalage = (premierJour.getDay() + 6) % 7;

    const jours = [];
    for (let i = 0; i < decalage; i++) jours.push(null);
    for (let j = 1; j <= dernierJour.getDate(); j++) {
      jours.push(new Date(annee, mois, j));
    }
    return jours;
  }

  function estPasse(date) {
    return date < aujourdHui;
  }

  function estSelectionne(date) {
    const iso = formatISO(date);
    return iso === dateArrivee || iso === dateDepart;
  }

  function estDansPlage(date) {
    if (!dateArrivee || !dateDepart) return false;
    const iso = formatISO(date);
    return iso > dateArrivee && iso < dateDepart;
  }

  function handleClicJour(date) {
    if (estPasse(date)) return;
    const iso = formatISO(date);

    if (!dateArrivee || (dateArrivee && dateDepart)) {
      // Nouvelle sélection
      onChange({ arrivee: iso, depart: "" });
    } else if (iso <= dateArrivee) {
      // Clic avant ou sur la date d'arrivée -> redémarre la sélection
      onChange({ arrivee: iso, depart: "" });
    } else {
      onChange({ arrivee: dateArrivee, depart: iso });
      setOuvert(false);
    }
  }

  function changerMois(delta) {
    setMoisAffiche(
      new Date(moisAffiche.getFullYear(), moisAffiche.getMonth() + delta, 1)
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOuvert(!ouvert)}
        className="w-full flex items-center justify-between border border-anthracite-100 rounded-md px-3 py-2.5 text-sm hover:border-bleu-500 transition"
      >
        <div className="flex items-center gap-2 text-anthracite-700">
          <Calendar size={16} className="text-bleu-600 flex-shrink-0" />
          <span className={dateArrivee ? "" : "text-anthracite-400"}>
            {dateArrivee ? formatAffichage(dateArrivee) : "Arrivée"}
          </span>
          <span className="text-anthracite-300">→</span>
          <span className={dateDepart ? "" : "text-anthracite-400"}>
            {dateDepart ? formatAffichage(dateDepart) : "Départ"}
          </span>
        </div>
      </button>

      {ouvert && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOuvert(false)}
          />
          <div className="absolute z-50 mt-2 bg-white border border-anthracite-100 rounded-xl shadow-xl p-4 w-full sm:w-80">
            <div className="flex items-center justify-between mb-3">
              <button
                type="button"
                onClick={() => changerMois(-1)}
                className="p-1.5 rounded-md hover:bg-bleu-50 text-anthracite-600"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="font-semibold text-anthracite-800 text-sm">
                {MOIS[moisAffiche.getMonth()]} {moisAffiche.getFullYear()}
              </span>
              <button
                type="button"
                onClick={() => changerMois(1)}
                className="p-1.5 rounded-md hover:bg-bleu-50 text-anthracite-600"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-1">
              {JOURS.map((j, i) => (
                <div
                  key={i}
                  className="text-center text-xs font-medium text-anthracite-400 py-1"
                >
                  {j}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {joursDuMois(moisAffiche).map((date, i) => {
                if (!date) return <div key={i} />;

                const passe = estPasse(date);
                const selectionne = estSelectionne(date);
                const dansPlage = estDansPlage(date);

                return (
                  <button
                    key={i}
                    type="button"
                    disabled={passe}
                    onClick={() => handleClicJour(date)}
                    className={`aspect-square text-sm rounded-md transition flex items-center justify-center
                      ${passe ? "text-anthracite-200 cursor-not-allowed" : "text-anthracite-700 hover:bg-bleu-50"}
                      ${selectionne ? "bg-bleu-600 text-white font-semibold hover:bg-bleu-600" : ""}
                      ${dansPlage ? "bg-bleu-50 text-bleu-700" : ""}
                    `}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>

            <p className="text-xs text-anthracite-400 mt-3 text-center">
              {!dateArrivee
                ? "Choisissez la date d'arrivée"
                : !dateDepart
                ? "Choisissez la date de départ"
                : "Cliquez pour recommencer"}
            </p>
          </div>
        </>
      )}
    </div>
  );
}