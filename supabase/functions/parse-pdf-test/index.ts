import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization")!;

    // Verify admin
    const callerClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await callerClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: roleData } = await adminClient.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden: admin only" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { pdf_text, test_config } = await req.json();

    if (!pdf_text || !test_config) {
      return new Response(JSON.stringify({ error: "pdf_text and test_config required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are a professional English language test creator. You will receive raw text extracted from a PDF document containing test questions. Your job is to parse and structure them into a clean JSON format.

IMPORTANT RULES:
- Extract ALL questions from the text
- Identify the question type: "multiple_choice", "true_false", "fill_blank", "matching", "short_answer"
- For multiple choice: extract all options (A, B, C, D) and identify the correct answer
- For fill-in-the-blank: the correct answer should be the expected word/phrase
- For true/false: correct_answer should be "True" or "False"
- Keep the original question text as-is
- If there's a reading passage, extract it separately
- Generate clear explanations for each answer
- Order questions sequentially

Return ONLY valid JSON in this exact format (no markdown, no explanation):
{
  "reading_passages": [
    {
      "title": "Passage Title",
      "content": "Full passage text...",
      "order_index": 0
    }
  ],
  "questions": [
    {
      "question_text": "What is...?",
      "question_type": "multiple_choice",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "Option A",
      "explanation": "Because...",
      "order_index": 0,
      "points": 1
    }
  ]
}

If there are no reading passages, return an empty array for reading_passages.
Category should match the skill: "${test_config.skill}".`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Here is the PDF text content to parse into test questions:\n\n${pdf_text}` },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "AI rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits required. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI error:", response.status, errText);
      throw new Error("AI gateway error");
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content || "";

    // Clean up the response - remove markdown code blocks if present
    let jsonStr = content.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      return new Response(JSON.stringify({ error: "AI returned invalid JSON. Please try again.", raw: jsonStr.slice(0, 500) }), {
        status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Now create the test and insert questions
    const { data: testData, error: testError } = await adminClient.from("tests").insert({
      title: test_config.title,
      description: test_config.description || `PDF dan avtomatik yaratilgan test`,
      level: test_config.level,
      skill: test_config.skill,
      time_limit: test_config.time_limit || 1800,
      is_active: false, // Start as inactive so admin can review
      created_by: user.id,
    }).select().single();

    if (testError) throw testError;

    // Insert reading passages if any
    if (parsed.reading_passages && parsed.reading_passages.length > 0) {
      for (const passage of parsed.reading_passages) {
        await adminClient.from("reading_passages").insert({
          test_id: testData.id,
          title: passage.title || "Passage",
          content: passage.content,
          order_index: passage.order_index || 0,
        });
      }
    }

    // Insert questions
    const questionsToInsert = (parsed.questions || []).map((q: any, i: number) => ({
      test_id: testData.id,
      question_text: q.question_text,
      question_type: q.question_type || "multiple_choice",
      options: q.options ? JSON.stringify(q.options) : null,
      correct_answer: q.correct_answer,
      explanation: q.explanation || null,
      order_index: q.order_index ?? i,
      points: q.points || 1,
      category: test_config.skill,
    }));

    if (questionsToInsert.length > 0) {
      const { error: qError } = await adminClient.from("questions").insert(questionsToInsert);
      if (qError) {
        console.error("Questions insert error:", qError);
        // Don't fail entirely, test is already created
      }
    }

    return new Response(JSON.stringify({
      success: true,
      test_id: testData.id,
      questions_count: questionsToInsert.length,
      passages_count: parsed.reading_passages?.length || 0,
    }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("parse-pdf-test error:", err);
    return new Response(JSON.stringify({ error: err.message || "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
