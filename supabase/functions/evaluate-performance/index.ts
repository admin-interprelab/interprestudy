import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transcript, scenarioType, targetLanguage } = await req.json();
    
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: authHeader } },
      }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are an expert medical interpreter evaluator. Evaluate performance based on IMIA, CCHI, NBCMI, NCIHC, CLAS standards, and CHIA guidelines. Assess:
    1. Accuracy and completeness
    2. Ethical conduct (confidentiality, impartiality, professional boundaries)
    3. Language proficiency in both languages
    4. Cultural mediation appropriateness
    5. Protocol adherence
    
    Provide a score (0-100), specific strengths, and areas for improvement.`;

    const userPrompt = `Evaluate this ${scenarioType} interpretation session (target language: ${targetLanguage}):\n\n${transcript}`;

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
      if (response.status === 429 || response.status === 402) {
        return new Response(JSON.stringify({ 
          error: 'Service temporarily unavailable. Please try again later.' 
        }), {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error('Failed to evaluate performance');
    }

    const data = await response.json();
    const feedback = data.choices[0].message.content;

    // Parse feedback to extract score, strengths, and improvements
    const scoreMatch = feedback.match(/score[:\s]*(\d+)/i);
    const score = scoreMatch ? parseInt(scoreMatch[1]) : 75;

    // Save to database
    const { error: insertError } = await supabase
      .from('practice_sessions')
      .insert({
        user_id: user.id,
        scenario_type: scenarioType,
        target_language: targetLanguage,
        feedback_score: score,
        feedback_text: feedback,
      });

    if (insertError) {
      console.error('Error saving session:', insertError);
    }

    return new Response(JSON.stringify({ 
      score,
      feedback,
      saved: !insertError 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[Internal] Error in evaluate-performance:', error);
    return new Response(JSON.stringify({ 
      error: 'Service temporarily unavailable. Please try again later.' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});