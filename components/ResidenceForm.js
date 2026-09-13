"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import SelecteurCarte from "./SelecteurCarte";
import { contientNumeroTelephone } from "@/lib/filtreMessages";

const CATEGORIES = [
  { valeur: "salon", label: "Salon" },
  { valeur: "chambre", label: "Chambre" },
  { valeur: "cuisine", label: "Cuisine" },
  { valeur: "salle_de_bain", label: "Salle de bain / Douche" },
  { valeur: "exterieur", label: "Extérieur" },
  { valeur: "autre", label: "Autre" },
];

const NOMBRE_PHOTOS_MIN = 3;
const NOMBRE_PHOTOS_MAX = 10;

function formaterPrixAffichage(valeurBrute) {
  const chiffres = valeurBrute.replace(/[^0-9]/g, "");
  if (!chiffres) return "";
  return chiffres.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function nettoyerPrixVersNombre(valeurAffichee) {
  const chiffres = valeurAffichee.replace(/[^0-9]/g, "");
  return chiffres ? parseInt(chiffres, 10) : 0;
}

export default function ResidenceForm({ proprietaireId, residence = null }) {
  const router = useRouter();
  const supabase = createClient();

  const [titre, setTitre] = useState(residence?.titre || "");
  const [description, setDescription] = useState(residence?.description || "");
  const [adresse, setAdresse] = useState(residence?.adresse || "");
  const [prixAffiche, setPrixAffiche] = useState(
    residence?.prix_nuit ? formaterPrixAffichage(String(residence.prix_nuit)) : ""
  );
  const [capacite, setCapacite] = useState(residence?.capacite || 1);
  const [latitude, setLatitude] = useState(residence?.latitude || null);
  const [longitude, setLongitude] = useState(residence?.longitude || null);
  const [disponible, setDisponible] = useState(
    residence?.disponible !== undefined ? residence.disponible : true
  );

  const [imagesExistantes, setImagesExistantes] = useState(
    (residence?.images || []).map((url, i) => ({
      url,
      categorie: residence?.images_categories?.[i] || "autre",
    }))
  );
  const [nouveauxFichiers, setNouveauxFichiers] = useState([]);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState("");

  function handlePrixChange(e) {
    setPrixAffiche(formaterPrixAffichage(e.target.value));
  }

  function handleFichiers(e) {
    const fichiersChoisis = Array.from(e.target.files);
    const placesRestantes =
      NOMBRE_PHOTOS_MAX - imagesExistantes.length - nouveauxFichiers.length;

    if (placesRestantes <= 0) {
      setErreur(`Vous avez déjà atteint le maximum de ${NOMBRE_PHOTOS_MAX} photos.`);
      e.target.value = "";
      return;
    }

    const fichiersRetenus = fichiersChoisis.slice(0, placesRestantes);
    if (fichiersChoisis.length > placesRestantes) {
      setErreur(
        `Seulement ${placesRestantes} photo(s) ajoutée(s) : le maximum est de ${NOMBRE_PHOTOS_MAX} photos.`
      );
    } else {
      setErreur("");
    }

    const fichiers = fichiersRetenus.map((fichier) => ({
      fichier,
      categorie: "autre",
    }));
    setNouveauxFichiers((prev) => [...prev, ...fichiers]);
    e.target.value = "";
  }

  function changerCategorieExistante(index, categorie) {
    setImagesExistantes((prev) =>
      prev.map((img, i) => (i === index ? { ...img, categorie } : img))
    );
  }

  function changerCategorieNouvelle(index, categorie) {
    setNouveauxFichiers((prev) =>
      prev.map((f, i) => (i === index ? { ...f, categorie } : f))
    );
  }

  function supprimerImageExistante(index) {
    setImagesExistantes((prev) => prev.filter((_, i) => i !== index));
  }

  function supprimerNouveauFichier(index) {
    setNouveauxFichiers((prev) => prev.filter((_, i) => i !== index));
  }

  function nettoyerNomFichier(nomOriginal) {
    const dernierPoint = nomOriginal.lastIndexOf(".");
    const extension = dernierPoint !== -1 ? nomOriginal.slice(dernierPoint) : "";
    const nomSansExtension = dernierPoint !== -1 ? nomOriginal.slice(0, dernierPoint) : nomOriginal;

    const nomNettoye = nomSansExtension
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]/g, "-")
      .replace(/-+/g, "-")
      .toLowerCase();

    return nomNettoye + extension.toLowerCase();
  }

  function verifierExigencesPhotos(statutFinal) {
    if (statutFinal === "brouillon") return null;

    const totalPhotos = imagesExistantes.length + nouveauxFichiers.length;
    if (totalPhotos < NOMBRE_PHOTOS_MIN) {
      return `Il faut au moins ${NOMBRE_PHOTOS_MIN} photos pour publier (actuellement ${totalPhotos}).`;
    }

    return null;
  }

  async function uploadImages() {
    const urlsAvecCategories = [];
    for (const { fichier, categorie } of nouveauxFichiers) {
      const nomNettoye = nettoyerNomFichier(fichier.name);
      const nomFichier = `${proprietaireId}/${Date.now()}-${nomNettoye}`;
      const { error } = await supabase.storage
        .from("residences-media")
        .upload(nomFichier, fichier);

      if (error) throw error;

      const { data } = supabase.storage
        .from("residences-media")
        .getPublicUrl(nomFichier);

      urlsAvecCategories.push({ url: data.publicUrl, categorie });
    }
    return urlsAvecCategories;
  }

  async function handleSubmit(e, statutFinal) {
    e.preventDefault();
    setErreur("");

    if (contientNumeroTelephone(titre) || contientNumeroTelephone(description) || contientNumeroTelephone(adresse)) {
      setErreur(
        "Le titre, la description et l'adresse ne doivent pas contenir de numéro de téléphone. Utilisez la messagerie pour échanger vos coordonnées avec les clients."
      );
      return;
    }

    const erreurPhotos = verifierExigencesPhotos(statutFinal);
    if (erreurPhotos) {
      setErreur(erreurPhotos);
      return;
    }

    setChargement(true);

    try {
      const nouvellesImages = await uploadImages();
      const toutesLesImages = [...imagesExistantes, ...nouvellesImages];

      const payload = {
        proprietaire_id: proprietaireId,
        titre,
        description,
        adresse,
        prix_nuit: nettoyerPrixVersNombre(prixAffiche),
        capacite: parseInt(capacite),
        latitude,
        longitude,
        disponible,
        images: toutesLesImages.map((img) => img.url),
        images_categories: toutesLesImages.map((img) => img.categorie),
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

  const totalPhotos = imagesExistantes.length + nouveauxFichiers.length;
  const maxAtteint = totalPhotos >= NOMBRE_PHOTOS_MAX;

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
        <p className="text-xs text-anthracite-400 mt-1">
          N&apos;indiquez pas de numéro de téléphone ici — utilisez la messagerie pour échanger avec les clients.
        </p>
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

      <div>
        <label className="block text-sm font-medium text-anthracite-600 mb-1">
          Localisation GPS
        </label>
        <SelecteurCarte
          latitude={latitude}
          longitude={longitude}
          onChange={({ latitude: lat, longitude: lng }) => {
            setLatitude(lat);
            setLongitude(lng);
          }}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-anthracite-600 mb-1">
            Prix / nuit (FCFA)
          </label>
          <input
            type="text"
            inputMode="numeric"
            required
            value={prixAffiche}
            onChange={handlePrixChange}
            placeholder="Ex : 25.000"
            className="w-full border border-anthracite-100 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-bleu-500"
          />
          <p className="text-xs text-anthracite-400 mt-1">
            Avec ou sans point, ex : 25000 ou 25.000
          </p>
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

      {residence && (
        <div className="bg-anthracite-50 rounded-md p-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={disponible}
              onChange={(e) => setDisponible(e.target.checked)}
              className="w-5 h-5"
            />
            <div>
              <p className="text-sm font-medium text-anthracite-800">
                Résidence disponible à la réservation
              </p>
              <p className="text-xs text-anthracite-400">
                Décochez si la résidence est actuellement occupée ou indisponible. Réactivez-la vous-même une fois qu&apos;elle est libre.
              </p>
            </div>
          </label>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-anthracite-600 mb-2">
          Photos
        </label>

        {imagesExistantes.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
            {imagesExistantes.map((img, i) => (
              <div key={img.url} className="space-y-1">
                <div className="relative">
                  <img
                    src={img.url}
                    alt=""
                    className="w-full h-24 object-cover rounded-md"
                  />
                  <button
                    type="button"
                    onClick={() => supprimerImageExistante(i)}
                    className="absolute -top-2 -right-2 bg-rouge-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
                <select
                  value={img.categorie}
                  onChange={(e) => changerCategorieExistante(i, e.target.value)}
                  className="w-full text-xs border border-anthracite-100 rounded-md px-2 py-1"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.valeur} value={cat.valeur}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}

        {nouveauxFichiers.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
            {nouveauxFichiers.map((f, i) => (
              <div key={i} className="space-y-1">
                <div className="relative">
                  <img
                    src={URL.createObjectURL(f.fichier)}
                    alt=""
                    className="w-full h-24 object-cover rounded-md"
                  />
                  <button
                    type="button"
                    onClick={() => supprimerNouveauFichier(i)}
                    className="absolute -top-2 -right-2 bg-rouge-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
                <select
                  value={f.categorie}
                  onChange={(e) => changerCategorieNouvelle(i, e.target.value)}
                  className="w-full text-xs border border-anthracite-100 rounded-md px-2 py-1"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.valeur} value={cat.valeur}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}

        <input
          type="file"
          accept="image/*"
          multiple
          disabled={maxAtteint}
          onChange={handleFichiers}
          className="w-full text-sm text-anthracite-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-bleu-50 file:text-bleu-600 file:font-medium disabled:opacity-50"
        />
      </div>

      {erreur && <p className="text-rouge-500 text-sm bg-rouge-50 rounded-md p-3">{erreur}</p>}

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