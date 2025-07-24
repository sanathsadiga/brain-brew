import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CommandAnalysis {
  suggestedTags: string[];
  category: string;
  improvements: string[];
  security_warnings?: string[];
  description?: string;
}

serve(async (req) => {
  console.log('AI Assistant function called:', req.method, req.url);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Processing request...');
    
    // Parse request body
    let requestBody;
    try {
      requestBody = await req.json();
      console.log('Request body parsed:', requestBody);
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const { command, title, description, action } = requestBody;

    console.log('Extracted data:', { command, title, description, action });

    if (!openAIApiKey) {
      console.error('OpenAI API key not found in environment');
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured. Please add OPENAI_API_KEY to your environment.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    if (!command || !action) {
      console.error('Missing required fields:', { command: !!command, action: !!action });
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
        console.error('Invalid action:', action);
        return new Response(
          JSON.stringify({ error: 'Invalid action. Must be analyze, validate, or suggest_similar' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
    }

    console.log('Making OpenAI API call...');
    console.log('API Key present:', !!openAIApiKey);
    console.log('API Key length:', openAIApiKey?.length || 0);

    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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

    console.log('OpenAI response status:', openAIResponse.status);

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error('OpenAI API error:', openAIResponse.status, errorText);
      throw new Error(`OpenAI API error: ${openAIResponse.status} - ${errorText}`);
    }

    const data = await openAIResponse.json();
    console.log('OpenAI response received successfully');
    
    const assistantResponse = data.choices[0].message.content;

    // Try to parse as JSON, fallback to text response
    let result;
    try {
      result = JSON.parse(assistantResponse);
      console.log('Successfully parsed AI response as JSON');
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      result = { 
        response: assistantResponse,
        error: 'Failed to parse AI response as JSON'
      };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in AI assistant function:', error);
    console.error('Error stack:', error.stack);
    return new Response(
      JSON.stringify({ 
        error: 'AI assistant error', 
        details: error.message,
        stack: error.stack 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});