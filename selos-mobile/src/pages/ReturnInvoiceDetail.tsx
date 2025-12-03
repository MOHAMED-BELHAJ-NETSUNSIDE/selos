import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api, isOnline } from '@/lib/api';
import { toast } from 'sonner';
import { ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';

interface ReturnInvoiceLine {
  id: number;
  productId: number;
  qte: number;
  prixUnitaire: number | null;
  montant: number;
  product: {
    id: number;
    designation: string;
    ref: string | null;
    bcItem?: {
      id: number;
      number: string | null;
      displayName: string | null;
    } | null;
  };
}

interface ReturnInvoice {
  id: number;
  numero: string;
  status: string;
  dateFacture: string;
  montantTotal: number | string;
  montantHT?: number | null;
  montantTTC?: number | null;
  montantTVA?: number | null;
  bcId?: string | null;
  bcNumber?: string | null;
  bcSyncError?: string | null;
  salesperson: {
    id: number;
    firstName: string;
    lastName: string;
    depotName: string;
  };
  purchaseOrder?: {
    id: number;
    numero: string;
  } | null;
  lines: ReturnInvoiceLine[];
}

const parseAmount = (amount: number | string | any): number => {
  if (typeof amount === 'number') return amount;
  if (typeof amount === 'string') return parseFloat(amount) || 0;
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

export function ReturnInvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<ReturnInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);

  useEffect(() => {
    if (id) {
      loadInvoice();
    }
  }, [id]);

  const loadInvoice = async () => {
    if (!id) return;

    setLoading(true);
    try {
      if (isOnline()) {
        const response = await api.get(`/return-invoices/${id}`);
        const invoiceData = response.data;
        // Normaliser les montants
        const normalizedInvoice = {
          ...invoiceData,
          montantTotal: parseAmount(invoiceData.montantTotal),
          montantHT: invoiceData.montantHT ? parseAmount(invoiceData.montantHT) : null,
          montantTTC: invoiceData.montantTTC ? parseAmount(invoiceData.montantTTC) : null,
          montantTVA: invoiceData.montantTVA ? parseAmount(invoiceData.montantTVA) : null,
        };
        setInvoice(normalizedInvoice);
      } else {
        toast.error('Mode hors ligne - Détails non disponibles');
        navigate('/return-invoices');
      }
    } catch (error: any) {
      console.error('Erreur lors du chargement de la facture:', error);
      toast.error('Erreur lors du chargement de la facture de retour');
      navigate('/return-invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async () => {
    if (!id || !invoice) return;

    if (!isOnline()) {
      toast.error('Mode hors ligne - Impossible de valider');
      return;
    }

    if (invoice.status !== 'cree') {
      toast.error('Seules les factures avec le statut "Créée" peuvent être validées');
      return;
    }

    setValidating(true);
    try {
      await api.patch(`/return-invoices/${id}/validate`, {});
      toast.success('Facture de retour validée avec succès');
      // Recharger la facture pour voir les mises à jour
      await loadInvoice();
    } catch (error: any) {
      console.error('Erreur lors de la validation:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la validation');
    } finally {
      setValidating(false);
    }
  };

  if (loading) {
    return (
      <div className="pb-20">
        <Header title="Facture de retour" />
        <div className="container mx-auto px-4 py-6">
          <div className="text-center py-8 text-muted-foreground">
            Chargement...
          </div>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="pb-20">
        <Header title="Facture de retour" />
        <div className="container mx-auto px-4 py-6">
          <div className="text-center py-8 text-muted-foreground">
            Facture de retour non trouvée
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24 min-h-screen bg-background">
      <Header title="Facture de retour" />
      <div className="container mx-auto px-4 py-6 space-y-4">
        {/* Header Info */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="text-xl font-bold">{invoice.numero}</h2>
                  {getStatusBadge(invoice.status)}
                </div>
                <p className="text-sm text-muted-foreground">
                  Date: {new Date(invoice.dateFacture).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })}
                </p>
                {invoice.bcNumber && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Numéro BC: {invoice.bcNumber}
                  </p>
                )}
                {invoice.bcSyncError && (
                  <p className="text-sm text-red-600 mt-1">
                    Erreur BC: {invoice.bcSyncError}
                  </p>
                )}
              </div>
            </div>
            {invoice.purchaseOrder && (
              <div className="pt-3 border-t">
                <p className="text-sm text-muted-foreground">
                  Bon de commande: {invoice.purchaseOrder.numero}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lines */}
        <Card>
          <CardHeader>
            <CardTitle>Produits</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {invoice.lines.map((line) => (
                <div key={line.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-semibold">{line.product.designation}</p>
                      {line.product.ref && (
                        <p className="text-xs text-muted-foreground">Ref: {line.product.ref}</p>
                      )}
                      {line.product.bcItem?.number && (
                        <p className="text-xs text-muted-foreground">BC: {line.product.bcItem.number}</p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Qté</p>
                      <p className="font-semibold">{line.qte}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Prix unit.</p>
                      <p className="font-semibold">
                        {line.prixUnitaire ? line.prixUnitaire.toFixed(2) : '0.00'} TND
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-muted-foreground">Total</p>
                      <p className="font-semibold">
                        {parseAmount(line.montant).toFixed(2)} TND
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Totals */}
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total</span>
              <span className="font-bold text-lg">
                {parseAmount(invoice.montantTotal).toFixed(2)} TND
              </span>
            </div>
            {invoice.montantHT && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">HT</span>
                <span>{parseAmount(invoice.montantHT).toFixed(2)} TND</span>
              </div>
            )}
            {invoice.montantTVA && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">TVA</span>
                <span>{parseAmount(invoice.montantTVA).toFixed(2)} TND</span>
              </div>
            )}
            {invoice.montantTTC && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">TTC</span>
                <span>{parseAmount(invoice.montantTTC).toFixed(2)} TND</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        {invoice.status === 'cree' && (
          <Button
            className="w-full"
            size="lg"
            onClick={handleValidate}
            disabled={validating || !isOnline()}
          >
            {validating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Validation en cours...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Valider la facture de retour
              </>
            )}
          </Button>
        )}

        <Button
          variant="outline"
          className="w-full"
          onClick={() => navigate('/return-invoices')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour à la liste
        </Button>
      </div>
    </div>
  );
}

