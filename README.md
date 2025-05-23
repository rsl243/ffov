# FFOV - Plateforme de Marketplace

Ce projet est une application de marketplace développée avec Next.js qui permet aux vendeurs de gérer leurs produits et points de vente.

## Technologies utilisées

- Next.js 14
- TypeScript
- Tailwind CSS
- Supabase (authentification et base de données)
- ESLint

## Structure du projet

```
src/
  ├── app/                    # Pages et routes de l'application
  │   ├── api/                # Routes API
  │   ├── dashboard/          # Pages du tableau de bord
  │   ├── clients/            # Gestion des clients
  │   ├── marketing/          # Outils marketing
  │   └── parametres/         # Configuration du compte
  ├── components/             # Composants réutilisables
  ├── contexts/               # Contextes React (dont SupabaseAuthContext)
  ├── lib/                    # Bibliothèques et utilitaires
  └── types/                  # Définitions de types TypeScript
```

## Installation

1. Cloner le projet
```bash
git clone https://github.com/[VOTRE_USERNAME]/ffov.git
cd ffov
```

2. Installer les dépendances
```bash
npm install
# ou
yarn install
```

3. Configuration des variables d'environnement

Un fichier `.env.example` est fourni à la racine du projet. Vous devez créer votre propre fichier `.env.local` basé sur ce modèle :

```bash
# Copier le fichier d'exemple
cp .env.example .env.local

# Éditer le fichier .env.local avec vos informations Supabase
```

Ensuite, complétez les valeurs dans le fichier `.env.local` :
```
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=votre_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_cle_anon_supabase
```

**Important** : Les valeurs pour Supabase doivent être obtenues depuis votre projet Supabase. Ne partagez jamais ces informations en les poussant sur GitHub.

4. Lancer le serveur de développement
```bash
npm run dev
# ou
yarn dev
```

## Configuration de Supabase

Le projet utilise Supabase pour l'authentification et la gestion des données. Lorsque vous récupérez le projet sur un nouveau PC :

1. Assurez-vous que vous avez créé un fichier `.env.local` avec les bonnes clés Supabase
2. Les clés peuvent être obtenues depuis le dashboard Supabase, dans les paramètres de votre projet
3. L'application est déjà configurée pour utiliser ces variables d'environnement

## Offres tarifaires

L'application propose trois offres tarifaires pour les vendeurs :
- VILLE (10€ HT)
- RÉGION (35€ HT)
- PAYS (100€ HT)

Chaque offre débloque différentes fonctionnalités et limites.

## Déploiement

Le projet peut être déployé sur Vercel ou tout autre service supportant Next.js.

```bash
npm run build
npm start
# ou
yarn build
yarn start
```#   f f o v  
 