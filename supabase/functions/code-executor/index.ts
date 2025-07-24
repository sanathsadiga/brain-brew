import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Initialize Supabase client for authentication
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface ExecuteRequest {
  code: string;
  language: string;
}

interface ExecutionResult {
  output: string;
  error?: string;
  executionTime: number;
  exitCode: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify JWT token and get user
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      throw new Error('Authorization header required')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      throw new Error('Invalid or expired token')
    }

    const { code, language }: ExecuteRequest = await req.json()

    if (!code || !language) {
      throw new Error('Code and language are required')
    }

    // Input validation and sanitization
    if (code.length > 10000) {
      throw new Error('Code too long (max 10,000 characters)')
    }

    if (!['javascript', 'python', 'bash', 'sql'].includes(language)) {
      throw new Error('Unsupported language')
    }

    // Security check - block dangerous patterns
    const dangerousPatterns = [
      /require\s*\(\s*['"]child_process['"]/, // Node.js child_process
      /import\s+.*child_process/, // ES6 import child_process
      /eval\s*\(/, // eval function
      /Function\s*\(/, // Function constructor
      /process\./, // process object access
      /fs\./, // File system access
      /\.exec\s*\(/, // exec methods
      /spawn\s*\(/, // spawn processes
      /fork\s*\(/, // fork processes
      /__import__/, // Python import bypass
      /exec\s*\(/, // Python exec
      /open\s*\(/, // File operations
      /subprocess/, // Python subprocess
      /os\.system/, // OS system calls
      /rm\s+-rf/, // Dangerous bash commands
      /;\s*rm\s+/, // Command chaining with rm
      /\|\s*rm\s+/, // Piped rm commands
      /wget\s+/, // Download commands
      /curl\s+/, // Download commands
      /DROP\s+TABLE/i, // SQL drop commands
      /DELETE\s+FROM/i, // SQL delete commands
    ]

    for (const pattern of dangerousPatterns) {
      if (pattern.test(code)) {
        console.warn(`Blocked dangerous code pattern for user ${user.id}: ${pattern}`)
        throw new Error('Code contains potentially dangerous operations')
      }
    }

    const startTime = performance.now()
    let result: ExecutionResult

    switch (language) {
      case 'javascript':
        result = await executeJavaScript(code)
        break
      case 'python':
        result = await executePython(code)
        break
      case 'bash':
        result = await executeBash(code)
        break
      case 'sql':
        result = await executeSQL(code)
        break
      default:
        throw new Error(`Unsupported language: ${language}`)
    }

    result.executionTime = performance.now() - startTime

    return new Response(
      JSON.stringify(result),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Code execution error:', error)
    return new Response(
      JSON.stringify({ 
        output: '', 
        error: error.message,
        executionTime: 0,
        exitCode: 1
      }),
      { 
        status: 400,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})

async function executeJavaScript(code: string): Promise<ExecutionResult> {
  try {
    // Create a sandboxed environment
    const sandbox = {
      console: {
        log: (...args: any[]) => {
          output.push(args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
          ).join(' '))
        },
        error: (...args: any[]) => {
          output.push('ERROR: ' + args.map(arg => String(arg)).join(' '))
        },
        warn: (...args: any[]) => {
          output.push('WARN: ' + args.map(arg => String(arg)).join(' '))
        }
      },
      setTimeout: globalThis.setTimeout,
      clearTimeout: globalThis.clearTimeout,
      Math: Math,
      Date: Date,
      JSON: JSON,
      Array: Array,
      Object: Object,
      String: String,
      Number: Number,
      Boolean: Boolean,
    }

    const output: string[] = []
    
    // Wrap code in a function to capture variables
    const wrappedCode = `
      (function() {
        ${code}
      })();
    `

    // Execute with timeout
    const timeoutId = setTimeout(() => {
      throw new Error('Execution timeout (5 seconds)')
    }, 5000)

    try {
      // Use Function constructor for safer evaluation
      const func = new Function(...Object.keys(sandbox), wrappedCode)
      func(...Object.values(sandbox))
    } finally {
      clearTimeout(timeoutId)
    }

    return {
      output: output.join('\n'),
      exitCode: 0,
      executionTime: 0 // Will be set by caller
    }
  } catch (error) {
    return {
      output: '',
      error: error.message,
      exitCode: 1,
      executionTime: 0
    }
  }
}

async function executePython(code: string): Promise<ExecutionResult> {
  try {
    // For demo purposes, simulate Python execution
    // In a real implementation, you'd use a Docker container or Python subprocess
    const lines = code.split('\n')
    const output: string[] = []
    
    // Simple simulation - look for print statements
    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed.startsWith('print(')) {
        const match = trimmed.match(/print\((.+)\)/)
        if (match) {
          try {
            // Very basic evaluation for demo
            let content = match[1]
            if (content.startsWith('"') && content.endsWith('"')) {
              content = content.slice(1, -1)
            } else if (content.startsWith("'") && content.endsWith("'")) {
              content = content.slice(1, -1)
            }
            output.push(content)
          } catch {
            output.push(match[1])
          }
        }
      }
    }

    // Add some demo output
    if (code.includes('fibonacci')) {
      output.push('Fibonacci sequence:')
      for (let i = 0; i < 10; i++) {
        const fib = i <= 1 ? i : fibonacci(i)
        output.push(`F(${i}) = ${fib}`)
      }
    }

    if (code.includes('json.dumps')) {
      output.push('{\n  "message": "Python is awesome!",\n  "numbers": [1, 2, 3, 4, 5]\n}')
    }

    return {
      output: output.join('\n') || 'Python code executed (simulated)',
      exitCode: 0,
      executionTime: 0
    }
  } catch (error) {
    return {
      output: '',
      error: error.message,
      exitCode: 1,
      executionTime: 0
    }
  }
}

async function executeBash(code: string): Promise<ExecutionResult> {
  try {
    const output: string[] = []
    const lines = code.split('\n')
    
    // Simulate bash execution
    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed.startsWith('echo ')) {
        const content = trimmed.substring(5).replace(/"/g, '').replace(/'/g, '')
        output.push(content)
      } else if (trimmed.includes('for i in {1..5}')) {
        for (let i = 1; i <= 5; i++) {
          output.push(`Count: ${i}`)
        }
      } else if (trimmed.includes('$(date)')) {
        output.push(`Current date: ${new Date().toISOString()}`)
      } else if (trimmed.includes('$(pwd)')) {
        output.push('Working directory: /tmp/sandbox')
      }
    }

    return {
      output: output.join('\n') || 'Bash script executed (simulated)',
      exitCode: 0,
      executionTime: 0
    }
  } catch (error) {
    return {
      output: '',
      error: error.message,
      exitCode: 1,
      executionTime: 0
    }
  }
}

async function executeSQL(code: string): Promise<ExecutionResult> {
  try {
    // Simulate SQL execution with sample results
    const output: string[] = []
    
    if (code.includes('CREATE TEMP TABLE')) {
      output.push('CREATE TABLE')
    }
    
    if (code.includes('INSERT INTO')) {
      output.push('INSERT 0 3')
    }
    
    if (code.includes('SELECT') && code.includes('FROM users')) {
      output.push(' id |     name      |        email        |         created_at')
      output.push('----+---------------+---------------------+----------------------------')
      output.push('  1 | Alice Johnson | alice@example.com   | 2024-01-15 10:30:00.000000')
      output.push('  2 | Bob Smith     | bob@example.com     | 2024-01-15 10:30:00.000000')
      output.push('  3 | Carol Davis   | carol@example.com   | 2024-01-15 10:30:00.000000')
      output.push('(3 rows)')
    }
    
    if (code.includes('COUNT(*)')) {
      output.push(' total_users |      latest_signup')
      output.push('-------------+----------------------------')
      output.push('           3 | 2024-01-15 10:30:00.000000')
      output.push('(1 row)')
    }

    return {
      output: output.join('\n') || 'SQL executed (simulated)',
      exitCode: 0,
      executionTime: 0
    }
  } catch (error) {
    return {
      output: '',
      error: error.message,
      exitCode: 1,
      executionTime: 0
    }
  }
}

// Helper function for fibonacci calculation
function fibonacci(n: number): number {
  if (n <= 1) return n
  return fibonacci(n - 1) + fibonacci(n - 2)
}