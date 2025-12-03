# ⚠️ IMPORTANT : Régénérer l'APK après modification

## Le problème

Vous avez modifié le fichier `.env` et fait un `npm run build`, **MAIS** l'APK que vous utilisez a été généré AVANT ces modifications.

## Solution : Régénérer l'APK dans Android Studio

### Étapes obligatoires :

1. **Ouvrir Android Studio**
   ```bash
   cd selos-mobile
   npm run cap:android
   ```
   Ou ouvrez manuellement le dossier `selos-mobile/android/` dans Android Studio

2. **Nettoyer le projet**
   - Dans Android Studio : **Build → Clean Project**
   - Attendez que ce soit terminé

3. **Reconstruire le projet**
   - Dans Android Studio : **Build → Rebuild Project**
   - Attendez que ce soit terminé

4. **Générer le nouvel APK**
   - Dans Android Studio : **Build → Build Bundle(s) / APK(s) → Build APK(s)**
   - Choisissez **debug** pour les tests
   - Attendez la fin de la compilation

5. **Installer le nouvel APK**
   - Le fichier sera dans : `android/app/build/outputs/apk/debug/app-debug.apk`
   - Transférez-le sur votre téléphone et installez-le
   - **OU** utilisez Android Studio pour l'installer directement : **Run → Run 'app'**

## Vérification

Après avoir installé le nouvel APK, ouvrez l'application et regardez les logs (si disponibles). Vous devriez voir :

```
🔗 ========== CONFIGURATION API ==========
🔗 API URL configurée: http://192.168.1.66:3001
📱 Plateforme: android
🌐 Est natif: true
🔧 VITE_API_URL depuis env: http://192.168.1.66:3001
🔗 ========================================
```

## ⚠️ Règle importante

**À CHAQUE FOIS que vous modifiez `.env` :**
1. ✅ `npm run build`
2. ✅ `npx cap sync`
3. ✅ **Régénérer l'APK dans Android Studio** (Clean → Rebuild → Build APK)
4. ✅ Installer le nouvel APK sur votre téléphone

## Si ça ne fonctionne toujours pas

Voir le fichier `DEBUG_CONNECTION.md` pour plus de détails.

