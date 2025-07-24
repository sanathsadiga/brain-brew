import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Play, Loader2, Terminal, Copy, Save, AlertTriangle } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodeRunnerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialCode?: string;
  initialLanguage?: string;
}

interface ExecutionResult {
  output: string;
  error?: string;
  executionTime: number;
  exitCode: number;
}

const SUPPORTED_LANGUAGES = [
  { id: 'javascript', name: 'JavaScript (Node.js)', extension: 'js' },
  { id: 'python', name: 'Python 3', extension: 'py' },
  { id: 'bash', name: 'Bash', extension: 'sh' },
  { id: 'sql', name: 'SQL', extension: 'sql' },
];

const DEFAULT_CODE = {
  javascript: `// JavaScript Example
console.log("Hello, World!");

// You can use modern JavaScript features
const fibonacci = (n) => {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
};

console.log("Fibonacci sequence:");
for (let i = 0; i < 10; i++) {
  console.log(\`F(\${i}) = \${fibonacci(i)}\`);
}`,
  
  python: `# Python Example
print("Hello, World!")

# You can use Python libraries
import math
import json

def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

print("Fibonacci sequence:")
for i in range(10):
    print(f"F({i}) = {fibonacci(i)}")

# Working with data
data = {"message": "Python is awesome!", "numbers": [1, 2, 3, 4, 5]}
print(json.dumps(data, indent=2))`,

  bash: `#!/bin/bash
# Bash Example
echo "Hello, World!"

# Working with variables
name="DevNotes User"
echo "Welcome, $name!"

# Simple loop
echo "Counting to 5:"
for i in {1..5}; do
    echo "Count: $i"
done

# System information
echo "Current date: $(date)"
echo "Working directory: $(pwd)"`,

  sql: `-- SQL Example (PostgreSQL syntax)
-- Note: This runs against a sandbox database

-- Create a temporary table
CREATE TEMP TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample data
INSERT INTO users (name, email) VALUES 
    ('Alice Johnson', 'alice@example.com'),
    ('Bob Smith', 'bob@example.com'),
    ('Carol Davis', 'carol@example.com');

-- Query the data
SELECT 
    id,
    name,
    email,
    created_at
FROM users
ORDER BY created_at DESC;

-- Aggregate query
SELECT 
    COUNT(*) as total_users,
    MAX(created_at) as latest_signup
FROM users;`
};

const CodeRunner: React.FC<CodeRunnerProps> = ({
  isOpen,
  onOpenChange,
  initialCode,
  initialLanguage = 'javascript'
}) => {
  const { toast } = useToast();
  const [code, setCode] = useState(initialCode || DEFAULT_CODE[initialLanguage]);
  const [language, setLanguage] = useState(initialLanguage);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('editor');

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    if (!initialCode) {
      setCode(DEFAULT_CODE[newLanguage] || '');
    }
    setResult(null);
  };

  const handleRunCode = async () => {
    if (!code.trim()) {
      toast({
        variant: 'destructive',
        title: 'No code to run',
        description: 'Please enter some code first.',
      });
      return;
    }

    setLoading(true);
    setActiveTab('output');

    try {
      const { data, error } = await supabase.functions.invoke('code-executor', {
        body: {
          code: code.trim(),
          language,
        }
      });

      if (error) throw error;

      setResult(data);

      if (data.error) {
        toast({
          variant: 'destructive',
          title: 'Execution Error',
          description: 'Code execution failed. Check the output for details.',
        });
      } else {
        toast({
          title: 'Code executed successfully',
          description: `Completed in ${data.executionTime}ms`,
        });
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Execution failed',
        description: error.message || 'Failed to execute code',
      });
      setResult({
        output: '',
        error: error.message || 'Failed to execute code',
        executionTime: 0,
        exitCode: 1,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      toast({
        title: 'Code copied',
        description: 'Code has been copied to clipboard.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to copy',
        description: 'Could not copy code to clipboard.',
      });
    }
  };

  const handleSaveAsCommand = () => {
    // This would integrate with the command creation flow
    toast({
      title: 'Save as Command',
      description: 'Feature coming soon - will save to your commands.',
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Terminal className="h-5 w-5" />
            Code Runner
          </DialogTitle>
          <DialogDescription>
            Execute code in a secure sandbox environment. Supports JavaScript, Python, Bash, and SQL.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <div className="flex items-center justify-between gap-4 mb-4">
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="editor">Editor</TabsTrigger>
                <TabsTrigger value="output">Output</TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-2">
                <Select value={language} onValueChange={handleLanguageChange}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <SelectItem key={lang.id} value={lang.id}>
                        {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  onClick={handleRunCode}
                  disabled={loading}
                  className="gap-2"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  Run
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-hidden">
              <TabsContent value="editor" className="h-full mt-0">
                <Card className="h-full">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">Code Editor</CardTitle>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={handleCopyCode}>
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={handleSaveAsCommand}>
                          <Save className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="h-[calc(100%-4rem)] p-0">
                    <Textarea
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="h-full resize-none border-0 font-mono text-sm"
                      placeholder={`Enter your ${language} code here...`}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="output" className="h-full mt-0">
                <Card className="h-full">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">Execution Output</CardTitle>
                      {result && (
                        <div className="flex items-center gap-2">
                          <Badge variant={result.exitCode === 0 ? 'default' : 'destructive'}>
                            Exit Code: {result.exitCode}
                          </Badge>
                          <Badge variant="outline">
                            {result.executionTime}ms
                          </Badge>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="h-[calc(100%-4rem)] overflow-auto">
                    {loading ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">Executing code...</p>
                        </div>
                      </div>
                    ) : result ? (
                      <div className="space-y-4">
                        {result.error && (
                          <div className="p-3 border border-destructive/20 bg-destructive/5 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <AlertTriangle className="h-4 w-4 text-destructive" />
                              <span className="text-sm font-medium text-destructive">Error</span>
                            </div>
                            <pre className="text-sm whitespace-pre-wrap font-mono text-destructive">
                              {result.error}
                            </pre>
                          </div>
                        )}
                        
                        {result.output && (
                          <div>
                            <h4 className="text-sm font-medium mb-2">Output:</h4>
                            <SyntaxHighlighter
                              language="text"
                              style={oneDark}
                              customStyle={{
                                margin: 0,
                                padding: '12px',
                                fontSize: '13px',
                                lineHeight: '1.4',
                              }}
                            >
                              {result.output}
                            </SyntaxHighlighter>
                          </div>
                        )}
                        
                        {!result.output && !result.error && (
                          <div className="text-center py-8 text-muted-foreground">
                            <Terminal className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>No output generated</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Terminal className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Run your code to see the output here</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CodeRunner;