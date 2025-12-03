# 🔧 Correction : Erreur "Vérifier que le backend est démarré" dans l'APK

## Problème

L'application APK ne peut pas se connecter au backend car l'URL de l'API n'est pas correctement configurée pour Android.

## Solution rapide (3 étapes)

### Étape 1 : Trouver votre IP locale

**Sur Windows :**
```powershell
ipconfig
```
Cherchez **"IPv4 Address"** (exemple : `192.168.1.66`)

### Étape 2 : Créer le fichier .env

Créez un fichier `.env` dans le dossier `selos-mobile/` :

```env
VITE_API_URL=http://VOTRE_IP:3001
```

**Exemple :**
```env
VITE_API_URL=http://192.168.1.66:3001
```

⚠️ **Remplacez `VOTRE_IP` par l'IP que vous avez trouvée à l'étape 1 !**

### Étape 3 : Rebuild et régénérer l'APK

```bash
cd selos-mobile
npm run build
npx cap sync
```

Puis dans Android Studio :
- Build → Clean Project
- Build → Rebuild Project  
- Build → Build Bundle(s) / APK(s) → Build APK(s)

## Vérifications importantes

✅ **Votre backend doit être démarré** sur le port 3001
✅ **Votre téléphone et votre ordinateur doivent être sur le même réseau WiFi**
✅ **Le pare-feu ne doit pas bloquer le port 3001**

## Test rapide

Testez si votre backend est accessible depuis votre téléphone :
1. Ouvrez un navigateur sur votre téléphone
2. Allez sur : `http://VOTRE_IP:3001`
3. Si vous voyez une réponse, c'est bon !

## Plus de détails

Voir le fichier `CONFIGURATION_API.md` pour plus d'informations.

