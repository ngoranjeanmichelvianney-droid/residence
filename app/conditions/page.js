import Header from "@/components/Header";

export default function ConditionsPage() {
  return (
    <>
      <Header />
      <div className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-anthracite-800 mb-2">
          Conditions générales d&apos;utilisation
        </h1>
        <p className="text-sm text-anthracite-400 mb-8">
          Dernière mise à jour : {new Date().toLocaleDateString("fr-FR")}
        </p>

        <div className="space-y-8 text-anthracite-700 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-anthracite-800 mb-2">
              1. Objet
            </h2>
            <p>
              Les présentes conditions générales d&apos;utilisation (CGU) régissent
              l&apos;accès et l&apos;usage de la plateforme Résidences, qui met en
              relation des propriétaires de résidences et des clients souhaitant
              réserver un hébergement. En créant un compte, l&apos;utilisateur
              accepte sans réserve les présentes CGU.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-anthracite-800 mb-2">
              2. Inscription et comptes
            </h2>
            <p>
              L&apos;inscription nécessite la fourniture d&apos;informations exactes
              (nom, téléphone, email). Pour les propriétaires, une pièce
              d&apos;identité valide (recto et verso) est requise afin de
              vérifier l&apos;identité avant validation du compte par
              l&apos;administrateur. Toute fausse déclaration peut entraîner la
              suspension ou la suppression du compte.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-anthracite-800 mb-2">
              3. Rôle de la plateforme
            </h2>
            <p>
              La plateforme agit en tant qu&apos;intermédiaire entre propriétaires
              et clients. Elle ne garantit pas la disponibilité, la qualité ou
              la conformité des résidences proposées, celles-ci restant sous la
              responsabilité exclusive des propriétaires qui les publient.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-anthracite-800 mb-2">
              4. Réservations et paiements
            </h2>
            <p>
              Toute réservation confirmée engage le client au paiement du
              montant indiqué. Les conditions d&apos;annulation et de
              remboursement propres à chaque résidence sont précisées sur la
              fiche de l&apos;annonce concernée.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-anthracite-800 mb-2">
              5. Obligations des propriétaires
            </h2>
            <p>
              Le propriétaire s&apos;engage à fournir des informations exactes sur
              ses résidences (photos, prix, disponibilités) et à honorer les
              réservations confirmées. Tout manquement peut entraîner la
              suspension du compte.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-anthracite-800 mb-2">
              6. Données personnelles
            </h2>
            <p>
              Les données collectées (identité, contact, pièce d&apos;identité)
              sont utilisées exclusivement dans le cadre du fonctionnement de
              la plateforme et de la vérification des comptes. Elles ne sont
              ni vendues ni transmises à des tiers non autorisés.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-anthracite-800 mb-2">
              7. Modification des CGU
            </h2>
            <p>
              La plateforme se réserve le droit de modifier les présentes CGU
              à tout moment. Les utilisateurs seront informés de toute
              modification substantielle.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-anthracite-800 mb-2">
              8. Contact
            </h2>
            <p>
              Pour toute question relative aux présentes CGU, vous pouvez
              contacter l&apos;administrateur de la plateforme.
            </p>
          </section>
        </div>
      </div>
    </>
  );
}