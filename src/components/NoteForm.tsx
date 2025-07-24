import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

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

const NoteForm: React.FC<NoteFormProps> = ({ isOpen, onOpenChange, note, onSuccess }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: '',
  });

  useEffect(() => {
    if (note) {
      setFormData({
        title: note.title,
        content: note.content,
        tags: note.tags ? note.tags.join(', ') : '',
      });
    } else {
      setFormData({
        title: '',
        content: '',
        tags: '',
      });
    }
  }, [note, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    
    const tagsArray = formData.tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    try {
      if (note) {
        // Update existing note
        const { error } = await supabase
          .from('notes')
          .update({
            title: formData.title,
            content: formData.content,
            tags: tagsArray.length > 0 ? tagsArray : null,
          })
          .eq('id', note.id);

        if (error) throw error;
        
        toast({
          title: "Note updated",
          description: "Your note has been updated successfully.",
        });
      } else {
        // Create new note
        const { error } = await supabase
          .from('notes')
          .insert({
            title: formData.title,
            content: formData.content,
            tags: tagsArray.length > 0 ? tagsArray : null,
            user_id: user.id,
          });

        if (error) throw error;
        
        toast({
          title: "Note created",
          description: "Your note has been created successfully.",
        });
      }

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