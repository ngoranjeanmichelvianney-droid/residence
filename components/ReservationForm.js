"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResidenceForm({ proprietaireId, residence = null }) {
  const router = useRouter();
  const supabase = createClient();

  const [titre, setTitre] = useState(residence?.titre || "");
  const [description, setDescription] = useState(residence?.description || "");
  const [adresse, setAdresse] = useState(residence?.adresse || "");
  const [prixNuit, setPrixNuit] = useState(residence?.prix_nuit || "");
  const [capacite, setCapacite] = useState(residence?.capacite || 1);
  const [imagesExistantes, setImagesExistantes] = useState(residence?.images || []);
  const [nouveauxFichiers, setNouveauxFichiers] = useState([]);
  const [videoUrl, setVideoUrl] = useState(residence?.video_url || "");
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState("");

  function handleFichiers(e) {
    setNouveauxFichiers(Array.from(e.target.files));
  }

  function supprimerImageExistante(url) {
    setImagesExistantes(imagesExistantes.filter((img) => img !== url));
  }

  function nettoyerNomFichier(nomOriginal) {
    // Sépare le nom et l'extension
    const dernierPoint = nomOriginal.lastIndexOf(".");
    const extension = dernierPoint !== -1 ? nomOriginal.slice(dernierPoint) : "";
    const nomSansExtension = dernierPoint !== -1 ? nomOriginal.slice(0, dernierPoint) : nomOriginal;

    const nomNettoye = nomSansExtension
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // retire les accents
      .replace(/[^a-zA-Z0-9]/g, "-") // remplace tout le reste (espaces, parenthèses...) par des tirets
      .replace(/-+/g, "-") // évite les tirets multiples
      .toLowerCase();

    return nomNettoye + extension.toLowerCase();
  }

  async function uploadImages() {
    const urls = [];
    for (const fichier of nouveauxFichiers) {
      const nomNettoye = nettoyerNomFichier(fichier.name);
      const nomFichier = `${proprietaireId}/${Date.now()}-${nomNettoye}`;
      const { error } = await supabase.storage
        .from("residences-media")
        .upload(nomFichier, fichier);

      if (error) throw error;

      const { data } = supabase.storage
        .from("residences-media")
        .getPublicUrl(nomFichier);

      urls.push(data.publicUrl);
    }
    return urls;
  }

  async function handleSubmit(e, statutFinal) {
    e.preventDefault();
    setErreur("");

    try {
      const nouvellesUrls = statutFinal === "publie" ? [] : [];
      const toutesLesImagesAvant = [...imagesExistantes];

      if (statutFinal === "publie" && toutesLesImagesAvant.length === 0 && nouveauxFichiers.length === 0) {
        setErreur("Ajoutez au moins une photo avant de publier la résidence.");
        return;
      }

      setChargement(true);

      const nouvellesUrlsUpload = await uploadImages();
      const toutesLesImages = [...imagesExistantes, ...nouvellesUrlsUpload];

      const payload = {
        proprietaire_id: proprietaireId,
        titre,
        description,
        adresse,
        prix_nuit: parseFloat(prixNuit),
        capacite: parseInt(capacite),
        images: toutesLesImages,
        video_url: videoUrl || null,
        statut: statutFinal,
      };

      if (residence) {
        const { error } = await supabase
          .from("residences")
          .update(payload)
          .eq("id", residence.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("residences").insert(payload);
        if (error) throw error;
      }

      router.push("/proprietaire/dashboard");
      router.refresh();
    } catch (err) {
      setErreur(err.message || "Une erreur est survenue.");
    } finally {
      setChargement(false);
    }
  }

  return (
    <form className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-anthracite-600 mb-1">
          Titre de la résidence
        </label>
        <input
          type="text"
          required
          value={titre}
          onChange={(e) => setTitre(e.target.value)}
          placeholder="Ex : Appartement 2 pièces Cocody"
          className="w-full border border-anthracite-100 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-bleu-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-anthracite-600 mb-1">
          Description
        </label>
        <textarea
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border border-anthracite-100 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-bleu-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-anthracite-600 mb-1">
          Adresse
        </label>
        <input
          type="text"
          value={adresse}
          onChange={(e) => setAdresse(e.target.value)}
          placeholder="Ex : Cocody, Abidjan"
          className="w-full border border-anthracite-100 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-bleu-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-anthracite-600 mb-1">
            Prix / nuit (FCFA)
          </label>
          <input
            type="number"
            required
            min="0"
            value={prixNuit}
            onChange={(e) => setPrixNuit(e.target.value)}
            className="w-full border border-anthracite-100 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-bleu-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-anthracite-600 mb-1">
            Capacité (personnes)
          </label>
          <input
            type="number"
            required
            min="1"
            value={capacite}
            onChange={(e) => setCapacite(e.target.value)}
            className="w-full border border-anthracite-100 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-bleu-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-anthracite-600 mb-1">
          Lien vidéo (optionnel — YouTube, etc.)
        </label>
        <input
          type="url"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          placeholder="https://..."
          className="w-full border border-anthracite-100 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-bleu-500"
        />
      </div>

      {imagesExistantes.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-anthracite-600 mb-2">
            Images actuelles
          </label>
          <div className="grid grid-cols-4 gap-2">
            {imagesExistantes.map((url) => (
              <div key={url} className="relative">
                <img
                  src={url}
                  alt=""
                  className="w-full h-20 object-cover rounded-md"
                />
                <button
                  type="button"
                  onClick={() => supprimerImageExistante(url)}
                  className="absolute -top-2 -right-2 bg-rouge-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-anthracite-600 mb-1">
          Ajouter des photos
        </label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFichiers}
          className="w-full text-sm text-anthracite-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-bleu-50 file:text-bleu-600 file:font-medium"
        />
      </div>

      {erreur && <p className="text-rouge-500 text-sm">{erreur}</p>}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          disabled={chargement}
          onClick={(e) => handleSubmit(e, "brouillon")}
          className="flex-1 border border-bleu-600 text-bleu-600 font-semibold py-2.5 rounded-md hover:bg-bleu-50 transition disabled:opacity-50"
        >
          Enregistrer en brouillon
        </button>
        <button
          type="button"
          disabled={chargement}
          onClick={(e) => handleSubmit(e, "publie")}
          className="flex-1 bg-rouge-500 hover:bg-rouge-600 text-white font-semibold py-2.5 rounded-md transition disabled:opacity-50"
        >
          {chargement ? "Publication..." : "Publier"}
        </button>
      </div>
    </form>
  );
}