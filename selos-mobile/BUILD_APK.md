# Guide de génération d'APK pour Selos Mobile

Ce guide explique comment générer un fichier APK Android à partir de l'application Selos Mobile.

## Prérequis

1. **Node.js** (version 18 ou supérieure)
2. **Android Studio** (version Arctic Fox ou supérieure)
3. **Java JDK** (version 11 ou supérieure)
4. **Android SDK** (installé via Android Studio)

## Installation des dépendances

```bash
npm install
```

## Configuration

L'application est déjà configurée avec Capacitor. Le fichier `capacitor.config.ts` contient :
- **App ID**: `com.selos.mobile`
- **App Name**: `Selos Mobile`
- **Web Directory**: `dist`

## Étapes pour générer l'APK

### 1. Build de l'application web

```bash
npm run build
```

Cette commande compile TypeScript et construit l'application dans le dossier `dist/`.

### 2. Synchroniser avec Capacitor

```bash
npm run cap:sync
```

Cette commande copie les fichiers web dans le projet Android natif.

### 3. Ouvrir dans Android Studio

```bash
npm run cap:open android
```

Ou manuellement :
```bash
npx cap open android
```

### 4. Générer l'APK dans Android Studio

#### Option A : APK de Debug (pour les tests)

1. Dans Android Studio, allez dans **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
2. Attendez la fin de la compilation
3. L'APK sera généré dans : `android/app/build/outputs/apk/debug/app-debug.apk`

#### Option B : APK de Release (pour la distribution)

1. **Créer un keystore** (si vous n'en avez pas) :
   ```bash
   keytool -genkey -v -keystore selos-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias selos
   ```

2. **Configurer le keystore dans Android Studio** :
   - Créez un fichier `android/key.properties` :
     ```
     storePassword=votre_mot_de_passe
     keyPassword=votre_mot_de_passe
     keyAlias=selos
     storeFile=../selos-release-key.jks
     ```

3. **Générer l'APK signé** :
   - Dans Android Studio : **Build** → **Generate Signed Bundle / APK**
   - Sélectionnez **APK**
   - Choisissez votre keystore
   - Sélectionnez le variant **release**
   - L'APK sera généré dans : `android/app/build/outputs/apk/release/app-release.apk`

## Commandes utiles

```bash
# Build et synchroniser en une commande
npm run cap:build

# Ouvrir Android Studio
npm run cap:android

# Synchroniser uniquement
npm run cap:sync
```

## Installation de l'APK sur un appareil

### Via ADB (Android Debug Bridge)

```bash
# Activer le mode développeur sur votre appareil Android
# Activer le débogage USB
# Connecter l'appareil via USB

adb install android/app/build/outputs/apk/debug/app-debug.apk
```

### Via fichier

1. Transférez l'APK sur votre appareil Android
2. Ouvrez le fichier APK sur l'appareil
3. Autorisez l'installation depuis des sources inconnues si nécessaire
4. Installez l'application

## Configuration Android

### Permissions

Les permissions sont configurées dans `android/app/src/main/AndroidManifest.xml`. Les permissions par défaut incluent :
- Internet (pour les appels API)
- Network State (pour détecter la connectivité)

### Version de l'application

La version de l'application est définie dans :
- `package.json` (version web)
- `android/app/build.gradle` (version native Android)

Pour mettre à jour la version Android, modifiez `versionCode` et `versionName` dans `android/app/build.gradle`.

## Dépannage

### Erreur : "SDK location not found"
- Ouvrez Android Studio
- Allez dans **File** → **Project Structure** → **SDK Location**
- Vérifiez que le chemin SDK est correct

### Erreur : "Gradle sync failed"
- Dans Android Studio : **File** → **Sync Project with Gradle Files**
- Ou exécutez : `cd android && ./gradlew clean`

### L'application ne se connecte pas à l'API
- Vérifiez que l'URL de l'API dans `.env` est accessible depuis l'appareil
- Pour les tests sur émulateur, utilisez `10.0.2.2` au lieu de `localhost`
- Pour les tests sur appareil physique, utilisez l'IP locale de votre machine

## Notes importantes

- L'APK de debug peut être installé directement pour les tests
- L'APK de release nécessite une signature pour être distribué
- Pour publier sur Google Play Store, vous devez générer un AAB (Android App Bundle) au lieu d'un APK
- La taille de l'APK peut être importante (~20-30 MB) à cause des dépendances React

## Support

Pour plus d'informations sur Capacitor :
- Documentation : https://capacitorjs.com/docs
- Guide Android : https://capacitorjs.com/docs/android

