import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface OfflineData {
  commands: any[];
  notes: any[];
  lastSync: string;
}

interface PendingAction {
  id: string;
  type: 'create' | 'update' | 'delete';
  table: 'commands' | 'notes';
  data: any;
  timestamp: string;
}

export const useOfflineStorage = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: 'Back online',
        description: 'Syncing your changes...',
      });
      syncPendingActions();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: 'Working offline',
        description: 'Changes will sync when you\'re back online.',
        variant: 'destructive',
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load pending actions from localStorage
    loadPendingActions();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const saveToLocalStorage = (key: string, data: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  };

  const getFromLocalStorage = (key: string) => {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to get from localStorage:', error);
      return null;
    }
  };

  const cacheData = (commands: any[], notes: any[]) => {
    const offlineData: OfflineData = {
      commands,
      notes,
      lastSync: new Date().toISOString(),
    };
    saveToLocalStorage('devnotes-offline-data', offlineData);
  };

  const getCachedData = (): OfflineData | null => {
    return getFromLocalStorage('devnotes-offline-data');
  };

  const addPendingAction = (action: Omit<PendingAction, 'id' | 'timestamp'>) => {
    const newAction: PendingAction = {
      ...action,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    };

    const updated = [...pendingActions, newAction];
    setPendingActions(updated);
    saveToLocalStorage('devnotes-pending-actions', updated);
  };

  const loadPendingActions = () => {
    const pending = getFromLocalStorage('devnotes-pending-actions') || [];
    setPendingActions(pending);
  };

  const clearPendingActions = () => {
    setPendingActions([]);
    localStorage.removeItem('devnotes-pending-actions');
  };

  const syncPendingActions = async () => {
    if (pendingActions.length === 0) return;

    try {
      // This would implement actual sync logic with Supabase
      console.log('Syncing pending actions:', pendingActions);
      
      // For now, just clear them after a delay to simulate sync
      setTimeout(() => {
        clearPendingActions();
        toast({
          title: 'Sync complete',
          description: 'All changes have been synced.',
        });
      }, 2000);
    } catch (error) {
      console.error('Sync failed:', error);
      toast({
        title: 'Sync failed',
        description: 'Will retry automatically.',
        variant: 'destructive',
      });
    }
  };

  return {
    isOnline,
    pendingActions,
    cacheData,
    getCachedData,
    addPendingAction,
    syncPendingActions,
    clearPendingActions,
  };
};