import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Search, Plus, Terminal, FileText, LogOut, Loader2 } from 'lucide-react';
import CommandCard from '@/components/CommandCard';
import NoteCard from '@/components/NoteCard';
import CommandForm from '@/components/CommandForm';
import NoteForm from '@/components/NoteForm';
import OfflineIndicator from '@/components/OfflineIndicator';
import { useOfflineStorage } from '@/hooks/useOfflineStorage';

interface Command {
  id: string;
  title: string;
  command: string;
  description?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

interface Note {
  id: string;
  title: string;
  content: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

const Index = () => {
  const { user, signOut, loading } = useAuth();
  const { toast } = useToast();
  const { isOnline, cacheData, getCachedData, addPendingAction } = useOfflineStorage();

  const [commands, setCommands] = useState<Command[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('commands');
  const [commandFormOpen, setCommandFormOpen] = useState(false);
  const [noteFormOpen, setNoteFormOpen] = useState(false);
  const [editingCommand, setEditingCommand] = useState<Command | null>(null);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  // Always call hooks before any return
  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setDataLoading(true);
    
    // Try to load from cache first if offline
    if (!isOnline) {
      const cachedData = getCachedData();
      if (cachedData) {
        setCommands(cachedData.commands || []);
        setNotes(cachedData.notes || []);
        setDataLoading(false);
        toast({
          title: 'Loaded from cache',
          description: `Last synced: ${new Date(cachedData.lastSync).toLocaleString()}`,
        });
        return;
      }
    }

    try {
      const [commandsResult, notesResult] = await Promise.all([
        supabase
          .from('commands')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('notes')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
      ]);

      if (commandsResult.error) throw commandsResult.error;
      if (notesResult.error) throw notesResult.error;

      const commandsData = commandsResult.data || [];
      const notesData = notesResult.data || [];

      setCommands(commandsData);
      setNotes(notesData);
      
      // Cache the data for offline use
      cacheData(commandsData, notesData);
    } catch (error: any) {
      // If network fails, try to load from cache
      const cachedData = getCachedData();
      if (cachedData) {
        setCommands(cachedData.commands || []);
        setNotes(cachedData.notes || []);
        toast({
          title: 'Loaded from cache',
          description: 'Using offline data. Will sync when online.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Error loading data',
          description: error.message,
        });
      }
    } finally {
      setDataLoading(false);
    }
  };

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error signing out',
        description: error.message,
      });
    }
  };

  const handleDelete = async (id: string, type: 'commands' | 'notes') => {
    // Optimistically update UI
    if (type === 'commands') setCommands(commands.filter((c) => c.id !== id));
    else setNotes(notes.filter((n) => n.id !== id));

    try {
      if (isOnline) {
        const { error } = await supabase.from(type).delete().eq('id', id);
        if (error) throw error;
      } else {
        // Store for later sync
        addPendingAction({
          type: 'delete',
          table: type,
          data: { id }
        });
      }

      toast({
        title: `${type === 'commands' ? 'Command' : 'Note'} deleted`,
        description: isOnline ? 'Deleted successfully.' : 'Will sync when online.',
      });
    } catch (error: any) {
      // Revert optimistic update
      fetchData();
      toast({
        variant: 'destructive',
        title: `Error deleting ${type === 'commands' ? 'command' : 'note'}`,
        description: error.message,
      });
    }
  };

  const filteredCommands = commands.filter(
    (command) =>
      command.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      command.command.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (command.description &&
        command.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (command.tags &&
        command.tags.some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        ))
  );

  const filteredNotes = notes.filter(
    (note) =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (note.tags &&
        note.tags.some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        ))
  );

  // Conditional returns AFTER hooks
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <OfflineIndicator />
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">DevNotes</h1>
          </div>
          <Button variant="ghost" onClick={handleSignOut} className="gap-2">
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Search Bar */}
        <div className="mb-8 max-w-md mx-auto relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search commands and notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-center mb-8">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="commands" className="gap-2">
                <Terminal className="h-4 w-4" />
                Commands ({filteredCommands.length})
              </TabsTrigger>
              <TabsTrigger value="notes" className="gap-2">
                <FileText className="h-4 w-4" />
                Notes ({filteredNotes.length})
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Commands Tab */}
          <TabsContent value="commands" className="space-y-6">
            <TabContent
              type="command"
              dataLoading={dataLoading}
              items={filteredCommands}
              openForm={() => setCommandFormOpen(true)}
              onEdit={(command) => {
                setEditingCommand(command);
                setCommandFormOpen(true);
              }}
              onDelete={(id) => handleDelete(id, 'commands')}
            />
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value="notes" className="space-y-6">
            <TabContent
              type="note"
              dataLoading={dataLoading}
              items={filteredNotes}
              openForm={() => setNoteFormOpen(true)}
              onEdit={(note) => {
                setEditingNote(note);
                setNoteFormOpen(true);
              }}
              onDelete={(id) => handleDelete(id, 'notes')}
            />
          </TabsContent>
        </Tabs>
      </main>

      {/* Forms */}
      <CommandForm
        isOpen={commandFormOpen}
        onOpenChange={(open) => {
          setCommandFormOpen(open);
          if (!open) setEditingCommand(null);
        }}
        command={editingCommand}
        onSuccess={() => {
          fetchData();
          setCommandFormOpen(false);
          setEditingCommand(null);
        }}
      />

      <NoteForm
        isOpen={noteFormOpen}
        onOpenChange={(open) => {
          setNoteFormOpen(open);
          if (!open) setEditingNote(null);
        }}
        note={editingNote}
        onSuccess={() => {
          fetchData();
          setNoteFormOpen(false);
          setEditingNote(null);
        }}
      />
    </div>
  );
};

// Reusable TabContent Component
const TabContent = ({
  type,
  dataLoading,
  items,
  openForm,
  onEdit,
  onDelete,
}: {
  type: 'command' | 'note';
  dataLoading: boolean;
  items: any[];
  openForm: () => void;
  onEdit: (item: any) => void;
  onDelete: (id: string) => void;
}) => {
  const EmptyIcon = type === 'command' ? Terminal : FileText;
  const label = type === 'command' ? 'Command' : 'Note';

  return (
    <>
      <div className="flex justify-center">
        <Button onClick={openForm} className="gap-2">
          <Plus className="h-4 w-4" />
          Add {label}
        </Button>
      </div>

      {dataLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12">
          <EmptyIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No {label.toLowerCase()}s found</h3>
          <p className="text-muted-foreground mb-4">
            Start by adding your first {label.toLowerCase()}
          </p>
          <Button onClick={openForm}>Add Your First {label}</Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            type === 'command' ? (
              <CommandCard key={item.id} command={item} onEdit={onEdit} onDelete={onDelete} />
            ) : (
              <NoteCard key={item.id} note={item} onEdit={onEdit} onDelete={onDelete} />
            )
          ))}
        </div>
      )}
    </>
  );
};

export default Index;
