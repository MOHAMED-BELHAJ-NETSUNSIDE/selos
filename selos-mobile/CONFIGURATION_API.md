# Configuration de l'URL de l'API pour l'APK Android

## Problème

Quand vous utilisez l'APK sur un appareil Android, l'application ne peut pas se connecter au backend si l'URL n'est pas correctement configurée.

## Solution

Vous devez créer un fichier `.env` dans le dossier `selos-mobile/` avec l'URL de votre backend.

## Étapes

### 1. Trouver l'IP locale de votre machine

#### Sur Windows :
```bash
ipconfig
```
Cherchez la ligne **"IPv4 Address"** sous votre connexion réseau active (WiFi ou Ethernet).

Exemple : `192.168.1.66`

#### Sur Linux/Mac :
```bash
ifconfig
# ou
ip addr
```
Cherchez l'adresse IP de votre interface réseau (wlan0, eth0, etc.).

### 2. Vérifier que le backend est accessible

Assurez-vous que votre backend est démarré et écoute sur le port 3001 :

```bash
# Dans le dossier backend
npm run start:dev
```

Testez l'accès depuis votre navigateur :
```
http://VOTRE_IP:3001
```

### 3. Créer le fichier .env

Créez un fichier `.env` dans `selos-mobile/` :

```bash
cd selos-mobile
copy env.example .env
```

Puis éditez `.env` et remplacez l'IP :

```env
VITE_API_URL=http://192.168.1.66:3001
```

**Remplacez `192.168.1.66` par votre IP locale !**

### 4. Rebuild l'application

Après avoir modifié `.env`, vous devez rebuilder :

```bash
npm run build
npx cap sync
```

### 5. Régénérer l'APK

Dans Android Studio :
- Build → Clean Project
- Build → Rebuild Project
- Build → Build Bundle(s) / APK(s) → Build APK(s)

## Cas particuliers

### Émulateur Android

Si vous testez sur un émulateur Android, l'application détecte automatiquement et utilise `http://10.0.2.2:3001` (qui pointe vers localhost de votre machine).

### Appareil physique sur le même WiFi

1. Votre ordinateur et votre téléphone doivent être sur le **même réseau WiFi**
2. Utilisez l'IP locale de votre ordinateur (pas localhost)
3. Vérifiez que le pare-feu Windows/autorise les connexions sur le port 3001

### Serveur de production

Si votre backend est hébergé sur un serveur :

```env
VITE_API_URL=https://api.votre-domaine.com
```

## Vérification

Pour vérifier que la configuration est correcte :

1. Ouvrez l'application APK
2. Ouvrez les outils de développement (si disponibles) ou regardez les logs
3. Vous devriez voir dans la console : `🔗 API URL configurée: http://...`

## Dépannage

### Erreur : "Vérifier que le backend est démarré"

1. ✅ Vérifiez que le backend tourne sur votre machine
2. ✅ Vérifiez que l'IP dans `.env` est correcte
3. ✅ Vérifiez que vous avez rebuild après avoir modifié `.env`
4. ✅ Vérifiez que votre téléphone et votre ordinateur sont sur le même réseau
5. ✅ Testez l'URL dans un navigateur sur votre téléphone : `http://VOTRE_IP:3001`

### Erreur : "Network Error"

- Vérifiez votre connexion WiFi
- Vérifiez que le pare-feu n'bloque pas le port 3001
- Essayez de ping votre IP depuis le téléphone

### L'application fonctionne en web mais pas en APK

- Assurez-vous d'avoir créé le fichier `.env` (pas seulement `env.example`)
- Assurez-vous d'avoir rebuild après avoir modifié `.env`
- Vérifiez que `VITE_API_URL` est bien défini dans `.env`

## Exemple de configuration

```env
# Pour développement local (navigateur)
# VITE_API_URL=http://localhost:3001

# Pour APK sur appareil physique
VITE_API_URL=http://192.168.1.66:3001

# Pour serveur de production
# VITE_API_URL=https://api.selos.com
```

