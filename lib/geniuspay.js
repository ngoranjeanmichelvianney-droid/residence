// lib/geniuspay.js
const GENIUS_API_URL = "https://pay.genius.ci/api/v1/merchant/payments";

export async function creerPaiementGenius({
  montant,
  clientNom,
  clientTelephone,
  reservationId,
  successUrl,
  errorUrl,
}) {
  const apiKey = process.env.GENIUS_API_KEY;
  const apiSecret = process.env.GENIUS_API_SECRET;

  if (!apiKey || !apiSecret) {
    throw new Error(
      "Clés GeniusPay manquantes. Ajoutez GENIUS_API_KEY et GENIUS_API_SECRET dans .env.local"
    );
  }

  const reponse = await fetch(GENIUS_API_URL, {
    method: "POST",
    headers: {
      "X-API-Key": apiKey,
      "X-API-Secret": apiSecret,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: montant,
      description: `Réservation ${reservationId}`,
      customer: {
        name: clientNom,
        phone: clientTelephone,
      },
      metadata: {
        reservation_id: reservationId,
      },
      success_url: successUrl,
      error_url: errorUrl,
    }),
  });

  // DEBUG TEMPORAIRE — à retirer une fois le problème identifié
  const texteBrut = await reponse.text();
  console.log("Statut GeniusPay :", reponse.status);
  console.log("Content-Type :", reponse.headers.get("content-type"));
  console.log("Corps brut (300 premiers caractères) :", texteBrut.slice(0, 300));

  let donnees;
  try {
    donnees = JSON.parse(texteBrut);
  } catch {
    throw new Error(
      `GeniusPay a renvoyé une réponse non-JSON (statut ${reponse.status}). Voir les logs serveur.`
    );
  }

  if (!reponse.ok || !donnees.success) {
    throw new Error(donnees?.error?.message || donnees?.message || "Erreur lors de la création du paiement GeniusPay");
  }

  return donnees.data;
}

export async function verifierPaiementGenius(reference) {
  const apiKey = process.env.GENIUS_API_KEY;
  const apiSecret = process.env.GENIUS_API_SECRET;

  if (!apiKey || !apiSecret) {
    throw new Error("Clés GeniusPay manquantes.");
  }

  const reponse = await fetch(`${GENIUS_API_URL}/${reference}`, {
    method: "GET",
    headers: {
      "X-API-Key": apiKey,
      "X-API-Secret": apiSecret,
    },
  });

  const donnees = await reponse.json();

  if (!reponse.ok || !donnees.success) {
    throw new Error(donnees?.error?.message || "Erreur lors de la vérification du paiement");
  }

  return donnees.data;
}