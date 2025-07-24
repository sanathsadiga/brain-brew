import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { sanitizeText, validateTags } from '@/lib/validation';
import { Loader2 } from 'lucide-react';
import LinkSelector from './LinkSelector';

interface Note {
  id: string;
  title: string;
  content: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

interface NoteFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  note?: Note | null;
  onSuccess: () => void;
}

interface SelectedLink {
  id: string;
  title: string;
  type: 'note' | 'command';
}

const NoteForm: React.FC<NoteFormProps> = ({ isOpen, onOpenChange, note, onSuccess }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: '',
  });
  const [selectedLinks, setSelectedLinks] = useState<SelectedLink[]>([]);

  useEffect(() => {
    if (note) {
      setFormData({
        title: note.title,
        content: note.content,
        tags: note.tags ? note.tags.join(', ') : '',
      });
      loadExistingLinks(note.id);
    } else {
      setFormData({
        title: '',
        content: '',
        tags: '',
      });
      setSelectedLinks([]);
    }
  }, [note, isOpen]);

  const loadExistingLinks = async (noteId: string) => {
    if (!user) return;

    try {
      const { data: links, error } = await supabase
        .from('note_links')
        .select('to_id, to_type')
        .eq('from_id', noteId)
        .eq('from_type', 'note')
        .eq('user_id', user.id);

      if (error) throw error;

      if (links && links.length > 0) {
        // Fetch the actual linked items
        const noteIds = links.filter(link => link.to_type === 'note').map(link => link.to_id);
        const commandIds = links.filter(link => link.to_type === 'command').map(link => link.to_id);

        const loadedLinks: SelectedLink[] = [];

        if (noteIds.length > 0) {
          const { data: notes, error: notesError } = await supabase
            .from('notes')
            .select('id, title')
            .in('id', noteIds)
            .eq('user_id', user.id);

          if (notesError) throw notesError;
          if (notes) {
            loadedLinks.push(...notes.map(note => ({
              id: note.id,
              title: note.title,
              type: 'note' as const,
            })));
          }
        }

        if (commandIds.length > 0) {
          const { data: commands, error: commandsError } = await supabase
            .from('commands')
            .select('id, title')
            .in('id', commandIds)
            .eq('user_id', user.id);

          if (commandsError) throw commandsError;
          if (commands) {
            loadedLinks.push(...commands.map(cmd => ({
              id: cmd.id,
              title: cmd.title,
              type: 'command' as const,
            })));
          }
        }

        setSelectedLinks(loadedLinks);
      }
    } catch (error: any) {
      console.error('Error loading existing links:', error);
    }
  };

  const saveLinks = async (noteId: string) => {
    if (!user) return;

    try {
      // First, delete existing links for this note
      await supabase
        .from('note_links')
        .delete()
        .eq('from_id', noteId)
        .eq('from_type', 'note')
        .eq('user_id', user.id);

      // Then, insert new links
      if (selectedLinks.length > 0) {
        const linksToInsert = selectedLinks.map(link => ({
          user_id: user.id,
          from_id: noteId,
          from_type: 'note',
          to_id: link.id,
          to_type: link.type,
        }));

        const { error } = await supabase
          .from('note_links')
          .insert(linksToInsert);

        if (error) throw error;
      }
    } catch (error: any) {
      console.error('Error saving links:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    
    try {
      // Input validation and sanitization
      if (!formData.title.trim() || !formData.content.trim()) {
        throw new Error('Title and content are required');
      }

      const sanitizedTitle = sanitizeText(formData.title);
      const sanitizedContent = sanitizeText(formData.content);
      
      const tagsArray = validateTags(
        formData.tags
          .split(',')
          .map(tag => tag.trim())
          .filter(tag => tag.length > 0)
      );

      let noteId: string;

      if (note) {
        // Update existing note
        const { error } = await supabase
          .from('notes')
          .update({
            title: sanitizedTitle,
            content: sanitizedContent,
            tags: tagsArray.length > 0 ? tagsArray : null,
          })
          .eq('id', note.id);

        if (error) throw error;
        noteId = note.id;
        
        toast({
          title: "Note updated",
          description: "Your note has been updated successfully.",
        });
      } else {
        // Create new note
        const { data, error } = await supabase
          .from('notes')
          .insert({
            title: sanitizedTitle,
            content: sanitizedContent,
            tags: tagsArray.length > 0 ? tagsArray : null,
            user_id: user.id,
          })
          .select()
          .single();

        if (error) throw error;
        noteId = data.id;
        
        toast({
          title: "Note created",
          description: "Your note has been created successfully.",
        });
      }

      // Save links
      await saveLinks(noteId);

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {note ? 'Edit Note' : 'Add New Note'}
          </DialogTitle>
          <DialogDescription>
            {note ? 'Update your note details and organize with tags.' : 'Create a new note and organize it with tags for easy searching.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Meeting Notes"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="content">Content *</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Write your note content here..."
              rows={8}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="e.g., meeting, project, ideas (comma separated)"
            />
          </div>
          
          <LinkSelector
            currentItemId={note?.id}
            currentItemType="note"
            selectedLinks={selectedLinks}
            onLinksChange={setSelectedLinks}
          />
          
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {note ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NoteForm;