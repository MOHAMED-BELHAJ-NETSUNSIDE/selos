import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/authStore';
import { api, isOnline } from '@/lib/api';
import { toast } from 'sonner';
import { Plus, FileText, Eye } from 'lucide-react';

interface ReturnInvoice {
  id: number;
  numero: string;
  status: string;
  montantTotal: number | string;
  dateFacture: string;
  bcNumber?: string | null;
  salesperson: {
    id: number;
    firstName: string;
    lastName: string;
    depotName: string;
  };
}

// Helper pour convertir montantTotal en nombre
const parseAmount = (amount: number | string | any): number => {
  if (typeof amount === 'number') return amount;
  if (typeof amount === 'string') return parseFloat(amount) || 0;
  // Si c'est un objet Decimal de Prisma
  if (amount && typeof amount === 'object' && 'toNumber' in amount) {
    return amount.toNumber();
  }
  return 0;
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'cree':
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Créée</Badge>;
    case 'valide':
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Validée</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export function ReturnInvoicesList() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<ReturnInvoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.salespersonId) {
      loadInvoices();
    }
  }, [user?.salespersonId]);

  const loadInvoices = async () => {
    if (!user?.salespersonId) return;

    setLoading(true);
    try {
      if (isOnline()) {
        const response = await api.get('/return-invoices', {
          params: {
            salespersonId: user.salespersonId,
            limit: 50,
          },
        });
        const invoicesData = response.data.data || [];
        // Normaliser les données (convertir montantTotal en nombre)
        const normalizedInvoices = invoicesData.map((inv: any) => ({
          ...inv,
          montantTotal: parseAmount(inv.montantTotal),
        }));
        setInvoices(normalizedInvoices);
      } else {
        toast.info('Mode hors ligne - Liste non disponible');
      }
    } catch (error: any) {
      console.error('Erreur lors du chargement des factures de retour:', error);
      toast.error('Erreur lors du chargement des factures de retour');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pb-20">
      <Header title="Factures de retour" />
      <div className="container mx-auto px-4 py-6 space-y-4">
        <Button asChild className="w-full bg-blue-600 hover:bg-blue-700 text-white" size="lg">
          <Link to="/return-invoices/new">
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle facture de retour
          </Link>
        </Button>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Chargement...
          </div>
        ) : invoices.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucune facture de retour</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {invoices.map((invoice) => (
              <Card
                key={invoice.id}
                className="cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => navigate(`/return-invoices/${invoice.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold">{invoice.numero}</p>
                        {getStatusBadge(invoice.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {new Date(invoice.dateFacture).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                      </p>
                      {invoice.bcNumber && (
                        <p className="text-xs text-muted-foreground mt-1">
                          BC: {invoice.bcNumber}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">
                        {parseAmount(invoice.montantTotal).toFixed(2)} TND
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-end mt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/return-invoices/${invoice.id}`);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Consulter
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

