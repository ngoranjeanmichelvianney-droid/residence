const CLE_PUBLIQUE = "sk_sandbox_o6CG4DwJIjKC9zJyvbM1WDZAnGJ2v0j5";
const CLE_SECRETE = "ss_sandbox_cFTrdCYBlQRiYYnIIkywbpk8mx3E3vV7qlgJ2UxGZppBHRr9";
const URL_SITE = "https://residence-jwd6txkq0-ngoran-jean-michels-projects.vercel.app";

async function enregistrerWebhook() {
  const reponse = await fetch("https://pay.genius.ci/api/v1/merchant/webhooks", {
    method: "POST",
    headers: {
      "X-API-Key": CLE_PUBLIQUE,
      "X-API-Secret": CLE_SECRETE,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: "Webhook reservations production",
      url: `${URL_SITE}/api/webhooks`,
      events: ["payment.success", "payment.failed"],
    }),
  });

  const resultat = await reponse.json();
  console.log(JSON.stringify(resultat, null, 2));

  if (resultat.success) {
    console.log("\nWebhook enregistre !");
    console.log("Note bien ce secret quelque part :");
    console.log(resultat.data?.secret || "(regarde le champ secret ci-dessus)");
  } else {
    console.log("\nEchec - regarde le message d'erreur ci-dessus.");
  }
}

enregistrerWebhook();