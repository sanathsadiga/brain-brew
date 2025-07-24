import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get environment variable
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openAIApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured. Please set OPENAI_API_KEY in your Supabase secrets.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Parse request body
    const { command, title, description, action } = await req.json();

    if (!command || !action) {
      return new Response(
        JSON.stringify({ error: 'Command and action are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'analyze':
        systemPrompt = `You are an expert developer assistant that analyzes commands and code snippets. 
        Analyze the given command and provide suggestions in JSON format with these fields:
        - suggestedTags: array of relevant tags (max 5, lowercase, single words when possible)
        - category: main category (shell, git, docker, database, python, javascript, etc.)
        - improvements: array of suggestions to improve the command (max 3)
        - security_warnings: array of security concerns if any
        - description: brief description if none provided or current one can be improved
        
        Be concise and practical. Focus on real developer needs.`;
        
        userPrompt = `Command: "${command}"
        Title: "${title}"
        Current Description: "${description || 'None'}"
        
        Analyze this command and provide suggestions.`;
        break;

      case 'validate':
        systemPrompt = `You are a command validation expert. Check the given command for:
        1. Syntax errors
        2. Common mistakes
        3. Missing flags or options
        4. Security issues
        5. Best practices
        
        Return JSON with:
        - isValid: boolean
        - issues: array of issues found
        - suggestions: array of improvements
        - severity: 'low', 'medium', 'high' for most critical issue`;
        
        userPrompt = `Validate this command: "${command}"`;
        break;

      case 'suggest_similar':
        systemPrompt = `You are a developer productivity assistant. Based on the given command, 
        suggest 3-5 related commands that developers commonly use with it.
        
        Return JSON with:
        - similar_commands: array of objects with {command, description, tags}`;
        
        userPrompt = `Given this command: "${command}"
        Suggest related commands that developers often use.`;
        break;

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action. Must be analyze, validate, or suggest_similar' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
    }

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
        temperature: 0.3,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const assistantResponse = data.choices[0].message.content;

    // Try to parse as JSON, fallback to text response
    let result;
    try {
      result = JSON.parse(assistantResponse);
    } catch {
      result = { 
        response: assistantResponse,
        error: 'Failed to parse AI response as JSON'
      };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: 'AI assistant error', 
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});