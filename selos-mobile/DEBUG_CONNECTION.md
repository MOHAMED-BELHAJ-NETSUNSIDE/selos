# 🔍 Guide de débogage - Problème de connexion API

## Vérifications à faire

### 1. Vérifier que le fichier .env existe et est correct

```powershell
cd selos-mobile
Get-Content .env
```

Doit afficher :
```
VITE_API_URL=http://192.168.1.66:3001
```

### 2. Vérifier que le backend est démarré

```bash
# Dans le dossier backend
npm run start:dev
```

Le backend doit être accessible sur `http://localhost:3001`

### 3. Tester l'accès depuis votre téléphone

Sur votre téléphone Android, ouvrez un navigateur et allez sur :
```
http://192.168.1.66:3001
```

Si vous voyez une réponse (même une erreur), c'est que le backend est accessible.

### 4. Vérifier que vous avez rebuild après avoir créé/modifié .env

```bash
cd selos-mobile
npm run build
npx cap sync
```

### 5. Vérifier que l'APK a été régénéré

**IMPORTANT** : Après chaque modification du `.env` et rebuild, vous DEVEZ régénérer l'APK dans Android Studio :

1. Ouvrir Android Studio
2. **Build → Clean Project**
3. **Build → Rebuild Project**
4. **Build → Build Bundle(s) / APK(s) → Build APK(s)**

### 6. Vérifier les logs dans l'application

Quand vous ouvrez l'application APK, regardez les logs (si disponibles via `adb logcat` ou les outils de développement) :

Vous devriez voir :
```
🔗 ========== CONFIGURATION API ==========
🔗 API URL configurée: http://192.168.1.66:3001
📱 Plateforme: android
🌐 Est natif: true
🔧 VITE_API_URL depuis env: http://192.168.1.66:3001
🔗 ========================================
```

## Problèmes courants

### Problème 1 : L'APK n'a pas été régénéré

**Symptôme** : Le message d'erreur persiste même après avoir modifié `.env`

**Solution** : Vous DEVEZ régénérer l'APK dans Android Studio après chaque modification

### Problème 2 : Le backend n'est pas accessible depuis le téléphone

**Symptôme** : Erreur réseau dans l'application

**Vérifications** :
- ✅ Téléphone et ordinateur sur le même réseau WiFi
- ✅ Backend démarré sur le port 3001
- ✅ Pare-feu Windows n'bloque pas le port 3001
- ✅ Test dans le navigateur du téléphone : `http://192.168.1.66:3001`

### Problème 3 : Mauvaise IP dans .env

**Symptôme** : L'application essaie de se connecter à une mauvaise IP

**Solution** :
1. Trouvez votre IP avec `ipconfig`
2. Mettez à jour `.env` avec la bonne IP
3. Rebuild : `npm run build && npx cap sync`
4. Régénérez l'APK dans Android Studio

### Problème 4 : Variable d'environnement non incluse dans le build

**Symptôme** : Les logs montrent `VITE_API_URL depuis env: undefined`

**Solution** :
1. Vérifiez que le fichier s'appelle bien `.env` (pas `.env.local` ou autre)
2. Vérifiez que la variable commence par `VITE_`
3. Rebuild : `npm run build`
4. Vérifiez dans `dist/assets/*.js` que l'IP est présente

## Commandes de débogage

### Voir les logs Android en temps réel

```bash
adb logcat | grep -i "selos\|api\|network"
```

### Tester la connexion depuis le téléphone

```bash
# Installer curl sur le téléphone (via Termux) ou utiliser un navigateur
curl http://192.168.1.66:3001
```

### Vérifier que l'IP est dans le build

```powershell
cd selos-mobile
Select-String -Path "dist\assets\*.js" -Pattern "192.168.1.66"
```

## Checklist complète

- [ ] Fichier `.env` existe dans `selos-mobile/`
- [ ] `.env` contient `VITE_API_URL=http://192.168.1.66:3001`
- [ ] Backend démarré sur port 3001
- [ ] Téléphone et ordinateur sur le même WiFi
- [ ] Test réussi : `http://192.168.1.66:3001` depuis le navigateur du téléphone
- [ ] `npm run build` exécuté après modification de `.env`
- [ ] `npx cap sync` exécuté après le build
- [ ] APK régénéré dans Android Studio (Clean → Rebuild → Build APK)
- [ ] Nouvel APK installé sur le téléphone

## Si rien ne fonctionne

1. Vérifiez les logs de l'application (voir section "Vérifier les logs")
2. Testez l'URL directement depuis le navigateur du téléphone
3. Vérifiez que le pare-feu Windows autorise les connexions entrantes sur le port 3001
4. Essayez de désactiver temporairement le pare-feu pour tester
5. Vérifiez que votre routeur WiFi n'isole pas les appareils

