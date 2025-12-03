'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/components/ui/drawer';
import { 
  Search, 
  RefreshCw, 
  Loader2, 
  ChevronLeft, 
  ChevronRight,
  Package,
  History,
  Warehouse,
  TrendingUp,
  User,
} from 'lucide-react';
import { Pill, PillDelta } from '@/components/ui/pill';
import { useStockConsultation, useStockTransactions, type StockConsultationItem } from '@/hooks/use-stock';

export default function StockPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const limit = 10;

  // États pour le drawer des transactions
  const [selectedItem, setSelectedItem] = useState<StockConsultationItem | null>(null);
  const [isTransactionsOpen, setIsTransactionsOpen] = useState(false);
  const [transactionsPage, setTransactionsPage] = useState(1);

  // Récupérer l'ID du vendeur connecté depuis la session
  const currentSalespersonId = session?.user?.salesperson?.id;
  const currentSalespersonName = session?.user?.salesperson 
    ? `${session.user.salesperson.firstName} ${session.user.salesperson.lastName}`.trim()
    : null;

  // Récupérer les données de stock - le backend filtre automatiquement par le vendeur connecté
  const { data: stockData, isLoading, refetch } = useStockConsultation(
    {
      search: search || undefined,
      page,
      limit,
    },
    {
      enabled: !!currentSalespersonId, // Ne pas faire de requête si le vendeur n'est pas défini
    }
  );

  const stockItems = stockData?.data || [];
  const total = stockData?.total || 0;
  const totalPages = Math.ceil(total / limit);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const openTransactions = (item: StockConsultationItem) => {
    setSelectedItem(item);
    setIsTransactionsOpen(true);
    setTransactionsPage(1);
  };

  const closeTransactions = () => {
    setIsTransactionsOpen(false);
    setSelectedItem(null);
    setTransactionsPage(1);
  };

  // Récupérer les transactions pour l'item sélectionné
  const { data: transactionsData, isLoading: isLoadingTransactions } = useStockTransactions(
    {
      productId: selectedItem?.product.id || 0,
      page: transactionsPage,
      limit: 20,
    },
    {
      enabled: !!selectedItem && isTransactionsOpen && !!selectedItem.product.id,
      salespersonId: currentSalespersonId,
    }
  );

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
            <h1 className="text-3xl font-bold">Consultation du stock</h1>
            <p className="text-muted-foreground">Consultez votre stock disponible</p>
          </div>
        </div>
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Vous devez être connecté en tant que vendeur pour voir votre stock</p>
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
          <h1 className="text-3xl font-bold">Consultation du stock</h1>
          <p className="text-muted-foreground">
            {currentSalespersonName 
              ? `Stock disponible pour ${currentSalespersonName}`
              : 'Consultez votre stock disponible'}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Stock disponible</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {/* Barre de recherche */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Rechercher par produit, code item..."
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
          ) : stockItems.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Aucun stock trouvé</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produit</TableHead>
                      <TableHead>Code Item</TableHead>
                      <TableHead>Dépôt</TableHead>
                      <TableHead className="text-right">Quantité</TableHead>
                      <TableHead>Unité</TableHead>
                      <TableHead>Dernière mise à jour</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stockItems.map((item: StockConsultationItem) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.product.bcItem?.displayName || item.product.designation}
                        </TableCell>
                        <TableCell>
                          {item.product.bcItem?.number || item.product.ref || '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Warehouse className="h-4 w-4 text-muted-foreground" />
                            {item.salesperson.depotName}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-semibold text-lg">
                          {item.totalStock.toLocaleString('fr-FR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell>
                          {item.product.bcItem?.baseUnitOfMeasure || '-'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(item.lastUpdated)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openTransactions(item)}
                          >
                            <History className="h-4 w-4 mr-2" />
                            Historique
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

      {/* Drawer des transactions */}
      <Drawer open={isTransactionsOpen} onOpenChange={(open) => {
        setIsTransactionsOpen(open);
        if (!open) {
          closeTransactions();
        }
      }}>
        <DrawerContent 
          side="right" 
          className="h-full flex flex-col"
          style={{ width: '60vw', maxWidth: '60vw' }}
        >
          <DrawerHeader className="border-b pb-4">
            <DrawerTitle className="text-2xl font-bold flex items-center gap-2 mb-4">
              <History className="h-6 w-6" />
              Historique des transactions
            </DrawerTitle>
            {selectedItem && (
              <div className="flex items-start justify-between gap-4 mt-4">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-500">Produit:</span>
                    <span className="text-sm font-semibold">
                      {selectedItem.product.bcItem?.displayName || selectedItem.product.designation}
                      {selectedItem.product.bcItem?.number && (
                        <span className="text-gray-500 ml-2">({selectedItem.product.bcItem.number})</span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-500">Vendeur:</span>
                    <span className="text-sm font-semibold">
                      {selectedItem.salesperson.firstName} {selectedItem.salesperson.lastName}
                      {selectedItem.salesperson.code && (
                        <span className="text-gray-500 ml-2">({selectedItem.salesperson.code})</span>
                      )}
                    </span>
                    {selectedItem.salesperson.depotName && (
                      <>
                        <span className="text-gray-300">|</span>
                        <Warehouse className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-500">{selectedItem.salesperson.depotName}</span>
                      </>
                    )}
                  </div>
                </div>
                <Badge variant="outline" className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-3.5 w-3.5 text-gray-500" />
                    <span className="text-xs text-gray-500">Stock actuel:</span>
                    <span className="text-sm font-bold">
                      {selectedItem.totalStock.toLocaleString('fr-FR', { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 2 
                      })}
                      {selectedItem.product.bcItem?.baseUnitOfMeasure && (
                        <span className="text-gray-500 ml-1 font-normal">
                          {selectedItem.product.bcItem.baseUnitOfMeasure}
                        </span>
                      )}
                    </span>
                  </div>
                </Badge>
              </div>
            )}
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto p-6">
            {isLoadingTransactions ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : transactionsData?.data.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                Aucune transaction trouvée
              </div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Quantité</TableHead>
                        <TableHead>Référence</TableHead>
                        <TableHead>Bon de commande</TableHead>
                        <TableHead>Bon de livraison</TableHead>
                        <TableHead>Facture de retour</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactionsData?.data.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell className="text-sm">
                            {formatDate(transaction.createdAt)}
                          </TableCell>
                          <TableCell>
                            <Pill>
                              <PillDelta delta={transaction.type === 'entree' ? 1 : -1} />
                              {transaction.type === 'entree' ? 'Entrée' : 'Sortie'}
                            </Pill>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {transaction.qte.toLocaleString('fr-FR', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </TableCell>
                          <TableCell>
                            {transaction.reference || '-'}
                          </TableCell>
                          <TableCell>
                            {transaction.purchaseOrder ? (
                              <span className="text-blue-600 font-medium">
                                {transaction.purchaseOrder.numero}
                              </span>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell>
                            {transaction.deliveryNote ? (
                              <span className="text-green-600 font-medium">
                                {transaction.deliveryNote.numero}
                              </span>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell>
                            {transaction.returnInvoice ? (
                              <div className="flex flex-col">
                                <span className="text-purple-600 font-medium">
                                  {transaction.returnInvoice.numero}
                                </span>
                                {transaction.returnInvoice.bcNumber && (
                                  <span className="text-xs text-gray-500">
                                    BC: {transaction.returnInvoice.bcNumber}
                                  </span>
                                )}
                              </div>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination des transactions */}
                {transactionsData && transactionsData.total > 0 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Affichage de {(transactionsPage - 1) * transactionsData.limit + 1} à {Math.min(transactionsPage * transactionsData.limit, transactionsData.total)} sur {transactionsData.total} résultats
                    </div>
                    {Math.ceil(transactionsData.total / transactionsData.limit) > 1 && (
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setTransactionsPage(p => Math.max(1, p - 1))}
                          disabled={transactionsPage === 1 || isLoadingTransactions}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Précédent
                        </Button>
                        <div className="text-sm">
                          Page {transactionsPage} sur {Math.ceil(transactionsData.total / transactionsData.limit)}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setTransactionsPage(p => Math.min(Math.ceil(transactionsData.total / transactionsData.limit), p + 1))}
                          disabled={transactionsPage >= Math.ceil(transactionsData.total / transactionsData.limit) || isLoadingTransactions}
                        >
                          Suivant
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
          <DrawerFooter className="border-t">
            <Button variant="outline" onClick={closeTransactions}>
              Fermer
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

