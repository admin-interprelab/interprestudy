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
      searchTerm: z.string().trim().min(1, "Search term is required").max(200, "Search term too long"),
      targetLanguage: z.string().trim().min(1, "Target language is required").max(50, "Language name too long"),
      category: z.string().max(100).optional()
    });

    const parsed = requestSchema.safeParse(await req.json());
    
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: parsed.error.issues.map(i => i.message).join(', ') }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { searchTerm, targetLanguage } = parsed.data;

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `You are a medical terminology expert. Return ONLY a clean, structured response with these exact sections (no markdown symbols, asterisks, or hashtags):

TERM (ENGLISH): [term in English]
TERM (${targetLanguage.toUpperCase()}): [term in target language]
DEFINITION: [clear, concise medical definition in 1-2 sentences]
PRONUNCIATION: [phonetic pronunciation guide]

Keep it clean and professional. No extra formatting.`;
    
    const userPrompt = `Provide information for: ${searchTerm}`;

    // Generate image using gemini-2.5-flash-image-preview
    const imageResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [
          {
            role: 'user',
            content: `Create a clear, medical illustration of: ${searchTerm}. Professional, educational style.`
          }
        ],
        modalities: ["image", "text"]
      }),
    });

    let imageUrl = '';
    if (imageResponse.ok) {
      const imageData = await imageResponse.json();
      imageUrl = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url || '';
    }

    // Get terminology details
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'Rate limit exceeded. Please try again later.' 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ 
          error: 'AI credits depleted. Please add more credits to continue.' 
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error('Failed to search terminology');
    }

    const data = await aiResponse.json();
    const result = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ result, imageUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Internal] Error in advanced-terminology-search:', error);
    return new Response(JSON.stringify({ 
      error: 'Service temporarily unavailable. Please try again later.' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});