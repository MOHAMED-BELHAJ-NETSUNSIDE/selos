import axios from 'axios';
import { getSession } from 'next-auth/react';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(async (config) => {
  // Only use getSession() on client side
  if (typeof window !== 'undefined') {
    try {
      const session = await getSession();
      if (session?.user?.accessToken) {
        config.headers.Authorization = `Bearer ${session.user.accessToken}`;
        // Debug: vérifier que le token est bien ajouté
        console.log('Token added to request:', config.url, !!config.headers.Authorization);
      } else {
        console.warn('No access token found in session', { 
          hasSession: !!session, 
          hasUser: !!session?.user,
          hasAccessToken: !!session?.user?.accessToken 
        });
      }
    } catch (error) {
      // Ignore session errors on server side
      console.warn('Session error in interceptor:', error);
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access only on client side
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/signin';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

