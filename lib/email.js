const RESEND_API_URL = "https://api.resend.com/emails";
const EXPEDITEUR = "HomTesti <notifications@homtesti.com>";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://homtesti.com";
const LOGO_URL = `${SITE_URL}/images/L1.jpeg`;

export async function envoyerEmail({ destinataire, sujet, html }) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.error("RESEND_API_KEY manquante : email non envoyé.");
    return { erreur: "Configuration email manquante." };
  }

  const reponse = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: EXPEDITEUR,
      to: destinataire,
      subject: sujet,
      html,
    }),
  });

  if (!reponse.ok) {
    const erreur = await reponse.json().catch(() => ({}));
    console.error("Erreur envoi email Resend :", erreur);
    return { erreur: erreur?.message || "Erreur lors de l'envoi de l'email." };
  }

  return { succes: true };
}

function enveloppe(contenuHtml) {
  return `
    <div style="background: #f8f9fb; padding: 32px 16px; font-family: -apple-system, Segoe UI, Roboto, sans-serif;">
      <div style="max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
        <div style="background: #1e3a8a; padding: 24px; text-align: center;">
          <img src="${LOGO_URL}" alt="HomTesti" width="40" height="40" style="border-radius: 8px; display: inline-block; vertical-align: middle;" />
          <span style="color: #ffffff; font-size: 20px; font-weight: bold; vertical-align: middle; margin-left: 10px;">
            Hom<span style="color: #fbbf24;">Testi</span>
          </span>
        </div>
        <div style="padding: 32px 28px;">
          ${contenuHtml}
        </div>
        <div style="background: #f8f9fb; padding: 16px 28px; border-top: 1px solid #eef0f4;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            HomTesti — Abidjan, Côte d'Ivoire<br />
            Vous recevez cet email suite à une action sur votre compte HomTesti.
          </p>
        </div>
      </div>
    </div>
  `;
}

function bouton(texte, lien, couleur = "#dc2626") {
  return `
    <div style="text-align: center; margin: 28px 0;">
      <a href="${lien}" style="display: inline-block; background: ${couleur}; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px;">
        ${texte}
      </a>
    </div>
  `;
}

export function emailBienvenue({ nom, typeCompte }) {
  const contenu = `
    <h1 style="color: #1a1a2e; font-size: 22px; margin: 0 0 16px;">Bienvenue, ${nom} !</h1>
    <p style="color: #374151; font-size: 15px; line-height: 1.6;">
      Votre compte ${typeCompte === "proprietaire" ? "propriétaire" : "client"} HomTesti a été créé avec succès.
    </p>
    ${
      typeCompte === "proprietaire"
        ? `<div style="background: #fffbeb; border-left: 4px solid #fbbf24; padding: 14px 16px; border-radius: 6px; margin: 20px 0;">
             <p style="color: #374151; font-size: 14px; margin: 0;">
               Votre compte est <strong>en attente de validation</strong> par notre équipe. Vous recevrez un email dès qu'il sera activé.
             </p>
           </div>`
        : `<p style="color: #374151; font-size: 15px; line-height: 1.6;">
             Vous pouvez dès maintenant parcourir nos résidences et faire vos réservations.
           </p>
           ${bouton("Voir les résidences", `${SITE_URL}/residences`)}`
    }
  `;
  return { sujet: "Bienvenue sur HomTesti !", html: enveloppe(contenu) };
}

export function emailCompteValide({ nom }) {
  const contenu = `
    <h1 style="color: #1a1a2e; font-size: 22px; margin: 0 0 16px;">Votre compte est activé !</h1>
    <p style="color: #374151; font-size: 15px; line-height: 1.6;">
      Bonjour ${nom}, bonne nouvelle : votre compte propriétaire HomTesti vient d'être validé par notre équipe.
    </p>
    <p style="color: #374151; font-size: 15px; line-height: 1.6;">
      Vous pouvez dès à présent ajouter vos résidences et commencer à recevoir des réservations.
    </p>
    ${bouton("Ajouter ma première résidence", `${SITE_URL}/proprietaire/dashboard`)}
  `;
  return { sujet: "Votre compte HomTesti est activé !", html: enveloppe(contenu) };
}

