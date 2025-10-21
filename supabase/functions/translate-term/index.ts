import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestSchema = z.object({
      term: z.string().trim().min(1, "Term is required").max(200, "Term too long"),
      definition: z.string().max(2000, "Definition too long").optional(),
      targetLanguage: z.string().trim().min(1, "Target language is required").max(50, "Language name too long")
    });

    const parsed = requestSchema.safeParse(await req.json());
    
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: parsed.error.issues.map(i => i.message).join(', ') }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { term, definition, targetLanguage } = parsed.data;

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are a medical interpreter terminology expert. Provide accurate translations of medical and interpreting terminology from English to ${targetLanguage}. Include cultural context when relevant.`;

    const userPrompt = definition 
      ? `Translate the following term and its definition to ${targetLanguage}:\nTerm: ${term}\nDefinition: ${definition}\n\nProvide the translation in this format:\nTranslated Term: [term]\nTranslated Definition: [definition]`
      : `Translate this medical interpreter term to ${targetLanguage}: ${term}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'Rate limit exceeded. Please try again later.' 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: 'AI credits depleted. Please add more credits to continue.' 
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error('Failed to get translation');
    }

    const data = await response.json();
    const translation = data.choices[0].message.content;

    return new Response(JSON.stringify({ translation }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[Internal] Error in translate-term:', error);
    return new Response(JSON.stringify({ 
      error: 'Service temporarily unavailable. Please try again later.' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});