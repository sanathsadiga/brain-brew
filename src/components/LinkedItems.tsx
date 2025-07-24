import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Link2, Terminal, FileText, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useOfflineStorage } from '@/hooks/useOfflineStorage';

interface LinkedItem {
  id: string;
  title: string;
  type: 'note' | 'command';
  content?: string;
  command?: string;
}

interface LinkedItemsProps {
  itemId: string;
  itemType: 'note' | 'command';
  onItemClick?: (item: LinkedItem) => void;
}

const LinkedItems: React.FC<LinkedItemsProps> = ({
  itemId,
  itemType,
  onItemClick,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isOnline } = useOfflineStorage();
  const [linkedItems, setLinkedItems] = useState<LinkedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && itemId && isOnline) {
      fetchLinkedItems();
    } else if (!isOnline) {
      setLinkedItems([]);
      setLoading(false);
    }
  }, [user, itemId, itemType, isOnline]);

  const fetchLinkedItems = async () => {
    if (!user || !itemId) return;
    
    // Don't fetch links when offline
    if (!isOnline) {
      setLinkedItems([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);

    try {
      // Get all links for this item
      const { data: links, error: linksError } = await supabase
        .from('note_links')
        .select('to_id, to_type')
        .eq('from_id', itemId)
        .eq('from_type', itemType)
        .eq('user_id', user.id);

      if (linksError) throw linksError;

      if (!links || links.length === 0) {
        setLinkedItems([]);
        setLoading(false);
        return;
      }

      // Separate note and command IDs
      const noteIds = links.filter(link => link.to_type === 'note').map(link => link.to_id);
      const commandIds = links.filter(link => link.to_type === 'command').map(link => link.to_id);

      // Fetch the actual items
      const items: LinkedItem[] = [];

      // Fetch notes if any
      if (noteIds.length > 0) {
        const { data: notes, error: notesError } = await supabase
          .from('notes')
          .select('id, title, content')
          .in('id', noteIds)
          .eq('user_id', user.id);

        if (notesError) throw notesError;

        items.push(...(notes || []).map((note: any) => ({
          id: note.id,
          title: note.title,
          type: 'note' as const,
          content: note.content,
        })));
      }

      // Fetch commands if any
      if (commandIds.length > 0) {
        const { data: commands, error: commandsError } = await supabase
          .from('commands')
          .select('id, title, command')
          .in('id', commandIds)
          .eq('user_id', user.id);

        if (commandsError) throw commandsError;

        items.push(...(commands || []).map((cmd: any) => ({
          id: cmd.id,
          title: cmd.title,
          type: 'command' as const,
          command: cmd.command,
        })));
      }

      setLinkedItems(items);
    } catch (error: any) {
      console.log('Links unavailable offline');
      setLinkedItems([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-sm text-muted-foreground">
        Loading linked items...
      </div>
    );
  }

  if (linkedItems.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Link2 className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">
          Linked Items ({linkedItems.length})
        </span>
      </div>
      
      <div className="grid gap-2">
        {linkedItems.map((item) => (
          <Card key={item.id} className="bg-muted/30">
            <CardContent className="p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 flex-1 min-w-0">
                  {item.type === 'note' ? (
                    <FileText className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  ) : (
                    <Terminal className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                      {item.type === 'note' 
                        ? item.content 
                        : item.command
                      }
                    </p>
                  </div>
                </div>
                {onItemClick && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-1"
                    onClick={() => onItemClick(item)}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default LinkedItems;