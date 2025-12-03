import axios from 'axios';
import { Capacitor } from '@capacitor/core';

// Détecter automatiquement l'URL de l'API selon l'environnement
const getApiUrl = () => {
  // 1. Priorité : Variable d'environnement (toujours utilisée si définie)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // 2. Si on est sur une plateforme native (Capacitor)
  if (Capacitor.isNativePlatform()) {
    // En production mobile, on doit avoir VITE_API_URL défini
    // Sinon, on essaie de détecter automatiquement
    // Pour émulateur Android : 10.0.2.2 pointe vers localhost de la machine hôte
    // Pour appareil physique : utiliser l'IP locale de votre machine
    const isAndroidEmulator = Capacitor.getPlatform() === 'android' && 
                               window.location.hostname === 'localhost';
    
    if (isAndroidEmulator) {
      // Émulateur Android : utiliser 10.0.2.2 pour accéder à localhost de la machine hôte
      return 'http://10.0.2.2:3001';
    }
    
    // Appareil physique ou autre : nécessite une IP configurée
    // Par défaut, on essaie une IP commune (à configurer dans .env)
    console.warn('⚠️ VITE_API_URL non défini sur plateforme native. Utilisez une IP locale dans .env');
    // Retourner une URL par défaut qui échouera avec un message clair
    return 'http://192.168.1.1:3001'; // IP par défaut - à configurer
  }
  
  // 3. Si on est sur localhost (développement web)
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3001';
  }
  
  // 4. Sinon, utiliser l'IP du serveur (même hostname que l'app, port 3001)
  const hostname = window.location.hostname;
  return `http://${hostname}:3001`;
};

const API_URL = getApiUrl();

// TOUJOURS logger l'URL pour le débogage (surtout sur mobile)
console.log('🔗 ========== CONFIGURATION API ==========');
console.log('🔗 API URL configurée:', API_URL);
console.log('📱 Plateforme:', Capacitor.getPlatform());
console.log('🌐 Est natif:', Capacitor.isNativePlatform());
console.log('🔧 VITE_API_URL depuis env:', import.meta.env.VITE_API_URL);
console.log('🔗 ========================================');

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor pour ajouter le token JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor pour gérer les erreurs
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expiré ou invalide
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    
    // Améliorer les messages d'erreur pour les problèmes de connexion
    if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
      const errorDetails = {
        code: error.code,
        message: error.message,
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        method: error.config?.method,
        platform: Capacitor.getPlatform(),
        isNative: Capacitor.isNativePlatform(),
        response: error.response ? {
          status: error.response.status,
          statusText: error.response.statusText,
        } : 'Pas de réponse',
      };
      console.error('❌ Erreur réseau:', JSON.stringify(errorDetails, null, 2));
      console.error('❌ Détails complets:', error);
    }
    
    return Promise.reject(error);
  }
);

// Fonction pour vérifier la connectivité
export const isOnline = (): boolean => {
  return navigator.onLine;
};

// Fonction pour détecter les changements de connectivité
export const onOnline = (callback: () => void) => {
  window.addEventListener('online', callback);
  return () => window.removeEventListener('online', callback);
};

export const onOffline = (callback: () => void) => {
  window.addEventListener('offline', callback);
  return () => window.removeEventListener('offline', callback);
};

