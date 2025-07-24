import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Edit, Trash2, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

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

// Helper function to detect programming language
const detectLanguage = (command: string): string => {
  const cmd = command.toLowerCase().trim();
  
  // Shell/Bash commands
  if (cmd.startsWith('docker') || cmd.startsWith('kubectl') || cmd.startsWith('git') ||
      cmd.startsWith('npm') || cmd.startsWith('yarn') || cmd.startsWith('pip') ||
      cmd.startsWith('curl') || cmd.startsWith('wget') || cmd.startsWith('ssh') ||
      cmd.startsWith('rsync') || cmd.startsWith('grep') || cmd.startsWith('awk') ||
      cmd.startsWith('sed') || cmd.startsWith('find') || cmd.startsWith('ls') ||
      cmd.startsWith('cd ') || cmd.startsWith('mkdir') || cmd.startsWith('rm ') ||
      cmd.startsWith('cp ') || cmd.startsWith('mv ') || cmd.startsWith('chmod') ||
      cmd.startsWith('chown') || cmd.startsWith('ps ') || cmd.startsWith('kill ') ||
      cmd.startsWith('systemctl') || cmd.startsWith('service ') || cmd.startsWith('crontab')) {
    return 'bash';
  }
  
  // SQL
  if (cmd.startsWith('select') || cmd.startsWith('insert') || cmd.startsWith('update') ||
      cmd.startsWith('delete') || cmd.startsWith('create') || cmd.startsWith('alter') ||
      cmd.startsWith('drop') || cmd.includes('from ') || cmd.includes('where ')) {
    return 'sql';
  }
  
  // Python
  if (cmd.startsWith('python') || cmd.startsWith('pip') || cmd.includes('import ') ||
      cmd.includes('def ') || cmd.includes('class ') || cmd.includes('print(')) {
    return 'python';
  }
  
  // JavaScript/Node
  if (cmd.startsWith('node') || cmd.startsWith('npx') || cmd.includes('console.log') ||
      cmd.includes('function') || cmd.includes('const ') || cmd.includes('let ')) {
    return 'javascript';
  }
  
  // Default to bash for most CLI commands
  return 'bash';
};

const CommandCard: React.FC<CommandCardProps> = ({ command, onEdit, onDelete }) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const language = detectLanguage(command.command);

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
        <div className="rounded-md overflow-hidden">
          <SyntaxHighlighter
            language={language}
            style={oneDark}
            customStyle={{
              margin: 0,
              padding: '12px',
              fontSize: '14px',
              lineHeight: '1.4',
            }}
            wrapLines={true}
            wrapLongLines={true}
          >
            {command.command}
          </SyntaxHighlighter>
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