'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/components/ui/drawer';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Loader2, 
  ChevronLeft, 
  ChevronRight,
  FileText,
  Eye,
  Hash,
  User,
  Calendar,
  Receipt,
  Package,
  DollarSign,
  Building2,
} from 'lucide-react';
import { usePurchaseInvoices, usePurchaseInvoice, type PurchaseInvoice } from '@/hooks/use-purchase-invoices';

export default function PurchaseInvoicesPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [viewing, setViewing] = useState<PurchaseInvoice | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const limit = 10;

  // Récupérer l'ID du vendeur connecté depuis la session
  const currentSalespersonId = session?.user?.salesperson?.id;
  const currentSalespersonName = session?.user?.salesperson 
    ? `${session.user.salesperson.firstName} ${session.user.salesperson.lastName}`.trim()
    : null;

  const { data: purchaseInvoicesData, isLoading } = usePurchaseInvoices({
    page,
    limit,
    search: search || undefined,
    salespersonId: currentSalespersonId || undefined, // Filtrer automatiquement par le vendeur connecté
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  const { data: invoiceData, isLoading: isLoadingInvoice } = usePurchaseInvoice(viewing?.id || null);

  const purchaseInvoices = purchaseInvoicesData?.data || [];
  const total = purchaseInvoicesData?.pagination?.total || 0;
  const totalPages = purchaseInvoicesData?.pagination?.pages || 1;

  const openView = async (invoice: PurchaseInvoice) => {
    setViewing(invoice);
    setIsViewOpen(true);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'TND',
    }).format(amount);
  };

  const formatNumber = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getSalespersonName = (salesperson: { firstName: string; lastName: string; code?: string | null }) => {
    const fullName = `${salesperson.firstName} ${salesperson.lastName}`.trim();
    return fullName || salesperson.code || 'Vendeur';
  };

  // Afficher un message de chargement si la session est en cours de chargement
  if (sessionStatus === 'loading') {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Afficher un message si le vendeur n'est pas connecté
  if (sessionStatus === 'unauthenticated' || !currentSalespersonId) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Factures d&apos;achat</h1>
            <p className="text-muted-foreground">Consultez les factures d&apos;achat générées automatiquement</p>
          </div>
        </div>
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Vous devez être connecté en tant que vendeur pour voir vos factures d&apos;achat</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Factures d&apos;achat</h1>
          <p className="text-muted-foreground">
            {currentSalespersonName 
              ? `Factures d'achat de ${currentSalespersonName}`
              : "Consultez les factures d'achat générées automatiquement"}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Liste des factures d&apos;achat</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filtres */}
          <div className="mb-4 p-4 bg-muted/30 rounded-lg space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Date du</label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Date au</label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value);
                    setPage(1);
                  }}
                  min={dateFrom || undefined}
                />
              </div>
            </div>
            {(dateFrom || dateTo) && (
              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setDateFrom('');
                    setDateTo('');
                    setPage(1);
                  }}
                >
                  Réinitialiser les filtres
                </Button>
              </div>
            )}
          </div>

          {/* Barre de recherche */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Rechercher par numéro de facture..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : purchaseInvoices.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Aucune facture d&apos;achat trouvée</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Numéro</TableHead>
                      <TableHead>Vendeur</TableHead>
                      <TableHead>Bon de commande</TableHead>
                      <TableHead>Date facture</TableHead>
                      <TableHead className="text-right">Montant total</TableHead>
                      <TableHead>Nb lignes</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchaseInvoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">
                          {invoice.purchaseOrder.bcInvoiceNumber || invoice.numero}
                        </TableCell>
                        <TableCell>{getSalespersonName(invoice.salesperson)}</TableCell>
                        <TableCell>{invoice.purchaseOrder.numero}</TableCell>
                        <TableCell>{formatDate(invoice.dateFacture)}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(Number(invoice.montantTotal))}
                        </TableCell>
                        <TableCell>{invoice.lines.length}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openView(invoice)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Consulter
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Page {page} sur {totalPages} ({total} résultats)
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Précédent
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Suivant
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Drawer de consultation */}
      <Drawer open={isViewOpen} onOpenChange={(open) => {
        setIsViewOpen(open);
        if (!open) {
          setViewing(null);
        }
      }}>
        <DrawerContent
          side="right"
          className="h-full flex flex-col"
          style={{ width: '70vw', maxWidth: '70vw' }}
        >
          <DrawerHeader className="border-b">
            <DrawerTitle className="text-2xl font-bold">Détails de la facture d&apos;achat</DrawerTitle>
          </DrawerHeader>
          {isLoadingInvoice ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Chargement des détails de la facture...</p>
              </div>
            </div>
          ) : invoiceData ? (
            <div className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-6">
                {/* Informations principales */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Informations générales
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground flex items-center gap-1">
                          <Hash className="h-3 w-3" />
                          Numéro facture
                        </Label>
                        <p className="font-semibold text-base">
                          {invoiceData.purchaseOrder.bcInvoiceNumber || invoiceData.numero}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Statut</Label>
                        <div>
                          <Badge variant={invoiceData.status === 'valide' ? 'default' : 'secondary'} className="text-xs">
                            {invoiceData.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground flex items-center gap-1">
                          <User className="h-3 w-3" />
                          Vendeur
                        </Label>
                        <p className="font-medium">{getSalespersonName(invoiceData.salesperson)}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Date facture
                        </Label>
                        <p className="font-medium">{formatDate(invoiceData.dateFacture)}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground flex items-center gap-1">
                          <Package className="h-3 w-3" />
                          Bon de commande
                        </Label>
                        <p className="font-medium">{invoiceData.purchaseOrder.numero}</p>
                      </div>
                      {invoiceData.purchaseOrder.bcNumber && (
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            Numéro BC
                          </Label>
                          <p className="font-medium">{invoiceData.purchaseOrder.bcNumber}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Montants */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Montants
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2 p-4 bg-muted/30 rounded-lg">
                          <Label className="text-xs text-muted-foreground">Montant HT</Label>
                          <p className="font-semibold text-lg">
                            {invoiceData.montantHT ? formatCurrency(Number(invoiceData.montantHT)) : '-'}
                          </p>
                        </div>
                        <div className="space-y-2 p-4 bg-muted/30 rounded-lg">
                          <Label className="text-xs text-muted-foreground">TVA</Label>
                          <p className="font-semibold text-lg">
                            {invoiceData.montantTVA ? formatCurrency(Number(invoiceData.montantTVA)) : '-'}
                          </p>
                        </div>
                        <div className="space-y-2 p-4 bg-primary/10 rounded-lg border-2 border-primary/20">
                          <Label className="text-xs text-muted-foreground">Montant TTC</Label>
                          <p className="font-bold text-xl text-primary">
                            {invoiceData.montantTTC ? formatCurrency(Number(invoiceData.montantTTC)) : formatCurrency(Number(invoiceData.montantTotal))}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Lignes de la facture */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Receipt className="h-5 w-5" />
                        Lignes de la facture
                      </CardTitle>
                      <Badge variant="outline" className="text-xs">
                        {invoiceData.lines.length} ligne{invoiceData.lines.length > 1 ? 's' : ''}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-lg border overflow-hidden">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/50">
                              <TableHead className="font-semibold">Produit</TableHead>
                              <TableHead className="font-semibold text-right">Quantité</TableHead>
                              <TableHead className="font-semibold">Unité</TableHead>
                              <TableHead className="font-semibold text-right">Prix unitaire</TableHead>
                              <TableHead className="font-semibold text-right">Remise %</TableHead>
                              <TableHead className="font-semibold text-right">Montant remise</TableHead>
                              <TableHead className="font-semibold text-right">Montant HT</TableHead>
                              <TableHead className="font-semibold text-right">TVA</TableHead>
                              <TableHead className="font-semibold text-right">Montant TTC</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {invoiceData.lines.map((line, index) => (
                              <TableRow key={line.id} className={index % 2 === 0 ? 'bg-muted/20' : ''}>
                                <TableCell className="font-medium">
                                  {line.product.bcItem?.displayName || line.product.designation}
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                  {Number(line.qte).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </TableCell>
                                <TableCell className="text-sm">
                                  {line.unite || line.product.bcItem?.baseUnitOfMeasure || '-'}
                                </TableCell>
                                <TableCell className="text-right text-sm">
                                  {line.prixUnitaire ? formatNumber(Number(line.prixUnitaire)) : '-'}
                                </TableCell>
                                <TableCell className="text-right text-sm">
                                  {line.discountPercent !== null && line.discountPercent !== undefined
                                    ? `${Number(line.discountPercent).toFixed(2)}%`
                                    : '-'}
                                </TableCell>
                                <TableCell className="text-right text-sm">
                                  {line.discountAmount !== null && line.discountAmount !== undefined
                                    ? formatNumber(Number(line.discountAmount))
                                    : '-'}
                                </TableCell>
                                <TableCell className="text-right text-sm">
                                  {line.amountExcludingTax !== null && line.amountExcludingTax !== undefined
                                    ? formatNumber(Number(line.amountExcludingTax))
                                    : '-'}
                                </TableCell>
                                <TableCell className="text-right text-sm">
                                  {line.totalTaxAmount !== null && line.totalTaxAmount !== undefined
                                    ? formatNumber(Number(line.totalTaxAmount))
                                    : '-'}
                                </TableCell>
                                <TableCell className="text-right font-semibold">
                                  {line.amountIncludingTax !== null && line.amountIncludingTax !== undefined
                                    ? formatNumber(Number(line.amountIncludingTax))
                                    : formatNumber(Number(line.montant))}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-6">
              <div className="text-center py-12">
                <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Aucune donnée disponible</p>
              </div>
            </div>
          )}
          <DrawerFooter className="border-t">
            <Button variant="outline" onClick={() => setIsViewOpen(false)}>
              Fermer
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

