import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Search, Link2, Terminal, FileText, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LinkableItem {
  id: string;
  title: string;
  type: 'note' | 'command';
  content?: string;
  command?: string;
}

interface SelectedLink {
  id: string;
  title: string;
  type: 'note' | 'command';
}

interface LinkSelectorProps {
  currentItemId?: string;
  currentItemType: 'note' | 'command';
  selectedLinks: SelectedLink[];
  onLinksChange: (links: SelectedLink[]) => void;
}

const LinkSelector: React.FC<LinkSelectorProps> = ({
  currentItemId,
  currentItemType,
  selectedLinks,
  onLinksChange,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [availableItems, setAvailableItems] = useState<LinkableItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchAvailableItems();
    }
  }, [user, searchQuery]);

  const fetchAvailableItems = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const [notesResult, commandsResult] = await Promise.all([
        supabase
          .from('notes')
          .select('id, title, content')
          .eq('user_id', user.id)
          .ilike('title', `%${searchQuery}%`)
          .limit(10),
        supabase
          .from('commands')
          .select('id, title, command')
          .eq('user_id', user.id)
          .ilike('title', `%${searchQuery}%`)
          .limit(10),
      ]);

      if (notesResult.error) throw notesResult.error;
      if (commandsResult.error) throw commandsResult.error;

      const notes: LinkableItem[] = (notesResult.data || []).map(note => ({
        id: note.id,
        title: note.title,
        type: 'note' as const,
        content: note.content,
      }));

      const commands: LinkableItem[] = (commandsResult.data || []).map(cmd => ({
        id: cmd.id,
        title: cmd.title,
        type: 'command' as const,
        command: cmd.command,
      }));

      // Filter out current item and already selected items
      const allItems = [...notes, ...commands].filter(item => {
        if (currentItemId && item.id === currentItemId) return false;
        return !selectedLinks.some(selected => selected.id === item.id);
      });

      setAvailableItems(allItems);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error fetching items',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectItem = (item: LinkableItem) => {
    const newLink: SelectedLink = {
      id: item.id,
      title: item.title,
      type: item.type,
    };
    onLinksChange([...selectedLinks, newLink]);
  };

  const handleRemoveLink = (linkId: string) => {
    onLinksChange(selectedLinks.filter(link => link.id !== linkId));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link2 className="h-4 w-4" />
        <label className="text-sm font-medium">Linked Items</label>
      </div>

      {/* Selected Links */}
      {selectedLinks.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Selected links:</p>
          <div className="flex flex-wrap gap-2">
            {selectedLinks.map((link) => (
              <Badge key={link.id} variant="secondary" className="gap-1">
                {link.type === 'note' ? (
                  <FileText className="h-3 w-3" />
                ) : (
                  <Terminal className="h-3 w-3" />
                )}
                {link.title}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 hover:bg-transparent"
                  onClick={() => handleRemoveLink(link.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search notes and commands to link..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Available Items */}
      {searchQuery && (
        <Card>
          <CardContent className="p-2">
            <ScrollArea className="h-40">
              {loading ? (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  Searching...
                </div>
              ) : availableItems.length === 0 ? (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  No items found
                </div>
              ) : (
                <div className="space-y-1">
                  {availableItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer"
                      onClick={() => handleSelectItem(item)}
                    >
                      {item.type === 'note' ? (
                        <FileText className="h-4 w-4 text-blue-500" />
                      ) : (
                        <Terminal className="h-4 w-4 text-green-500" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.title}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {item.type === 'note' ? item.content : item.command}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LinkSelector;