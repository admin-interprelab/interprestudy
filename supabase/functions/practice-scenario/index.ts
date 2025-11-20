import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
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
      scenarioType: z.string().trim().min(1, "Scenario type is required").max(100, "Scenario type too long"),
      targetLanguage: z.string().trim().min(1, "Target language is required").max(50, "Language name too long"),
      difficulty: z.string().max(50, "Difficulty value too long").optional(),
      providerAccent: z.string().max(50, "Provider accent too long").optional()
    });

    const parsed = requestSchema.safeParse(await req.json());
    
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: parsed.error.issues.map(i => i.message).join(', ') }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { scenarioType, targetLanguage, difficulty, providerAccent } = parsed.data;
    
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

    // Verify user has premium or admin role
    const { data: hasRole, error: roleError } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'premium'
    });

    const { data: isAdmin, error: adminError } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (roleError || adminError) {
      console.error('[Internal] Role check error:', roleError || adminError);
      throw new Error('Failed to verify user permissions');
    }

    if (!hasRole && !isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Premium subscription required for AI practice scenarios' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const sampleConversations = `
SAMPLE MEDICAL INTERPRETER CONVERSATION PATTERNS:

Example 1 - Initial Consultation:
Doctor: "Good morning. What brings you in today?"
Interpreter: [To patient in target language] "Buenos días. ¿Qué lo trae hoy?"
Patient: [In Spanish] "Tengo dolor de cabeza desde hace tres días."
Interpreter: [To doctor] "I have had a headache for three days."

Example 2 - Medication Discussion:
Doctor: "I'm prescribing you Lisinopril, 10 milligrams, once daily for your blood pressure."
Interpreter: [To patient] "Le voy a recetar Lisinopril, diez miligramos, una vez al día para su presión arterial."
Patient: "¿Tiene efectos secundarios?"
Interpreter: "Does it have side effects?"

Example 3 - Clarification Request:
Doctor: "You need to take this medication BID."
Interpreter: "Excuse me, doctor, could you clarify 'BID' for accurate interpretation?"
Doctor: "Oh yes, twice a day."
Interpreter: [To patient] "Necesita tomar este medicamento dos veces al día."

Key Guidelines for AI:
- Generate realistic medical scenarios based on ${scenarioType}
- Difficulty level: ${difficulty}
- Provider accent style: ${providerAccent}
- Include appropriate medical terminology
- Follow proper interpreter protocols
- Patient speaks ${targetLanguage}, doctor speaks English
- Include opportunities for clarification requests
- Test ethical boundaries and professional conduct
`;

    const systemPrompt = `You are a medical interpreter training simulator. Generate realistic practice scenarios following medical interpreter standards (IMIA, CCHI, NBCMI, NCIHC). 

${sampleConversations}

Create a ${scenarioType} scenario at ${difficulty} difficulty level with a provider using a ${providerAccent} accent. The scenario should:
1. Test interpreter accuracy and completeness
2. Include medical terminology appropriate to the scenario
3. Present ethical challenges (confidentiality, impartiality, scope of practice)
4. Require cultural mediation when appropriate
5. Include natural conversation flow with interruptions and clarifications

Provide the scenario with clear speaker turns (Doctor, Patient, expected interpreter response).`;

    const userPrompt = `Generate a ${scenarioType} practice scenario for a medical interpreter. Target language: ${targetLanguage}, Difficulty: ${difficulty}, Provider accent: ${providerAccent}.`;

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
      throw new Error('Failed to generate scenario');
    }

    const data = await response.json();
    const scenario = data.choices[0].message.content;

    return new Response(JSON.stringify({ scenario }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[Internal] Error in practice-scenario:', error);
    return new Response(JSON.stringify({ 
      error: 'Service temporarily unavailable. Please try again later.' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
