import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.90.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { prompt, skill, level, questionCount, timeLimit, targetTable } = await req.json();

    if (!prompt || !skill || !level) {
      return new Response(JSON.stringify({ error: "prompt, skill, level kerak" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isExam = targetTable === "exams";

    // Auth check
    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader || "" } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Avtorizatsiya kerak" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin ruxsati kerak" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

    const count = questionCount || 10;

    const skillInstructions: Record<string, string> = {
      vocabulary: `Generate ${count} vocabulary questions. Each should test word meaning, synonyms, antonyms, or usage. Include 4 options (A, B, C, D). Category must be "vocabulary".`,
      grammar: `Generate ${count} grammar questions. Test grammar rules appropriate for ${level} level. Include 4 options (A, B, C, D). Category must be "grammar".`,
      reading: `Generate a reading passage (300-500 words) appropriate for ${level} level, then generate ${count} comprehension questions about it. Include 4 options each. Category must be "reading". Also return the passage in "readingPassage" field with "title" and "content".`,
      listening: `Generate ${count} listening comprehension questions appropriate for ${level} level. Create questions as if students listened to a conversation or lecture. Include 4 options (A, B, C, D). Category must be "listening".`,
      writing: `Generate ${count} writing task prompts appropriate for ${level} level. Each should be an essay question or writing task. question_type should be "essay". Category must be "writing". Options should be null, correct_answer should be "open-ended".`,
      speaking: `Generate ${count} speaking questions/topics appropriate for ${level} level. Each should prompt the student to speak about a topic. question_type should be "speaking". Category must be "speaking". Options should be null, correct_answer should be "open-ended".`,
    };

    const systemPrompt = `You are an expert IELTS/CEFR English test creator. Create high-quality test content at exactly the ${level} CEFR level.

${skillInstructions[skill] || skillInstructions.grammar}

User's additional instructions: ${prompt}

IMPORTANT RULES:
- All questions MUST be in English
- Questions must be appropriate for ${level} level difficulty
- For multiple-choice: always provide exactly 4 options labeled A, B, C, D
- correct_answer must match one of the options exactly
- Provide brief explanation for each question in Uzbek language
- question_type for multiple choice should be "multiple-choice", for true/false "true-false", for fill blank "fill-blank"`;

    const toolSchema = {
      type: "function",
      function: {
        name: "create_test",
        description: "Create a complete test with questions",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string", description: "Test title in English" },
            description: { type: "string", description: "Test description in Uzbek" },
            readingPassage: {
              type: "object",
              properties: {
                title: { type: "string" },
                content: { type: "string" },
              },
              required: ["title", "content"],
              description: "Only for reading skill tests",
            },
            questions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  question_text: { type: "string" },
                  question_type: { type: "string", enum: ["multiple-choice", "true-false", "fill-blank", "essay", "speaking"] },
                  category: { type: "string" },
                  options: {
                    type: "array",
                    items: { type: "string" },
                    description: "Answer options, null for essay/speaking",
                  },
                  correct_answer: { type: "string" },
                  explanation: { type: "string", description: "Explanation in Uzbek" },
                  points: { type: "number" },
                },
                required: ["question_text", "question_type", "category", "correct_answer", "points"],
                additionalProperties: false,
              },
            },
          },
          required: ["title", "description", "questions"],
          additionalProperties: false,
        },
      },
    };

    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: {
          Authorization: `Bearer ${GEMINI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gemini-2.0-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Create a ${skill} test at ${level} level. ${prompt}` },
        ],
        tools: [toolSchema],
        tool_choice: { type: "function", function: { name: "create_test" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limit. Keyinroq urinib ko'ring." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "Kredit yetarli emas." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("AI javob bermadi");

    const generated = JSON.parse(toolCall.function.arguments);

    const validTypes = ['multiple-choice', 'true-false', 'fill-blank', 'matching-headings', 'matching-paragraph', 'matching-features', 'matching-endings', 'list-selection', 'choose-title'];

    if (isExam) {
      // Save to exams table
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let accessCode = '';
      for (let i = 0; i < 6; i++) accessCode += chars[Math.floor(Math.random() * chars.length)];

      const { data: examData, error: examError } = await adminClient
        .from("exams")
        .insert({
          title: generated.title,
          description: generated.description,
          level,
          skill,
          time_limit: (timeLimit || 30) * 60,
          is_active: false,
          max_attempts: 1,
          created_by: user.id,
          access_code: accessCode,
        })
        .select("id")
        .single();

      if (examError) throw examError;
      const examId = examData.id;

      // Insert reading passage if exists
      if (skill === "reading" && generated.readingPassage) {
        await adminClient.from("exam_reading_passages").insert({
          exam_id: examId,
          title: generated.readingPassage.title,
          content: generated.readingPassage.content,
          order_index: 1,
        });
      }

      // Insert exam questions
      const questions = generated.questions.map((q: any, i: number) => {
        let questionType = q.question_type;
        if (!validTypes.includes(questionType)) {
          if (questionType === 'essay' || questionType === 'speaking') questionType = 'fill-blank';
          else questionType = 'multiple-choice';
        }
        return {
          exam_id: examId,
          question_text: q.question_text,
          question_type: questionType,
          options: q.options || null,
          correct_answer: q.correct_answer,
          explanation: q.explanation || null,
          points: q.points || 1,
          order_index: i + 1,
        };
      });

      const { error: qError } = await adminClient.from("exam_questions").insert(questions);
      if (qError) throw qError;

      return new Response(JSON.stringify({
        success: true,
        testId: examId,
        title: generated.title,
        questionCount: questions.length,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else {
      // Save to tests table (original behavior)
      const { data: testData, error: testError } = await adminClient
        .from("tests")
        .insert({
          title: generated.title,
          description: generated.description,
          level,
          skill,
          time_limit: (timeLimit || 30) * 60,
          is_active: true,
          randomize_questions: false,
          created_by: user.id,
        })
        .select("id")
        .single();

      if (testError) throw testError;
      const testId = testData.id;

      // Insert reading passage if exists
      if (skill === "reading" && generated.readingPassage) {
        await adminClient.from("reading_passages").insert({
          test_id: testId,
          title: generated.readingPassage.title,
          content: generated.readingPassage.content,
          order_index: 1,
        });
      }

      // Insert questions
      const validCategories = ['grammar', 'vocabulary', 'reading', 'listening', 'writing', 'speaking'];
      const questions = generated.questions.map((q: any, i: number) => {
        const category = validCategories.includes(q.category) ? q.category : skill;
        let questionType = q.question_type;
        if (!validTypes.includes(questionType)) {
          if (questionType === 'essay' || questionType === 'speaking') questionType = 'fill-blank';
          else questionType = 'multiple-choice';
        }
        return {
          test_id: testId,
          question_text: q.question_text,
          question_type: questionType,
          category,
          options: q.options || null,
          correct_answer: q.correct_answer,
          explanation: q.explanation || null,
          points: q.points || 1,
          order_index: i + 1,
        };
      });

      const { error: qError } = await adminClient.from("questions").insert(questions);
      if (qError) throw qError;

      return new Response(JSON.stringify({
        success: true,
        testId,
        title: generated.title,
        questionCount: questions.length,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (e) {
    console.error("generate-test error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
