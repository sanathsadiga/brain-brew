import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Edit, Trash2, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Command {
  id: string;
  title: string;
  command: string;
  description?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

interface CommandCardProps {
  command: Command;
  onEdit: (command: Command) => void;
  onDelete: (id: string) => void;
}

const CommandCard: React.FC<CommandCardProps> = ({ command, onEdit, onDelete }) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(command.command);
      setCopied(true);
      toast({
        title: "Copied to clipboard",
        description: "Command has been copied to your clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Failed to copy",
        description: "Could not copy command to clipboard.",
      });
    }
  };

  return (
    <Card className="animate-fade-in hover:shadow-md transition-all duration-300">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg font-semibold">{command.title}</CardTitle>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-8 w-8 p-0"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(command)}
              className="h-8 w-8 p-0"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(command.id)}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="code-block">
          <code>{command.command}</code>
        </div>
        
        {command.description && (
          <p className="text-sm text-muted-foreground">{command.description}</p>
        )}
        
        {command.tags && command.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {command.tags.map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
        
        <div className="text-xs text-muted-foreground">
          Created: {new Date(command.created_at).toLocaleDateString()}
        </div>
      </CardContent>
    </Card>
  );
};

export default CommandCard;