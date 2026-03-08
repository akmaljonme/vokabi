import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// IBRAT FARZANDLARI playlist - "Ingliz tilini 0 dan o'rganish"
const PLAYLIST_VIDEOS = [
  { id: "d-fvgkbTED0", title: "Alphabet | Kirish", lesson: 0, topics: ["alphabet", "introduction", "basics"] },
  { id: "n-uTwzzVnsg", title: "TO BE VERB | 1-dars", lesson: 1, topics: ["to be", "am is are", "verb to be"] },
  { id: "0Gi1DknYo5A", title: "TO BE VERB | Question Forms | 2-dars", lesson: 2, topics: ["to be", "questions", "am is are"] },
  { id: "MsrT1z4EuOg", title: "Present Continuous Tense | 3-dars", lesson: 3, topics: ["present continuous", "progressive", "ing form"] },
  { id: "erJ1qmuZW6Q", title: "Present Continuous Questions | 4-dars", lesson: 4, topics: ["present continuous", "questions"] },
  { id: "IL_008MAgwQ", title: "Present Simple Tense | 5-dars", lesson: 5, topics: ["present simple", "simple present", "daily routines"] },
  { id: "EmWHDcJKLbE", title: "Present Simple Negative | 6-dars", lesson: 6, topics: ["present simple", "negative", "don't doesn't"] },
  { id: "6icIxa75PcY", title: "Present Simple Questions | 7-dars", lesson: 7, topics: ["present simple", "questions", "do does"] },
  { id: "3_-U78SzHVI", title: "Present Simple and Present Continuous | 8-dars", lesson: 8, topics: ["present simple", "present continuous", "comparison"] },
  { id: "4-afuqA10t4", title: "I have got ... and I have ... | 9-dars", lesson: 9, topics: ["have got", "have", "possession"] },
  { id: "6A7n5RKFa2c", title: "Past Simple | 10-dars", lesson: 10, topics: ["past simple", "past tense", "was were"] },
  { id: "sY2b-mj76h8", title: "Past Simple 2 | 11-dars", lesson: 11, topics: ["past simple", "irregular verbs", "past tense"] },
  { id: "XfLqJNHSdZU", title: "Past Simple Negative and Questions | 12-dars", lesson: 12, topics: ["past simple", "negative", "questions", "did"] },
  { id: "t_7oBHw-k-o", title: "Past Continuous | 13-dars", lesson: 13, topics: ["past continuous", "was were doing"] },
  { id: "0CBcD06Jk7U", title: "Past Simple and Past Continuous | 14-dars", lesson: 14, topics: ["past simple", "past continuous", "comparison"] },
  { id: "Ew9OR6q6GW8", title: "Present Perfect | 15-dars", lesson: 15, topics: ["present perfect", "have has done"] },
  { id: "54Xj_PcwlIY", title: "Present Perfect | 16-dars", lesson: 16, topics: ["present perfect", "experience"] },
  { id: "xk6Nf-L1OYM", title: "Present Perfect | 17-dars", lesson: 17, topics: ["present perfect", "yet already just"] },
  { id: "FJ8XZiOFn98", title: "Present Perfect | 18-dars", lesson: 18, topics: ["present perfect", "been gone"] },
  { id: "j1bsFkoflsY", title: "For Since Ago | 19-dars", lesson: 19, topics: ["for", "since", "ago", "present perfect", "time expressions"] },
  { id: "f9chNIPYs18", title: "Present Perfect va Past Simple | 20-dars", lesson: 20, topics: ["present perfect", "past simple", "comparison"] },
  { id: "M2yBOEKH5AA", title: "Passive Voice | 21-dars", lesson: 21, topics: ["passive voice", "is done", "was done"] },
  { id: "idPtxgnyYdo", title: "Passive Voice | 22-dars", lesson: 22, topics: ["passive voice", "passive forms"] },
  { id: "XaxovUN8rZI", title: "Present Past Tenses | 23-dars", lesson: 23, topics: ["tenses", "present", "past", "review"] },
  { id: "YUiQNv3ihT4", title: "Regular and Irregular Verbs | 24-dars", lesson: 24, topics: ["regular verbs", "irregular verbs", "verb forms"] },
  { id: "z_gZh4bqGwU", title: "I used to ... | 25-dars", lesson: 25, topics: ["used to", "past habits"] },
  { id: "_ZiJ7TkNQKI", title: "What are you doing tomorrow? | 26-dars", lesson: 26, topics: ["future", "present continuous for future", "plans"] },
  { id: "H1gZ_EWC2zA", title: "I'm going to ... | 27-dars", lesson: 27, topics: ["going to", "future plans", "intentions"] },
  { id: "49MkAq6fdSA", title: "Future Tenses | 28-dars", lesson: 28, topics: ["future", "will", "shall", "future tenses"] },
  { id: "01WnNY0C-cg", title: "Future tenses | 29-dars", lesson: 29, topics: ["future", "will", "going to", "comparison"] },
  { id: "Lta1sfBIXCY", title: "Modal verbs | 30-dars", lesson: 30, topics: ["modal verbs", "can", "could", "may", "might"] },
  { id: "lSakX0FIkgg", title: "Modal verbs | 31-dars", lesson: 31, topics: ["modal verbs", "should", "must", "have to"] },
  { id: "ppwXw2Dh-l0", title: "Modal verbs | 32-dars", lesson: 32, topics: ["modal verbs", "would", "shall"] },
  { id: "0PjvlBq5S5o", title: "Modal verbs | 33-dars", lesson: 33, topics: ["modal verbs", "advanced"] },
  { id: "qgdclNoDQIs", title: "I have to ... | 34-dars", lesson: 34, topics: ["have to", "must", "obligation"] },
  { id: "YmwBmwFp4Qg", title: "Would you like ... ? | 35-dars", lesson: 35, topics: ["would like", "offers", "requests", "polite"] },
  { id: "8W-7SdxjfaM", title: "There is vs There are | 36-dars", lesson: 36, topics: ["there is", "there are", "existence"] },
  { id: "rLCHWbLOIsA", title: "There was vs There were | 37-dars", lesson: 37, topics: ["there was", "there were", "past"] },
  { id: "stCZZfcZhv4", title: "It... | 38-dars", lesson: 38, topics: ["it", "impersonal it", "weather", "time"] },
  { id: "lvPq2yF1WQY", title: "I'm vs I do | 39-dars", lesson: 39, topics: ["present simple", "present continuous", "difference"] },
  { id: "g4yMlH3QZmE", title: "Question forms in tenses | 40-dars", lesson: 40, topics: ["questions", "tenses", "question forms"] },
  { id: "EwTazaFX6LY", title: "Too / either / Neither do / So am I | 41-dars", lesson: 41, topics: ["too", "either", "neither", "so", "agreement"] },
  { id: "13Kz9f9sEhY", title: "Haven't / Don't / Isn't | 42-dars", lesson: 42, topics: ["negatives", "auxiliary verbs", "haven't", "don't", "isn't"] },
  { id: "rsijLLBLRsU", title: "Have you ... ? / Do they ... ? | 43-dars", lesson: 43, topics: ["questions", "auxiliary verbs", "have", "do"] },
  { id: "4mrLSvN_Qs4", title: "Who say you vs Who did you see | 44-dars", lesson: 44, topics: ["who", "question words", "subject object questions"] },
  { id: "yBZTL6Kssck", title: "What is it like? | 45-dars", lesson: 45, topics: ["like", "descriptions", "what is it like"] },
  { id: "PE7fkwAxH-Y", title: "What? Which? How? | 46-dars", lesson: 46, topics: ["question words", "what", "which", "how"] },
  { id: "ltNsnrk7774", title: "How long does it take? | 47-dars", lesson: 47, topics: ["how long", "duration", "time"] },
  { id: "-ZRsTNWQYI4", title: "Do you know where ... ? | 48-dars", lesson: 48, topics: ["indirect questions", "embedded questions"] },
  { id: "Bf5vZP4ckyU", title: "She said that | 49-dars", lesson: 49, topics: ["reported speech", "said", "told"] },
  { id: "f5RX9iNt-_Y", title: "Work vs working | 50-dars", lesson: 50, topics: ["infinitive", "gerund", "work working"] },
  { id: "KaZDD-rG-h8", title: "I want to do vs I enjoy doing | 51-dars", lesson: 51, topics: ["infinitive", "gerund", "verb patterns"] },
  { id: "eetqsi6CkZQ", title: "I told you to ... | 52-dars", lesson: 52, topics: ["infinitive", "tell ask", "verb patterns"] },
  { id: "rCPRlThNmOI", title: "I went to the shop to ... | 53-dars", lesson: 53, topics: ["infinitive of purpose", "to do"] },
  { id: "S0db9gFaGdQ", title: "Go to / Go on / Go for | 54-dars", lesson: 54, topics: ["go", "phrasal verbs", "collocations"] },
  { id: "y4TBbP2K9d4", title: "Get a letter / Get a job | 55-dars", lesson: 55, topics: ["get", "collocations", "phrasal verbs"] },
  { id: "bDf7xZyicxM", title: "Do vs Make | 56-dars", lesson: 56, topics: ["do", "make", "collocations"] },
  { id: "oNW6JV8yMDs", title: "Have or Have got | 57-dars", lesson: 57, topics: ["have", "have got", "possession"] },
  { id: "FLUwRWhGZcc", title: "Pronouns | 58-dars", lesson: 58, topics: ["pronouns", "I me my mine", "personal pronouns"] },
  { id: "3OwiFP-eTmE", title: "Pronouns | 59-dars", lesson: 59, topics: ["pronouns", "object pronouns"] },
  { id: "yRJmaCGmaDg", title: "Whose is this? It's mine. | 60-dars", lesson: 60, topics: ["possessive pronouns", "whose", "mine yours"] },
  { id: "khlpr-PjsCo", title: "Pronouns Part 1 | 61-dars", lesson: 61, topics: ["pronouns", "reflexive pronouns"] },
  { id: "w4e2YVU5vbk", title: "Pronouns Part 2 | 62-dars", lesson: 62, topics: ["pronouns", "relative pronouns"] },
  { id: "FmFilejfH00", title: "-ning kelishik qo'shimchasi | 63-dars", lesson: 63, topics: ["possessive", "genitive", "'s"] },
  { id: "9cO0taZ6zLA", title: "A and an articles | 64-dars", lesson: 64, topics: ["articles", "a", "an", "indefinite article"] },
  { id: "8cEmTtO6mDE", title: "Singular and Plural nouns | 65-dars", lesson: 65, topics: ["singular", "plural", "nouns", "s es"] },
  { id: "q5rWCTq47iU", title: "Countable and Uncountable nouns | 66-dars", lesson: 66, topics: ["countable", "uncountable", "nouns"] },
  { id: "EVdjIIbRkrI", title: "Countable and Uncountable nouns | 67-dars", lesson: 67, topics: ["countable", "uncountable", "some any much many"] },
  { id: "49RNu3zbR5U", title: "A vs The | Articles | 68-dars", lesson: 68, topics: ["articles", "a", "the", "definite article"] },
  { id: "dOp6p--WgS4", title: "The article | 69-dars", lesson: 69, topics: ["the", "definite article", "articles"] },
  { id: "io7vw34DGio", title: "Go to work vs Go home | 70-dars", lesson: 70, topics: ["articles", "no article", "zero article"] },
  { id: "rKJQv8Vquuc", title: "When NOT to use 'the' | 71-dars", lesson: 71, topics: ["articles", "no article", "the"] },
  { id: "S_YCCGK-Zxc", title: "Names of places | 72-dars", lesson: 72, topics: ["articles", "proper nouns", "geography"] },
  { id: "UY6oRh4cC_4", title: "That/This/Those/These | 73-dars", lesson: 73, topics: ["demonstratives", "this that these those"] },
  { id: "ddC4HqzPevA", title: "One vs Ones | 74-dars", lesson: 74, topics: ["one", "ones", "substitution"] },
  { id: "RCC6J4wlw9Q", title: "Some vs Any | 75-dars", lesson: 75, topics: ["some", "any", "determiners"] },
  { id: "eA1grZkCozU", title: "No + any / No / None | 76-dars", lesson: 76, topics: ["no", "none", "any", "negatives"] },
  { id: "Jza-8IOZsM8", title: "Not+anybody vs Nobody | 77-dars", lesson: 77, topics: ["nobody", "anybody", "nothing", "anything"] },
  { id: "Q8huffFVv70", title: "Somebody/Anything/Nowhere | 78-dars", lesson: 78, topics: ["somebody", "anything", "nowhere", "indefinite pronouns"] },
  { id: "waJTRVrGtNM", title: "Every vs All | 79-dars", lesson: 79, topics: ["every", "all", "quantifiers"] },
  { id: "NAaBhYgOvzQ", title: "All/Most/Some/Any | 80-dars", lesson: 80, topics: ["all", "most", "some", "any", "quantifiers"] },
  { id: "0uU9VH2p67Y", title: "Both / Either / Neither | 81-dars", lesson: 81, topics: ["both", "either", "neither"] },
  { id: "TloXXwIeSMo", title: "A lot / Much / Many | 82-dars", lesson: 82, topics: ["a lot", "much", "many", "quantifiers"] },
  { id: "iFTrQy_3-O8", title: "A little vs A few | 83-dars", lesson: 83, topics: ["a little", "a few", "quantifiers"] },
  { id: "OaPMtoGixBs", title: "Adjectives | 84-dars", lesson: 84, topics: ["adjectives", "description", "word order"] },
  { id: "rDdj4I2FSZg", title: "Adverbs | 85-dars", lesson: 85, topics: ["adverbs", "quickly slowly", "manner"] },
  { id: "pcjGsmbDc3o", title: "Old vs Older | 86-dars", lesson: 86, topics: ["comparative", "adjectives", "older bigger"] },
  { id: "p091YqwUMWY", title: "Older / More expensive than... | 87-dars", lesson: 87, topics: ["comparative", "more than", "adjectives"] },
  { id: "aHd3KbWPzoM", title: "Not as... as | 88-dars", lesson: 88, topics: ["as...as", "comparison", "not as"] },
  { id: "XRqG17D0zVw", title: "The oldest / The most expensive | 89-dars", lesson: 89, topics: ["superlative", "the most", "the best"] },
  { id: "e0PSWp9uyY8", title: "Enough | 90-dars", lesson: 90, topics: ["enough", "adjective + enough"] },
  { id: "Z0Zqo-LfmSg", title: "Too | 91-dars", lesson: 91, topics: ["too", "too much", "too many"] },
  { id: "hSlJmfz4hUw", title: "Word order 1 | 92-dars", lesson: 92, topics: ["word order", "sentence structure"] },
  { id: "QaNWQkzDZyo", title: "Word order 2 | 93-dars", lesson: 93, topics: ["word order", "adverb placement"] },
  { id: "7aG3-5hKaDY", title: "Still vs Yet | 94-dars", lesson: 94, topics: ["still", "yet", "already", "time expressions"] },
  { id: "yJ4YCzrfSVE", title: "Give me.. / Give it to... | 95-dars", lesson: 95, topics: ["give", "indirect object", "to for"] },
  { id: "UR-5WGOz6BQ", title: "At / On / In | 96-dars", lesson: 96, topics: ["prepositions", "at", "on", "in", "time place"] },
  { id: "lwpu0ZAVQBg", title: "From... to, Until, Since, For | 97-dars", lesson: 97, topics: ["prepositions", "from to", "until", "since", "for"] },
  { id: "DPof4n7-yjo", title: "Before, After, During, While | 98-dars", lesson: 98, topics: ["prepositions", "before", "after", "during", "while", "conjunctions"] },
  { id: "-kRhiZzOuiA", title: "In / At (Places) | 99-dars", lesson: 99, topics: ["prepositions", "in", "at", "places", "location"] },
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { wrongQuestions, level, skill } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Build video list for AI context
    const videoList = PLAYLIST_VIDEOS.map(v => 
      `[${v.lesson}] "${v.title}" topics: ${v.topics.join(", ")}`
    ).join("\n");

    const systemPrompt = `You are an English learning assistant. Analyze the student's wrong answers and identify which grammar/vocabulary topics they are weak in.

Then, from the following video lesson list, select the most relevant videos (3-6 videos) that would help the student improve on their weak areas.

VIDEO LESSONS (format: [lesson_number] "title" topics: ...):
${videoList}

RULES:
- Return lesson numbers (integers) of the most relevant videos
- Match wrong answer topics to video topics carefully
- Write all descriptions in Uzbek language
- Level: ${level}, Skill: ${skill}
- Select 3-6 most relevant videos only`;

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
          { role: "user", content: `Wrong questions:\n${JSON.stringify(wrongQuestions, null, 2)}` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "suggest_videos",
            description: "Return matched video lesson numbers and analysis",
            parameters: {
              type: "object",
              properties: {
                weakTopics: { type: "array", items: { type: "string" }, description: "List of weak topics identified" },
                selectedLessons: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      lessonNumber: { type: "integer", description: "Lesson number from the video list" },
                      reason: { type: "string", description: "Why this video is relevant, in Uzbek" },
                    },
                    required: ["lessonNumber", "reason"],
                  },
                },
                overallAdvice: { type: "string", description: "Overall learning advice in Uzbek" },
              },
              required: ["weakTopics", "selectedLessons", "overallAdvice"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "suggest_videos" } },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limit" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "Kredit yetarli emas" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI error [${response.status}]: ${errorBody}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    const aiResult = toolCall ? JSON.parse(toolCall.function.arguments) : null;

    if (!aiResult) {
      return new Response(JSON.stringify({ result: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Map AI selected lessons to real video data
    const videos = (aiResult.selectedLessons || [])
      .map((sel: any) => {
        const video = PLAYLIST_VIDEOS.find(v => v.lesson === sel.lessonNumber);
        if (!video) return null;
        return {
          title: video.title,
          channel: "IBRAT FARZANDLARI",
          url: `https://www.youtube.com/watch?v=${video.id}&list=PLkREkayoYCyI9KGsZ2TfeVccRv9zqP0gl&index=${video.lesson + 1}`,
          description: sel.reason,
          topic: video.topics[0],
        };
      })
      .filter(Boolean);

    const result = {
      weakTopics: aiResult.weakTopics || [],
      videos,
      overallAdvice: aiResult.overallAdvice || "",
    };

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("recommend-videos error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
