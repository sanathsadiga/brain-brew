import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting - simple in-memory store (for production, use Redis or similar)
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 5; // Stricter rate limit - 5 requests per minute
const RATE_WINDOW = 60 * 1000; // 1 minute

const rateLimit = (clientId: string): boolean => {
  const now = Date.now();
  const record = requestCounts.get(clientId) || { count: 0, resetTime: now + RATE_WINDOW };
  
  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + RATE_WINDOW;
  } else {
    record.count++;
  }
  
  requestCounts.set(clientId, record);
  
  if (record.count > RATE_LIMIT) {
    console.warn(`Rate limit exceeded for client: ${clientId}`);
    return false;
  }
  
  return true;
};

const sanitizeInput = (input: string): string => {
  if (!input || typeof input !== 'string') return '';
  
  // Enhanced input sanitization
  return input
    .trim()
    .slice(0, 2000)
    .replace(/[<>]/g, '') // Basic XSS prevention
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/data:/gi, '') // Remove data: protocol
    .replace(/vbscript:/gi, '') // Remove vbscript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .replace(/<script[^>]*>.*?<\/script>/gi, ''); // Remove script tags
};

const validateRequest = (body: any): { command: string; title?: string; description?: string } => {
  if (!body || typeof body !== 'object') {
    throw new Error('Invalid request body');
  }
  
  const { command, title, description } = body;
  
  if (!command || typeof command !== 'string') {
    throw new Error('Command is required and must be a string');
  }
  
  return {
    command: sanitizeInput(command),
    title: title ? sanitizeInput(title) : undefined,
    description: description ? sanitizeInput(description) : undefined
  };
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting
    const clientId = req.headers.get('x-forwarded-for') || 'unknown';
    if (!rateLimit(clientId)) {
      return new Response(JSON.stringify({ 
        error: 'Rate limit exceeded. Please try again later.' 
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate OpenAI API key
    if (!openAIApiKey) {
      console.error('OpenAI API key not configured');
      return new Response(JSON.stringify({ 
        error: 'AI service not configured' 
      }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse and validate request
    const body = await req.json();
    const { command, title, description } = validateRequest(body);

    // Prepare sanitized prompt for OpenAI
    const systemPrompt = `You are a security-aware command analysis assistant. Analyze the given command and provide helpful suggestions while identifying potential security risks.

IMPORTANT: Never execute or simulate command execution. Only analyze the command text.

Respond with a JSON object containing:
- suggestedTags: array of relevant tags (max 5)
- category: single category name
- description: brief description of what the command does
- improvements: array of suggestions (max 3)
- security_warnings: array of security concerns if any

Keep responses concise and professional.`;

    const userPrompt = `Command: ${command}${title ? `\nTitle: ${title}` : ''}${description ? `\nDescription: ${description}` : ''}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 500,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, response.statusText, errorText);
      
      // Handle specific OpenAI errors
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'OpenAI rate limit exceeded. Please try again in a few moments.',
          details: 'The AI service is temporarily overloaded. Please wait and try again.'
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (response.status === 401) {
        return new Response(JSON.stringify({ 
          error: 'AI service authentication failed',
          details: 'Invalid API key configuration'
        }), {
          status: 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response from OpenAI');
    }

    try {
      const analysis = JSON.parse(data.choices[0].message.content);
      
      // Validate and sanitize the response
      const sanitizedAnalysis = {
        suggestedTags: Array.isArray(analysis.suggestedTags) 
          ? analysis.suggestedTags.slice(0, 5).map((tag: any) => sanitizeInput(String(tag))) 
          : [],
        category: analysis.category ? sanitizeInput(String(analysis.category)) : 'general',
        description: analysis.description ? sanitizeInput(String(analysis.description)) : '',
        improvements: Array.isArray(analysis.improvements) 
          ? analysis.improvements.slice(0, 3).map((imp: any) => sanitizeInput(String(imp))) 
          : [],
        security_warnings: Array.isArray(analysis.security_warnings) 
          ? analysis.security_warnings.slice(0, 3).map((warn: any) => sanitizeInput(String(warn))) 
          : []
      };

      return new Response(JSON.stringify(sanitizedAnalysis), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError);
      throw new Error('Invalid AI response format');
    }

  } catch (error) {
    console.error('Error in ai-assistant function:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const statusCode = errorMessage.includes('Rate limit') ? 429 : 
                      errorMessage.includes('not configured') ? 503 : 500;
    
    return new Response(JSON.stringify({ 
      error: 'AI analysis failed',
      details: errorMessage 
    }), {
      status: statusCode,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});