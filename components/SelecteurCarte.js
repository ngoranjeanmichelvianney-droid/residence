"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Loader2 } from "lucide-react";

// Centre par défaut : Abidjan (Plateau)
const ABIDJAN_LAT = 5.3599517;
const ABIDJAN_LNG = -4.0082563;

export default function SelecteurCarte({ latitude, longitude, onChange }) {
  const conteneurRef = useRef(null);
  const carteRef = useRef(null);
  const marqueurRef = useRef(null);
  const [pret, setPret] = useState(false);
  const [recherchePosition, setRecherchePosition] = useState(false);
  const [erreurPosition, setErreurPosition] = useState("");

  // Charge Leaflet depuis un CDN (pas besoin de npm install)
  useEffect(() => {
    if (window.L) {
      setPret(true);
      return;
    }

    const lien = document.createElement("link");
    lien.rel = "stylesheet";
    lien.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(lien);

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => setPret(true);
    document.body.appendChild(script);
  }, []);

  // Initialise la carte une fois Leaflet chargé
  useEffect(() => {
    if (!pret || !conteneurRef.current || carteRef.current) return;

    const L = window.L;
    const latDepart = latitude || ABIDJAN_LAT;
    const lngDepart = longitude || ABIDJAN_LNG;

    const carte = L.map(conteneurRef.current).setView([latDepart, lngDepart], 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap",
      maxZoom: 19,
    }).addTo(carte);

    const marqueur = L.marker([latDepart, lngDepart], { draggable: true }).addTo(carte);

    marqueur.on("dragend", () => {
      const position = marqueur.getLatLng();
      onChange({ latitude: position.lat, longitude: position.lng });
    });

    carte.on("click", (e) => {
      marqueur.setLatLng(e.latlng);
      onChange({ latitude: e.latlng.lat, longitude: e.latlng.lng });
    });

    carteRef.current = carte;
    marqueurRef.current = marqueur;

    if (latitude && longitude) {
      onChange({ latitude, longitude });
    }

    setTimeout(() => carte.invalidateSize(), 100);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pret]);

  function utiliserMaPosition() {
    setErreurPosition("");

    if (!navigator.geolocation) {
      setErreurPosition("La géolocalisation n'est pas disponible sur cet appareil.");
      return;
    }

    setRecherchePosition(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude: lat, longitude: lng } = position.coords;

        if (carteRef.current && marqueurRef.current) {
          marqueurRef.current.setLatLng([lat, lng]);
          carteRef.current.setView([lat, lng], 16);
        }

        onChange({ latitude: lat, longitude: lng });
        setRecherchePosition(false);
      },
      (erreur) => {
        setRecherchePosition(false);
        if (erreur.code === erreur.PERMISSION_DENIED) {
          setErreurPosition(
            "Localisation refusée. Autorisez l'accès à votre position dans les paramètres du navigateur, ou placez le repère manuellement sur la carte."
          );
        } else {
          setErreurPosition("Impossible de récupérer votre position. Placez le repère manuellement.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={utiliserMaPosition}
        disabled={recherchePosition}
        className="flex items-center gap-2 bg-bleu-50 hover:bg-bleu-100 text-bleu-600 text-sm font-medium px-4 py-2.5 rounded-md transition mb-3 disabled:opacity-50"
      >
        {recherchePosition ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <MapPin size={16} />
        )}
        {recherchePosition ? "Localisation en cours..." : "Utiliser ma position actuelle"}
      </button>

      {erreurPosition && (
        <p className="text-rouge-500 text-xs mb-2 bg-rouge-50 rounded-md p-2">
          {erreurPosition}
        </p>
      )}

      <div
        ref={conteneurRef}
        style={{ height: "280px", width: "100%", borderRadius: "8px" }}
        className="border border-anthracite-100"
      />
      <p className="text-xs text-anthracite-400 mt-2">
        Ou cliquez directement sur la carte / déplacez le repère pour ajuster l&apos;emplacement.
      </p>
    </div>
  );
}