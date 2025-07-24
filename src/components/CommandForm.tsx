import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useOfflineStorage } from '@/hooks/useOfflineStorage';
import { sanitizeText, sanitizeCommand, validateTags } from '@/lib/validation';
import { Loader2, Sparkles, AlertTriangle, CheckCircle, X } from 'lucide-react';

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

interface AIAnalysis {
  suggestedTags: string[];
  category: string;
  improvements: string[];
  security_warnings?: string[];
  description?: string;
}

const CommandForm: React.FC<CommandFormProps> = ({ isOpen, onOpenChange, command, onSuccess }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isOnline, addPendingAction } = useOfflineStorage();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    command: '',
    description: '',
    tags: '',
  });
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [showAiSuggestions, setShowAiSuggestions] = useState(false);

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

  const analyzeCommand = async () => {
    if (!formData.command.trim()) {
      toast({
        variant: 'destructive',
        title: 'No command to analyze',
        description: 'Please enter a command first.',
      });
      return;
    }

    setAiLoading(true);
    try {
      const response = await supabase.functions.invoke('ai-assistant', {
        body: {
          command: formData.command,
          title: formData.title,
          description: formData.description,
          action: 'analyze'
        }
      });

      if (response.error) throw response.error;
      
      setAiAnalysis(response.data);
      setShowAiSuggestions(true);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'AI Analysis Failed',
        description: error.message || 'Could not analyze command.',
      });
    } finally {
      setAiLoading(false);
    }
  };

  const applySuggestion = (type: 'tags' | 'description', value: string | string[]) => {
    if (type === 'tags' && Array.isArray(value)) {
      const currentTags = formData.tags.split(',').map(t => t.trim()).filter(Boolean);
      const newTags = [...new Set([...currentTags, ...value])];
      setFormData({ ...formData, tags: newTags.join(', ') });
    } else if (type === 'description' && typeof value === 'string') {
      setFormData({ ...formData, description: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    
    try {
      // Input validation and sanitization
      if (!formData.title.trim() || !formData.command.trim()) {
        throw new Error('Title and command are required');
      }

      const sanitizedTitle = sanitizeText(formData.title);
      const sanitizedCommand = sanitizeCommand(formData.command);
      const sanitizedDescription = sanitizeText(formData.description);
      
      const tagsArray = validateTags(
        formData.tags
          .split(',')
          .map(tag => tag.trim())
          .filter(tag => tag.length > 0)
      );

      const commandData = {
        title: sanitizedTitle,
        command: sanitizedCommand,
        description: sanitizedDescription || null,
        tags: tagsArray.length > 0 ? tagsArray : null,
        user_id: user.id,
      };

      if (isOnline) {
        if (command) {
          // Update existing command
          const { error } = await supabase
            .from('commands')
            .update(commandData)
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
            .insert(commandData);

          if (error) throw error;
          
          toast({
            title: "Command created",
            description: "Your command has been created successfully.",
          });
        }
      } else {
        // Store for later sync when offline
        if (command) {
          addPendingAction({
            type: 'update',
            table: 'commands',
            data: { id: command.id, ...commandData }
          });
          
          toast({
            title: "Command updated offline",
            description: "Changes will sync when you're back online.",
          });
        } else {
          addPendingAction({
            type: 'create',
            table: 'commands',
            data: { ...commandData, id: crypto.randomUUID() }
          });
          
          toast({
            title: "Command created offline",
            description: "Will sync when you're back online.",
          });
        }
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
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {command ? 'Edit Command' : 'Add New Command'}
          </DialogTitle>
          <DialogDescription>
            {command ? 'Update your command details and use AI analysis for suggestions.' : 'Create a new command and get AI-powered suggestions for tags, descriptions, and improvements.'}
          </DialogDescription>
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
            <div className="flex items-center justify-between">
              <Label htmlFor="command">Command *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={analyzeCommand}
                disabled={aiLoading || !formData.command.trim()}
                className="gap-2"
              >
                {aiLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                AI Analyze
              </Button>
            </div>
            <Textarea
              id="command"
              value={formData.command}
              onChange={(e) => setFormData({ ...formData, command: e.target.value })}
              placeholder="e.g., ls -la"
              required
              className="font-mono"
              rows={3}
            />
          </div>

          {/* AI Suggestions */}
          {showAiSuggestions && aiAnalysis && (
            <Card className="border-primary/20">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    AI Suggestions
                  </CardTitle>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAiSuggestions(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Security Warnings */}
                {aiAnalysis.security_warnings && aiAnalysis.security_warnings.length > 0 && (
                  <div className="p-3 border border-destructive/20 bg-destructive/5 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      <span className="text-sm font-medium text-destructive">Security Warnings</span>
                    </div>
                    <ul className="text-sm space-y-1">
                      {aiAnalysis.security_warnings.map((warning, i) => (
                        <li key={i} className="text-muted-foreground">• {warning}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Suggested Tags */}
                {aiAnalysis.suggestedTags && aiAnalysis.suggestedTags.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Suggested Tags</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => applySuggestion('tags', aiAnalysis.suggestedTags)}
                      >
                        Apply All
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {aiAnalysis.suggestedTags.map((tag, i) => (
                        <Badge 
                          key={i} 
                          variant="outline" 
                          className="cursor-pointer hover:bg-primary/10"
                          onClick={() => applySuggestion('tags', [tag])}
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggested Description */}
                {aiAnalysis.description && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Suggested Description</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => applySuggestion('description', aiAnalysis.description!)}
                      >
                        Apply
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
                      {aiAnalysis.description}
                    </p>
                  </div>
                )}

                {/* Improvements */}
                {aiAnalysis.improvements && aiAnalysis.improvements.length > 0 && (
                  <div>
                    <span className="text-sm font-medium">Suggested Improvements</span>
                    <ul className="text-sm mt-2 space-y-1">
                      {aiAnalysis.improvements.map((improvement, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-muted-foreground">{improvement}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          
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