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
  
  const [commands, setCommands] = useState<Command[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('commands');
  const [commandFormOpen, setCommandFormOpen] = useState(false);
  const [noteFormOpen, setNoteFormOpen] = useState(false);
  const [editingCommand, setEditingCommand] = useState<Command | null>(null);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  // Redirect to auth if not authenticated
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    
    setDataLoading(true);
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
          .order('created_at', { ascending: false })
      ]);

      if (commandsResult.error) throw commandsResult.error;
      if (notesResult.error) throw notesResult.error;

      setCommands(commandsResult.data || []);
      setNotes(notesResult.data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error loading data",
        description: error.message,
      });
    } finally {
      setDataLoading(false);
    }
  };

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        variant: "destructive",
        title: "Error signing out",
        description: error.message,
      });
    }
  };

  const handleDeleteCommand = async (id: string) => {
    try {
      const { error } = await supabase
        .from('commands')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setCommands(commands.filter(cmd => cmd.id !== id));
      toast({
        title: "Command deleted",
        description: "Command has been deleted successfully.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error deleting command",
        description: error.message,
      });
    }
  };

  const handleDeleteNote = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setNotes(notes.filter(note => note.id !== id));
      toast({
        title: "Note deleted",
        description: "Note has been deleted successfully.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error deleting note",
        description: error.message,
      });
    }
  };

  const handleEditCommand = (command: Command) => {
    setEditingCommand(command);
    setCommandFormOpen(true);
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setNoteFormOpen(true);
  };

  const handleFormClose = (type: 'command' | 'note') => {
    if (type === 'command') {
      setCommandFormOpen(false);
      setEditingCommand(null);
    } else {
      setNoteFormOpen(false);
      setEditingNote(null);
    }
  };

  const filteredCommands = commands.filter(command =>
    command.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    command.command.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (command.description && command.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (command.tags && command.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (note.tags && note.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  return (
    <div className="min-h-screen bg-gradient-subtle">
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

      <div className="container mx-auto px-4 py-8">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search commands and notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
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

          <TabsContent value="commands" className="space-y-6">
            <div className="flex justify-center">
              <Button onClick={() => setCommandFormOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Command
              </Button>
            </div>

            {dataLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : filteredCommands.length === 0 ? (
              <div className="text-center py-12">
                <Terminal className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No commands found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery ? 'Try a different search term' : 'Start by adding your first command'}
                </p>
                {!searchQuery && (
                  <Button onClick={() => setCommandFormOpen(true)}>
                    Add Your First Command
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredCommands.map((command) => (
                  <CommandCard
                    key={command.id}
                    command={command}
                    onEdit={handleEditCommand}
                    onDelete={handleDeleteCommand}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="notes" className="space-y-6">
            <div className="flex justify-center">
              <Button onClick={() => setNoteFormOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Note
              </Button>
            </div>

            {dataLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : filteredNotes.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No notes found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery ? 'Try a different search term' : 'Start by adding your first note'}
                </p>
                {!searchQuery && (
                  <Button onClick={() => setNoteFormOpen(true)}>
                    Add Your First Note
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onEdit={handleEditNote}
                    onDelete={handleDeleteNote}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

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
          handleFormClose('command');
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
          handleFormClose('note');
        }}
      />
    </div>
  );
};

export default Index;
