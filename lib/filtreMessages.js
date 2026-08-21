// Détecte les tentatives de partage de numéro de téléphone, y compris
// les contournements courants (espaces, points, tirets, mots-clés).

const MOTS_CLES_SUSPECTS = [
  "whatsapp",
  "whats app",
  "appelle",
  "appelez",
  "mon numero",
  "mon numéro",
  "contacte moi au",
  "joins moi",
  "rejoins moi",
];

export function contientNumeroTelephone(texte) {
  const nettoye = texte.toLowerCase();

  // 1. Séquences de chiffres (avec séparateurs espace/point/tiret) de 7 chiffres ou plus
  //    Exemple détecté : "0767369525", "07 67 36 95 25", "225-0767369525"
  const chiffresSeuls = nettoye.replace(/[^0-9]/g, "");
  const sequencesDeChiffres = nettoye.match(/(\d[\s.\-]?){7,}/g);
  if (sequencesDeChiffres) {
    return true;
  }

  // Sécurité supplémentaire : si le message contient globalement beaucoup
  // de chiffres d'affilée une fois nettoyé de tout le texte, on bloque aussi.
  if (chiffresSeuls.length >= 8) {
    return true;
  }

  // 2. Mots-clés qui accompagnent généralement une tentative de contact direct
  for (const motCle of MOTS_CLES_SUSPECTS) {
    if (nettoye.includes(motCle)) {
      return true;
    }
  }

  return false;
}

export function messageErreurNumero() {
  return "Le partage de numéro de téléphone n'est pas autorisé dans la messagerie. Toutes les communications doivent rester sur HomTesti.";
}