export function emailConfirmationPaiement({ nomClient, titreResidence, dateArrivee, dateDepart, montant, lienConversation }) {
  const contenu = `
    <h1 style="color: #1a1a2e; font-size: 22px; margin: 0 0 16px;">Paiement reçu !</h1>
    <p style="color: #374151; font-size: 15px; line-height: 1.6;">
      Bonjour ${nomClient}, votre paiement pour <strong>${titreResidence}</strong> a bien été confirmé.
    </p>
    <div style="background: #eef2ff; border-radius: 8px; padding: 18px; margin: 22px 0;">
      <table style="width: 100%; font-size: 14px; color: #374151;">
        <tr>
          <td style="padding: 4px 0;">Arrivée</td>
          <td style="padding: 4px 0; text-align: right; font-weight: bold;">${dateArrivee}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0;">Départ</td>
          <td style="padding: 4px 0; text-align: right; font-weight: bold;">${dateDepart}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0 0; border-top: 1px solid #dbeafe; font-weight: bold;">Montant payé</td>
          <td style="padding: 8px 0 0; border-top: 1px solid #dbeafe; text-align: right; font-weight: bold; color: #1e3a8a;">${montant.toLocaleString("fr-FR")} FCFA</td>
        </tr>
      </table>
    </div>
    <p style="color: #374151; font-size: 14px; line-height: 1.6;">
      Pour toute question sur votre arrivée, contactez le propriétaire directement via la messagerie HomTesti.
    </p>
    ${lienConversation ? bouton("Ouvrir la conversation", lienConversation, "#1e3a8a") : ""}
  `;
  return { sujet: "Paiement confirmé — votre réservation HomTesti", html: enveloppe(contenu) };
}

export function emailReinitialisationMotDePasse({ lienReinitialisation }) {
  const contenu = `
    <h1 style="color: #1a1a2e; font-size: 22px; margin: 0 0 16px;">Réinitialiser votre mot de passe</h1>
    <p style="color: #374151; font-size: 15px; line-height: 1.6;">
      Vous avez demandé à réinitialiser votre mot de passe HomTesti.
    </p>
    ${bouton("Choisir un nouveau mot de passe", lienReinitialisation)}
    <p style="color: #9ca3af; font-size: 13px; line-height: 1.5;">
      Ce lien expire dans 1 heure. Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet email — votre mot de passe restera inchangé.
    </p>
  `;
  return { sujet: "Réinitialisation de votre mot de passe HomTesti", html: enveloppe(contenu) };
}

export function emailNouvelleDemandeReservation({ nomProprietaire, titreResidence, dateArrivee, dateDepart }) {
  const contenu = `
    <h1 style="color: #1a1a2e; font-size: 22px; margin: 0 0 16px;">Nouvelle demande de réservation</h1>
    <p style="color: #374151; font-size: 15px; line-height: 1.6;">
      Bonjour ${nomProprietaire}, vous avez reçu une nouvelle demande pour <strong>${titreResidence}</strong>.
    </p>
    <div style="background: #fffbeb; border-radius: 8px; padding: 16px; margin: 20px 0;">
      <p style="margin: 4px 0; color: #374151;"><strong>Arrivée :</strong> ${dateArrivee}</p>
      <p style="margin: 4px 0; color: #374151;"><strong>Départ :</strong> ${dateDepart}</p>
    </div>
    <p style="color: #374151; font-size: 14px; line-height: 1.6;">
      Connectez-vous pour valider ou refuser cette demande. Le client ne pourra payer qu'une fois votre validation reçue.
    </p>
    ${bouton("Voir la demande", `${SITE_URL}/proprietaire/reservations`, "#1e3a8a")}
  `;
  return { sujet: "Nouvelle demande de réservation — HomTesti", html: enveloppe(contenu) };
}

export function emailReservationValidee({ nomClient, titreResidence }) {
  const contenu = `
    <h1 style="color: #1a1a2e; font-size: 22px; margin: 0 0 16px;">Votre demande est validée !</h1>
    <p style="color: #374151; font-size: 15px; line-height: 1.6;">
      Bonjour ${nomClient}, le propriétaire a validé votre demande pour <strong>${titreResidence}</strong>.
    </p>
    <p style="color: #374151; font-size: 15px; line-height: 1.6;">
      Il ne reste qu'une étape : finaliser le paiement pour confirmer définitivement votre réservation.
    </p>
    ${bouton("Payer maintenant", `${SITE_URL}/mes-reservations`)}
  `;
  return { sujet: "Votre demande de réservation est validée !", html: enveloppe(contenu) };
}

export function emailReservationRefusee({ nomClient, titreResidence }) {
  const contenu = `
    <h1 style="color: #1a1a2e; font-size: 22px; margin: 0 0 16px;">Demande non retenue</h1>
    <p style="color: #374151; font-size: 15px; line-height: 1.6;">
      Bonjour ${nomClient}, le propriétaire n'a malheureusement pas pu retenir votre demande pour <strong>${titreResidence}</strong>, probablement en raison d'une indisponibilité.
    </p>
    <p style="color: #374151; font-size: 15px; line-height: 1.6;">
      N'hésitez pas à consulter d'autres résidences disponibles sur HomTesti.
    </p>
    ${bouton("Voir d'autres résidences", `${SITE_URL}/residences`, "#1e3a8a")}
  `;
  return { sujet: "Votre demande de réservation — HomTesti", html: enveloppe(contenu) };
}