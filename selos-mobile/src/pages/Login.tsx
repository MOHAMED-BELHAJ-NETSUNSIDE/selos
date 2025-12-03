import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/authStore';
import { api, isOnline } from '@/lib/api';
import { downloadAllPrices } from '@/lib/priceCacheService';
import { toast } from 'sonner';

export function Login() {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login: loginUser } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!isOnline()) {
        // En mode offline, vérifier si les identifiants sont en cache
        const cachedAuth = localStorage.getItem('auth-storage');
        if (cachedAuth) {
          const parsed = JSON.parse(cachedAuth);
          const cachedLogin = parsed.state?.user?.salesperson?.login || parsed.state?.user?.email;
          if (cachedLogin === login) {
            // Utiliser les identifiants en cache
            loginUser(parsed.state.token, parsed.state.user);
            toast.success('Connexion réussie (mode hors ligne)');
            navigate('/dashboard');
            return;
          }
        }
        toast.error('Pas de connexion et identifiants non trouvés en cache');
        return;
      }

      // Connexion en ligne - Utiliser l'endpoint pour les vendeurs
      const response = await api.post('/auth/login-salesperson', {
        login,
        password,
      });

      const { access_token, user } = response.data;
      
      // S'assurer que salespersonId est disponible
      const userWithSalespersonId = {
        ...user,
        salespersonId: user.salesperson?.id || user.salespersonId,
      };
      
      loginUser(access_token, userWithSalespersonId);
      
      // Télécharger les prix en arrière-plan (ne pas bloquer la connexion)
      const salespersonId = userWithSalespersonId.salespersonId;
      if (salespersonId) {
        console.log('Début du téléchargement des prix en arrière-plan...');
        // Lancer le téléchargement de manière asynchrone sans bloquer
        downloadAllPrices(salespersonId)
          .then(() => {
            console.log('Prix téléchargés avec succès');
            // Le toast est déjà affiché dans downloadAllPrices
          })
          .catch((error: any) => {
            console.error('Erreur lors du téléchargement des prix:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Erreur inconnue';
            console.error('Détails de l\'erreur:', errorMessage);
            // Ne pas afficher de toast d'erreur ici car downloadAllPrices le fait déjà
            // Ne pas bloquer la connexion si le téléchargement échoue
          });
      }
      
      toast.success('Connexion réussie');
      navigate('/dashboard');
    } catch (error: any) {
      // Log détaillé de l'erreur
      const errorDetails = {
        code: error.code,
        message: error.message,
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        method: error.config?.method,
        response: error.response ? {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
        } : null,
      };
      console.error('❌ Erreur de connexion:', JSON.stringify(errorDetails, null, 2));
      console.error('❌ Erreur complète:', error);
      
      // Gestion détaillée des erreurs
      if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        const apiUrl = error.config?.baseURL || 'URL non définie';
        const fullUrl = error.config?.url ? `${apiUrl}${error.config.url}` : apiUrl;
        console.error('❌ Erreur de connexion réseau - URL complète:', fullUrl);
        console.error('❌ Message:', error.message);
        console.error('❌ Code:', error.code);
        toast.error(`Impossible de se connecter au serveur (${apiUrl}). Vérifiez que le backend est démarré et que l'IP est correcte.`);
      } else if (error.response?.status === 401) {
        toast.error('Login ou mot de passe incorrect');
      } else if (error.response?.status === 404) {
        toast.error('Endpoint non trouvé. Vérifiez la configuration de l\'API.');
      } else if (error.response?.status === 0) {
        toast.error('Erreur CORS. Vérifiez la configuration du backend.');
      } else {
        const errorMessage = error.response?.data?.message || error.message || 'Erreur lors de la connexion';
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background p-5">
      <Card className="w-full max-w-md border-2 shadow-minimal-lg">
        <CardHeader className="space-y-2 pb-6">
          <CardTitle className="text-3xl font-bold text-center tracking-tight">
            Selos Mobile
          </CardTitle>
          <CardDescription className="text-center text-base">
            Connectez-vous avec votre compte Salesperson
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2.5">
              <Label htmlFor="login" className="text-sm font-medium">Login</Label>
              <Input
                id="login"
                type="text"
                placeholder="votre.login"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                required
                disabled={loading}
                className="h-12 rounded-xl border-2"
              />
            </div>
            <div className="space-y-2.5">
              <Label htmlFor="password" className="text-sm font-medium">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="h-12 rounded-xl border-2"
              />
            </div>
            <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={loading}>
              {loading ? 'Connexion...' : 'Se connecter'}
            </Button>
            {!isOnline() && (
              <p className="text-xs text-center text-muted-foreground pt-2">
                Mode hors ligne - Connexion avec identifiants en cache uniquement
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

