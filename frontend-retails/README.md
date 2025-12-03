# Selos Retails

Application Next.js pour les vendeurs (Salesperson) de Selos.

## Installation

```bash
npm install
```

## Configuration

Créez un fichier `.env.local` à la racine du projet :

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXTAUTH_URL=http://localhost:3002
NEXTAUTH_SECRET=your-secret-key-here
```

## Développement

```bash
npm run dev
```

L'application sera accessible sur http://localhost:3002

## Authentification

Seuls les utilisateurs de type "Salesperson" peuvent se connecter à cette application.

