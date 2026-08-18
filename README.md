# Plateforme Résidences — Multi-propriétaires

Site de réservation de résidences meublées avec 3 espaces :
- **Public** : parcourt les résidences, envoie une demande de réservation
- **Propriétaire** : s'inscrit librement, gère ses propres résidences (photos, vidéo, prix) une fois validé
- **Admin** : valide les propriétaires, supervise tout

Stack : **Next.js 14** (App Router) + **Tailwind CSS** + **Supabase** (Auth, DB, Storage)

## 1. Installer les dépendances

```bash
npm install
```

## 2. Créer le projet Supabase

1. Va sur [supabase.com](https://supabase.com) → crée un nouveau projet
2. Dans **SQL Editor**, colle le contenu de `supabase/schema.sql` et exécute-le
   → ça crée les tables, la sécurité (RLS), et le bucket de stockage pour les images
3. Récupère `Project URL` et `anon public key` dans **Settings > API**

## 3. Configurer les variables d'environnement

```bash
cp .env.local.example .env.local
```

Remplis `.env.local` avec les clés récupérées à l'étape 2.

## 4. Créer le premier compte admin

Un admin ne s'inscrit pas via le site (par sécurité). Il faut le créer manuellement :

1. Dans Supabase, va dans **Authentication > Users** → crée un utilisateur (email + mot de passe)
2. Copie son `UUID`
3. Dans **SQL Editor**, exécute :
   ```sql
   insert into admins (auth_id, nom) values ('UUID_COPIÉ', 'Nom Admin');
   ```

## 5. Lancer en local

```bash
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000)

## Structure du projet

```
app/
  page.js                        → Accueil public
  residences/[id]/page.js        → Fiche résidence + réservation
  auth/login/page.js             → Connexion
  auth/register/page.js          → Inscription propriétaire
  proprietaire/dashboard/        → Espace propriétaire
  proprietaire/residences/nouvelle/ → Ajouter une résidence
  admin/proprietaires/           → Validation des propriétaires

components/
  ResidenceForm.js       → Formulaire ajout/édition résidence + upload images
  ReservationForm.js     → Formulaire public de réservation
  ProprietaireActions.js → Boutons valider/refuser propriétaire

supabase/
  schema.sql              → Tables + sécurité (RLS) + bucket storage
```

## Ce qui reste à faire (V2 possible)

- Page admin pour valider/refuser les résidences avant publication (actuellement les résidences soumises passent en `en_attente_validation` — il faut une page pour les publier, cf. modèle de `admin/proprietaires/page.js`)
- Page propriétaire/admin pour voir et confirmer/refuser les réservations reçues
- Calendrier de disponibilité en temps réel (actuellement : formulaire simple, validation manuelle)
- Paiement en ligne (Wave Business) — à ajouter une fois le MVP validé par le client
- Notifications (email/SMS) quand une réservation arrive ou qu'un compte est validé

## Déploiement

Recommandé : **Vercel** (gratuit pour démarrer)
1. Push le code sur GitHub
2. Connecte le repo sur [vercel.com](https://vercel.com)
3. Ajoute les mêmes variables d'environnement que `.env.local`
4. Deploy
