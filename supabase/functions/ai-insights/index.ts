import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { transactions, budget, type, prompt } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    let systemPrompt = '';
    let userPrompt = '';

    if (type === 'insights') {
      systemPrompt = `You are a financial advisor AI. Analyze spending patterns and provide actionable insights. 
      Be concise, friendly, and focus on practical advice. Use emojis sparingly.`;
      
      userPrompt = `Analyze this financial data and provide 3-4 key insights:
      
Budget: $${budget}
Transactions: ${JSON.stringify(transactions)}

Focus on:
1. Spending patterns and trends
2. Budget optimization opportunities  
3. Category-specific recommendations
4. Potential savings areas

Keep each insight to 1-2 sentences.`;
    } else if (type === 'categorize') {
      systemPrompt = `You are a transaction categorization AI. Analyze transaction descriptions and suggest the most appropriate category.`;
      
      userPrompt = `Categorize this transaction:
Description: ${transactions}

Choose from: Food & Dining, Transportation, Shopping, Entertainment, Bills & Utilities, Healthcare, Education, Travel, Salary, Freelance, Investment, Other

Return ONLY the category name, nothing else.`;
    } else if (type === 'chat') {
      systemPrompt = `You are a helpful financial advisor assistant. Help users understand their spending, create budgets, and make smart financial decisions. 
      Be conversational, supportive, and provide actionable advice based on their financial data.`;
      
      userPrompt = transactions; // In chat mode, transactions contains the user message
    }

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
          error: 'Rate limit exceeded. Please try again in a moment.' 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: 'AI credits exhausted. Please add credits to continue.' 
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error('AI service error');
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    // Store AI session in database (using existing supabaseClient and user from above)
    if (user && type !== 'categorize') {
      await supabaseClient.from('ai_sessions').insert({
        user_id: user.id,
        prompt: prompt || userPrompt,
        response: content,
        session_type: type === 'insights' ? 'insights' : type === 'chat' ? 'general' : 'optimization'
      });
    }

    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ai-insights function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
