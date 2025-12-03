# ✅ Correction CORS appliquée

## Problème

L'erreur CORS indiquait que le backend bloquait les requêtes depuis `http://localhost` (l'origine utilisée par Capacitor sur Android).

## Solution

J'ai mis à jour la configuration CORS dans `backend/src/main.ts` pour autoriser :
- `http://localhost` (sans port) - utilisé par Capacitor Android
- `http://127.0.0.1` (sans port)
- Expressions régulières pour autoriser localhost avec ou sans port

## Action requise

**Vous devez redémarrer le backend** pour que les changements prennent effet :

```bash
# Arrêtez le backend (Ctrl+C)
# Puis redémarrez-le
cd backend
npm run start:dev
```

## Vérification

Après avoir redémarré le backend, l'application Android devrait pouvoir se connecter sans erreur CORS.

Les logs devraient maintenant montrer une connexion réussie au lieu de l'erreur CORS.

