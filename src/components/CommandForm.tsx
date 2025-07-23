import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface Command {
  id: string;
  title: string;
  command: string;
  description?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

interface CommandFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  command?: Command | null;
  onSuccess: () => void;
}

const CommandForm: React.FC<CommandFormProps> = ({ isOpen, onOpenChange, command, onSuccess }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    command: '',
    description: '',
    tags: '',
  });

  useEffect(() => {
    if (command) {
      setFormData({
        title: command.title,
        command: command.command,
        description: command.description || '',
        tags: command.tags ? command.tags.join(', ') : '',
      });
    } else {
      setFormData({
        title: '',
        command: '',
        description: '',
        tags: '',
      });
    }
  }, [command, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    
    const tagsArray = formData.tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    try {
      if (command) {
        // Update existing command
        const { error } = await supabase
          .from('commands')
          .update({
            title: formData.title,
            command: formData.command,
            description: formData.description || null,
            tags: tagsArray.length > 0 ? tagsArray : null,
          })
          .eq('id', command.id);

        if (error) throw error;
        
        toast({
          title: "Command updated",
          description: "Your command has been updated successfully.",
        });
      } else {
        // Create new command
        const { error } = await supabase
          .from('commands')
          .insert({
            title: formData.title,
            command: formData.command,
            description: formData.description || null,
            tags: tagsArray.length > 0 ? tagsArray : null,
            user_id: user.id,
          });

        if (error) throw error;
        
        toast({
          title: "Command created",
          description: "Your command has been created successfully.",
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {command ? 'Edit Command' : 'Add New Command'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., List files in directory"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="command">Command *</Label>
            <Input
              id="command"
              value={formData.command}
              onChange={(e) => setFormData({ ...formData, command: e.target.value })}
              placeholder="e.g., ls -la"
              required
              className="font-mono"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional description of what this command does"
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="e.g., linux, files, directory (comma separated)"
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {command ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CommandForm;