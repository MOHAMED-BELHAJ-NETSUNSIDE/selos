import { useEffect, useState, useCallback } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/appStore';
import { syncPendingBLs, getPendingBLCount } from '@/lib/syncService';
import { onOnline, onOffline } from '@/lib/api';
import { cn } from '@/lib/utils';

export function SyncIndicator() {
  const { isOnline, pendingSyncCount, setOnline, setPendingSyncCount } = useAppStore();
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = useCallback(async () => {
    if (!isOnline || isSyncing) return;

    setIsSyncing(true);
    try {
      await syncPendingBLs();
      const count = await getPendingBLCount();
      setPendingSyncCount(count);
    } catch (error) {
      console.error('Erreur lors de la synchronisation:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing, setPendingSyncCount]);

  useEffect(() => {
    // Vérifier le nombre de BL en attente
    const updatePendingCount = async () => {
      try {
        const count = await getPendingBLCount();
        setPendingSyncCount(count);
      } catch (error) {
        console.warn('Erreur lors de la récupération du nombre de BL en attente:', error);
        setPendingSyncCount(0);
      }
    };
    updatePendingCount();

    // Écouter les changements de connectivité
    const unsubscribeOnline = onOnline(() => {
      setOnline(true);
      updatePendingCount();
      // Synchroniser automatiquement quand on revient en ligne
      handleSync();
    });

    const unsubscribeOffline = onOffline(() => {
      setOnline(false);
    });

    // Vérifier périodiquement le nombre de BL en attente
    const interval = setInterval(updatePendingCount, 30000); // Toutes les 30 secondes

    return () => {
      unsubscribeOnline();
      unsubscribeOffline();
      clearInterval(interval);
    };
  }, [setOnline, setPendingSyncCount, handleSync]);

  return (
    <div className="flex items-center gap-2">
      {!isOnline && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <WifiOff className="h-4 w-4" />
          <span>Hors ligne</span>
        </div>
      )}
      {pendingSyncCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSync}
          disabled={!isOnline || isSyncing}
          className="gap-2"
        >
          <RefreshCw className={cn("h-4 w-4", isSyncing && "animate-spin")} />
          <span className="text-xs">
            {pendingSyncCount} en attente
          </span>
        </Button>
      )}
      {isOnline && pendingSyncCount === 0 && (
        <div className="flex items-center gap-1 text-xs text-green-600">
          <Wifi className="h-4 w-4" />
          <span>En ligne</span>
        </div>
      )}
    </div>
  );
}

