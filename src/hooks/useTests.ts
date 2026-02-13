 import { useState, useEffect } from 'react';
 import { supabase } from '@/integrations/supabase/client';
 import { CEFRLevel, SkillType, MockTest, Part, Question } from '@/types/cefr';
 
 interface DBTest {
   id: string;
   title: string;
   description: string | null;
   level: string;
   skill: string;
   time_limit: number;
   is_active: boolean;
   randomize_questions: boolean;
   created_at: string;
 }
 
interface DBQuestion {
  id: string;
  test_id: string;
  question_text: string;
  question_type: string;
  category: string;
  options: string[] | null;
  correct_answer: string;
  explanation: string | null;
  points: number;
  order_index: number;
  image_url?: string | null;
}
 
interface DBReadingPassage {
  id: string;
  test_id: string;
  title: string;
  content: string;
  paragraphs: { label: string; text: string }[] | null;
  order_index: number;
}

interface DBAudioFile {
  id: string;
  test_id: string;
  file_name: string;
  file_url: string;
  duration: number | null;
  transcript: string | null;
  order_index: number;
}
 
export interface TestInfo {
    id: string;
    title: string;
    description: string | null;
    level: CEFRLevel;
    skill: SkillType;
    timeLimit: number;
    questionCount: number;
    isActive: boolean;
    bookNumber: number | null;
    unitNumber: number | null;
  }
 
 // Fetch all active tests grouped by level and skill
 export const useActiveTests = (level?: CEFRLevel) => {
   const [tests, setTests] = useState<TestInfo[]>([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
 
   useEffect(() => {
     const fetchTests = async () => {
       try {
         let query = supabase
           .from('tests')
           .select('*')
           .eq('is_active', true)
           .order('created_at', { ascending: true });
 
         if (level) {
           query = query.eq('level', level);
         }
 
         const { data: testsData, error: testsError } = await query;
 
         if (testsError) throw testsError;
 
         // Fetch question counts for each test
         const testsWithCounts = await Promise.all(
           ((testsData as DBTest[]) || []).map(async (test) => {
             const { count } = await supabase
               .from('questions')
               .select('*', { count: 'exact', head: true })
               .eq('test_id', test.id);
 
              return {
                id: test.id,
                title: test.title,
                description: test.description,
                level: test.level as CEFRLevel,
                skill: test.skill as SkillType,
                timeLimit: test.time_limit,
                questionCount: count || 0,
                isActive: test.is_active,
                bookNumber: (test as any).book_number || null,
                unitNumber: (test as any).unit_number || null,
              };
           })
         );
 
         setTests(testsWithCounts);
       } catch (err) {
         console.error('Error fetching tests:', err);
         setError('Testlarni yuklashda xatolik');
       } finally {
         setLoading(false);
       }
     };
 
     fetchTests();
   }, [level]);
 
    // Group tests by skill
    const readingTests = tests.filter(t => t.skill === 'reading');
    const listeningTests = tests.filter(t => t.skill === 'listening');
    const vocabularyTests = tests.filter(t => t.skill === 'vocabulary');
    const grammarTests = tests.filter(t => t.skill === 'grammar');
  
    return { tests, readingTests, listeningTests, vocabularyTests, grammarTests, loading, error };
  };
 
 // Fetch a single test with all its questions and passages
 export const useTestWithQuestions = (testId: string | null) => {
   const [test, setTest] = useState<MockTest | null>(null);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
 
   useEffect(() => {
     if (!testId) {
       setLoading(false);
       return;
     }
 
     const fetchTest = async () => {
       try {
         // Fetch test
         const { data: testData, error: testError } = await supabase
           .from('tests')
           .select('*')
           .eq('id', testId)
           .maybeSingle();
 
         if (testError) throw testError;
         if (!testData) {
           setError('Test topilmadi');
           setLoading(false);
           return;
         }
 
         const dbTest = testData as DBTest;
 
         // Fetch questions
         const { data: questionsData, error: questionsError } = await supabase
           .from('questions')
           .select('*')
           .eq('test_id', testId)
           .order('order_index', { ascending: true });
 
         if (questionsError) throw questionsError;
 
          // Fetch reading passages if it's a reading test
          let passagesData: DBReadingPassage[] = [];
          if (dbTest.skill === 'reading') {
            const { data, error: passagesError } = await supabase
              .from('reading_passages')
              .select('*')
              .eq('test_id', testId)
              .order('order_index', { ascending: true });

            if (passagesError) throw passagesError;
            passagesData = ((data || []) as unknown as DBReadingPassage[]);
          }

          // Fetch audio files if it's a listening test
          let audioData: DBAudioFile[] = [];
          if (dbTest.skill === 'listening') {
            const { data, error: audioError } = await (supabase
              .from('audio_files' as any)
              .select('*')
              .eq('test_id', testId)
              .order('order_index', { ascending: true }) as any);

            if (audioError) throw audioError;
            audioData = ((data || []) as DBAudioFile[]);
          }
 
         // Transform to MockTest format
         const questions = (questionsData as DBQuestion[]) || [];
         
         // Group questions into parts (10 questions per part for standard tests)
         const questionsPerPart = 10;
         const numParts = Math.ceil(questions.length / questionsPerPart) || 1;
         
         const parts: Part[] = [];
         for (let i = 0; i < numParts; i++) {
           const partQuestions = questions.slice(i * questionsPerPart, (i + 1) * questionsPerPart);
            const passage = passagesData[i] || {
              id: `part-${i + 1}`,
              title: `Part ${i + 1}`,
              content: dbTest.skill === 'listening' ? 'Audio content' : '',
              paragraphs: null,
            };

            // Find audio for this part
            const partAudio = audioData.find(a => a.order_index === i);

            parts.push({
              id: i + 1,
              title: `Part ${i + 1}`,
              instruction: getInstructionForType(partQuestions[0]?.question_type || 'multiple-choice'),
              passage: {
                id: i + 1,
                title: passage.title,
                content: passage.content,
                paragraphs: passage.paragraphs || undefined,
              },
              questions: partQuestions.map((q, idx) => ({
                id: i * questionsPerPart + idx + 1,
                type: mapQuestionType(q.question_type),
                question: q.question_text,
                options: q.options || [],
                correctAnswer: parseCorrectAnswer(q.correct_answer),
                imageUrl: q.image_url || undefined,
              })),
              questionType: mapQuestionType(partQuestions[0]?.question_type || 'multiple-choice'),
              audioUrl: partAudio?.file_url,
              audioTranscript: partAudio?.transcript || undefined,
            });
         }
 
         // If no questions, create empty parts
         if (parts.length === 0) {
           for (let i = 0; i < 4; i++) {
             parts.push({
               id: i + 1,
               title: `Part ${i + 1}`,
               instruction: 'No questions available',
               passage: {
                 id: i + 1,
                 title: `Part ${i + 1}`,
                 content: 'No content available',
               },
               questions: [],
               questionType: 'multiple-choice',
             });
           }
         }
 
         const mockTest: MockTest = {
           id: 1, // Legacy compatibility
           level: dbTest.level as CEFRLevel,
           skill: dbTest.skill as SkillType,
           parts,
           timeLimit: dbTest.time_limit,
         };
 
         setTest(mockTest);
       } catch (err) {
         console.error('Error fetching test:', err);
         setError('Testni yuklashda xatolik');
       } finally {
         setLoading(false);
       }
     };
 
     fetchTest();
   }, [testId]);
 
   return { test, loading, error };
 };
 
 // Helper to map DB question types to CEFR types
 const mapQuestionType = (dbType: string): Question['type'] => {
   const typeMap: Record<string, Question['type']> = {
     'multiple-choice': 'multiple-choice',
     'true-false': 'multiple-choice',
     'fill-blank': 'matching-endings',
     'matching': 'matching-features',
   };
   return typeMap[dbType] || 'multiple-choice';
 };
 
 // Parse correct answer (could be JSON array or string)
 const parseCorrectAnswer = (answer: string): string | string[] => {
   try {
     const parsed = JSON.parse(answer);
     if (Array.isArray(parsed)) return parsed;
     return answer;
   } catch {
     return answer;
   }
 };
 
 // Get instruction text for question type
 const getInstructionForType = (type: string): string => {
   const instructions: Record<string, string> = {
     'multiple-choice': 'Choose the correct answer from the options below.',
     'true-false': 'Decide if the statement is true or false.',
     'fill-blank': 'Fill in the blank with the correct answer.',
     'matching': 'Match the items correctly.',
     'matching-headings': 'Match the headings to the paragraphs.',
     'matching-paragraph': 'Which paragraph contains this information?',
     'matching-features': 'Match each feature with the correct category.',
     'matching-endings': 'Complete each sentence with the correct ending.',
     'list-selection': 'Choose TWO correct answers.',
     'choose-title': 'Choose the most suitable title.',
   };
   return instructions[type] || 'Answer the following questions.';
 };