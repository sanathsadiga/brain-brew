import React from 'react';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useOfflineStorage } from '@/hooks/useOfflineStorage';

const OfflineIndicator = () => {
  const { isOnline, pendingActions } = useOfflineStorage();

  if (isOnline && pendingActions.length === 0) {
    return null; // Don't show anything when online and no pending actions
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      {!isOnline ? (
        <Badge variant="destructive" className="gap-2 animate-pulse">
          <WifiOff className="h-3 w-3" />
          Offline
          {pendingActions.length > 0 && (
            <span className="bg-background text-destructive-foreground px-1 rounded-sm text-xs">
              {pendingActions.length}
            </span>
          )}
        </Badge>
      ) : pendingActions.length > 0 ? (
        <Badge variant="secondary" className="gap-2">
          <Loader2 className="h-3 w-3 animate-spin" />
          Syncing {pendingActions.length} changes
        </Badge>
      ) : (
        <Badge variant="default" className="gap-2">
          <Wifi className="h-3 w-3" />
          Online
        </Badge>
      )}
    </div>
  );
};

export default OfflineIndicator;