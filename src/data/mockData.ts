import { CEFRLevel, MockTest, Part, QuestionType } from '@/types/cefr';

const generateQuestions = (
  partId: number,
  startId: number,
  type: QuestionType,
  level: CEFRLevel
): Part['questions'] => {
  const questions: Part['questions'] = [];
  
  for (let i = 0; i < 10; i++) {
    const questionId = startId + i;
    
    switch (type) {
      case 'matching-headings':
        questions.push({
          id: questionId,
          type,
          question: `Match the heading to paragraph ${String.fromCharCode(65 + i)}`,
          options: [
            'The importance of early education',
            'Modern technological advances',
            'Environmental challenges today',
            'Economic growth patterns',
            'Cultural heritage preservation',
            'Health and wellness trends',
            'Scientific discoveries',
            'Urban development issues',
          ],
          correctAnswer: ['The importance of early education', 'Modern technological advances', 'Environmental challenges today'][i % 3],
        });
        break;

      case 'matching-paragraph':
        questions.push({
          id: questionId,
          type,
          question: `Which paragraph contains information about: "${['renewable energy sources', 'population growth', 'technological innovation', 'climate change effects', 'economic policies', 'educational reforms', 'healthcare systems', 'cultural diversity', 'urban planning', 'scientific research'][i]}"?`,
          options: ['A', 'B', 'C', 'D', 'E', 'F'],
          correctAnswer: ['A', 'B', 'C', 'D', 'E', 'F'][i % 6],
          paragraph: String.fromCharCode(65 + (i % 6)),
        });
        break;

      case 'multiple-choice':
        questions.push({
          id: questionId,
          type,
          question: `Question ${i + 1}: According to the passage, what is the main ${['purpose', 'reason', 'effect', 'cause', 'result'][i % 5]} of ${['the study', 'the research', 'the findings', 'the conclusion', 'the analysis'][i % 5]}?`,
          options: [
            'To demonstrate the importance of the subject',
            'To provide evidence for the theory',
            'To challenge existing assumptions',
            'To propose new solutions',
          ],
          correctAnswer: 'To demonstrate the importance of the subject',
        });
        break;

      case 'matching-features':
        questions.push({
          id: questionId,
          type,
          question: `Match feature ${i + 1} with the correct category`,
          options: ['Category A', 'Category B', 'Category C', 'Category D'],
          correctAnswer: ['Category A', 'Category B', 'Category C', 'Category D'][i % 4],
        });
        break;

      case 'matching-endings':
        questions.push({
          id: questionId,
          type,
          question: `Complete the sentence: "The research shows that..."`,
          options: [
            'significant progress has been made.',
            'further investigation is needed.',
            'the results were inconclusive.',
            'new methods should be adopted.',
          ],
          correctAnswer: 'significant progress has been made.',
        });
        break;

      case 'list-selection':
        questions.push({
          id: questionId,
          type,
          question: `Select TWO factors mentioned in the passage that contribute to ${['success', 'failure', 'growth', 'development', 'change'][i % 5]}:`,
          options: [
            'Increased funding',
            'Better training',
            'New technology',
            'Government support',
            'Public awareness',
          ],
          correctAnswer: ['Increased funding', 'Better training'],
        });
        break;

      case 'choose-title':
        questions.push({
          id: questionId,
          type,
          question: 'Which title best fits this passage?',
          options: [
            'A New Era of Discovery',
            'Challenges and Solutions',
            'The Path Forward',
            'Understanding Change',
          ],
          correctAnswer: 'A New Era of Discovery',
        });
        break;
    }
  }
  
  return questions;
};

const createPassage = (partNum: number, level: CEFRLevel): Part['passage'] => {
  const topics = [
    {
      title: 'The Future of Renewable Energy',
      content: `The global transition to renewable energy sources represents one of the most significant shifts in human history. As climate change continues to pose unprecedented challenges, nations worldwide are accelerating their efforts to reduce dependence on fossil fuels.

Solar power has emerged as a frontrunner in this transformation. The cost of solar panels has dropped by over 90% since 2010, making it increasingly competitive with traditional energy sources. Countries like Germany, China, and the United States have invested heavily in solar infrastructure, creating millions of jobs in the process.

Wind energy has similarly experienced remarkable growth. Offshore wind farms, in particular, offer tremendous potential for generating clean electricity. The United Kingdom has become a world leader in offshore wind, with projects capable of powering millions of homes.

However, the transition is not without challenges. Energy storage remains a critical hurdle, as renewable sources depend on weather conditions. Battery technology is advancing rapidly, but grid-scale storage solutions are still being developed.

The economic implications are equally significant. While some traditional energy jobs may be displaced, the renewable sector is creating new opportunities. Training programs and educational initiatives are helping workers transition to these emerging fields.

Government policies play a crucial role in this transition. Subsidies, tax incentives, and regulatory frameworks can either accelerate or hinder progress. International cooperation, such as the Paris Agreement, provides a framework for collective action.`,
      paragraphs: [
        { label: 'A', text: 'The global transition to renewable energy sources represents one of the most significant shifts in human history. As climate change continues to pose unprecedented challenges, nations worldwide are accelerating their efforts to reduce dependence on fossil fuels.' },
        { label: 'B', text: 'Solar power has emerged as a frontrunner in this transformation. The cost of solar panels has dropped by over 90% since 2010, making it increasingly competitive with traditional energy sources. Countries like Germany, China, and the United States have invested heavily in solar infrastructure, creating millions of jobs in the process.' },
        { label: 'C', text: 'Wind energy has similarly experienced remarkable growth. Offshore wind farms, in particular, offer tremendous potential for generating clean electricity. The United Kingdom has become a world leader in offshore wind, with projects capable of powering millions of homes.' },
        { label: 'D', text: 'However, the transition is not without challenges. Energy storage remains a critical hurdle, as renewable sources depend on weather conditions. Battery technology is advancing rapidly, but grid-scale storage solutions are still being developed.' },
        { label: 'E', text: 'The economic implications are equally significant. While some traditional energy jobs may be displaced, the renewable sector is creating new opportunities. Training programs and educational initiatives are helping workers transition to these emerging fields.' },
        { label: 'F', text: 'Government policies play a crucial role in this transition. Subsidies, tax incentives, and regulatory frameworks can either accelerate or hinder progress. International cooperation, such as the Paris Agreement, provides a framework for collective action.' },
      ],
    },
    {
      title: 'Digital Transformation in Education',
      content: `The integration of technology in education has fundamentally changed how students learn and teachers instruct. From interactive whiteboards to virtual reality experiences, digital tools are reshaping classrooms worldwide.

Online learning platforms have democratized access to education. Students in remote areas can now access courses from prestigious universities, breaking down geographical barriers that once limited educational opportunities.

Artificial intelligence is personalizing learning experiences. Adaptive learning systems analyze student performance and adjust content accordingly, ensuring each learner receives appropriate challenges and support.

However, concerns about screen time and digital distraction persist. Educators must balance the benefits of technology with the importance of face-to-face interaction and physical activity.

The COVID-19 pandemic accelerated digital adoption in education. Schools that had hesitated to embrace technology were forced to adapt quickly, revealing both opportunities and inequalities in digital access.

Looking forward, the future of education likely combines the best of both traditional and digital approaches. Hybrid models that leverage technology while maintaining human connection may offer the most effective learning environments.`,
      paragraphs: [
        { label: 'A', text: 'The integration of technology in education has fundamentally changed how students learn and teachers instruct. From interactive whiteboards to virtual reality experiences, digital tools are reshaping classrooms worldwide.' },
        { label: 'B', text: 'Online learning platforms have democratized access to education. Students in remote areas can now access courses from prestigious universities, breaking down geographical barriers that once limited educational opportunities.' },
        { label: 'C', text: 'Artificial intelligence is personalizing learning experiences. Adaptive learning systems analyze student performance and adjust content accordingly, ensuring each learner receives appropriate challenges and support.' },
        { label: 'D', text: 'However, concerns about screen time and digital distraction persist. Educators must balance the benefits of technology with the importance of face-to-face interaction and physical activity.' },
        { label: 'E', text: 'The COVID-19 pandemic accelerated digital adoption in education. Schools that had hesitated to embrace technology were forced to adapt quickly, revealing both opportunities and inequalities in digital access.' },
        { label: 'F', text: 'Looking forward, the future of education likely combines the best of both traditional and digital approaches. Hybrid models that leverage technology while maintaining human connection may offer the most effective learning environments.' },
      ],
    },
    {
      title: 'Urban Planning and Sustainable Cities',
      content: `As urban populations continue to grow, cities face mounting pressure to develop sustainably. Smart city initiatives are combining technology and urban planning to create more livable, efficient environments.

Public transportation is central to sustainable urban development. Cities investing in metro systems, bus rapid transit, and cycling infrastructure are reducing traffic congestion and air pollution while improving quality of life for residents.

Green spaces play a vital role in urban well-being. Parks, gardens, and urban forests provide recreational opportunities, improve air quality, and help cities adapt to climate change by reducing heat island effects.

Affordable housing remains a critical challenge in many cities. Rising property values often push lower-income residents to the periphery, creating social segregation and increasing commute times.

Innovative architectural approaches are addressing environmental concerns. Green buildings with energy-efficient designs, solar panels, and rainwater harvesting systems are becoming increasingly common in new developments.

The concept of the "15-minute city" has gained traction, proposing that all essential services should be accessible within a short walk or bike ride from residents' homes.`,
      paragraphs: [
        { label: 'A', text: 'As urban populations continue to grow, cities face mounting pressure to develop sustainably. Smart city initiatives are combining technology and urban planning to create more livable, efficient environments.' },
        { label: 'B', text: 'Public transportation is central to sustainable urban development. Cities investing in metro systems, bus rapid transit, and cycling infrastructure are reducing traffic congestion and air pollution while improving quality of life for residents.' },
        { label: 'C', text: 'Green spaces play a vital role in urban well-being. Parks, gardens, and urban forests provide recreational opportunities, improve air quality, and help cities adapt to climate change by reducing heat island effects.' },
        { label: 'D', text: 'Affordable housing remains a critical challenge in many cities. Rising property values often push lower-income residents to the periphery, creating social segregation and increasing commute times.' },
        { label: 'E', text: 'Innovative architectural approaches are addressing environmental concerns. Green buildings with energy-efficient designs, solar panels, and rainwater harvesting systems are becoming increasingly common in new developments.' },
        { label: 'F', text: 'The concept of the "15-minute city" has gained traction, proposing that all essential services should be accessible within a short walk or bike ride from residents\' homes.' },
      ],
    },
    {
      title: 'The Science of Sleep and Productivity',
      content: `Research into sleep science has revealed the profound impact of rest on human performance. Understanding sleep patterns and their effects on productivity has become crucial in our 24/7 connected world.

The circadian rhythm, our internal biological clock, regulates sleep-wake cycles. Disruptions to this rhythm, whether from shift work, jet lag, or excessive screen time, can have significant health consequences.

Sleep deprivation affects cognitive function in measurable ways. Studies show that going without sleep for 24 hours impairs judgment and reaction time to a degree comparable to being legally drunk.

Workplace policies are beginning to reflect sleep science findings. Some companies now offer nap rooms, flexible scheduling, and education about sleep hygiene to improve employee well-being and productivity.

Technology both helps and hinders healthy sleep. While devices emit blue light that can disrupt sleep, apps and wearables now track sleep patterns and provide insights for improvement.

The economic cost of sleep deprivation is substantial. Lost productivity, healthcare expenses, and workplace accidents related to fatigue cost economies billions annually.`,
      paragraphs: [
        { label: 'A', text: 'Research into sleep science has revealed the profound impact of rest on human performance. Understanding sleep patterns and their effects on productivity has become crucial in our 24/7 connected world.' },
        { label: 'B', text: 'The circadian rhythm, our internal biological clock, regulates sleep-wake cycles. Disruptions to this rhythm, whether from shift work, jet lag, or excessive screen time, can have significant health consequences.' },
        { label: 'C', text: 'Sleep deprivation affects cognitive function in measurable ways. Studies show that going without sleep for 24 hours impairs judgment and reaction time to a degree comparable to being legally drunk.' },
        { label: 'D', text: 'Workplace policies are beginning to reflect sleep science findings. Some companies now offer nap rooms, flexible scheduling, and education about sleep hygiene to improve employee well-being and productivity.' },
        { label: 'E', text: 'Technology both helps and hinders healthy sleep. While devices emit blue light that can disrupt sleep, apps and wearables now track sleep patterns and provide insights for improvement.' },
        { label: 'F', text: 'The economic cost of sleep deprivation is substantial. Lost productivity, healthcare expenses, and workplace accidents related to fatigue cost economies billions annually.' },
      ],
    },
  ];

  const topic = topics[(partNum - 1) % topics.length];
  return {
    id: partNum,
    title: topic.title,
    content: topic.content,
    paragraphs: topic.paragraphs,
  };
};

const questionTypes: QuestionType[] = [
  'matching-headings',
  'matching-paragraph',
  'multiple-choice',
  'matching-features',
];

export const generateMockTest = (
  mockId: number,
  level: CEFRLevel,
  skill: 'reading' | 'listening'
): MockTest => {
  const parts: Part[] = [];
  
  for (let partNum = 1; partNum <= 4; partNum++) {
    const questionType = questionTypes[(mockId + partNum) % questionTypes.length];
    parts.push({
      id: partNum,
      title: `Part ${partNum}`,
      instruction: getInstructionForType(questionType),
      passage: createPassage(partNum, level),
      questions: generateQuestions(partNum, (partNum - 1) * 10 + 1, questionType, level),
      questionType,
    });
  }

  return {
    id: mockId,
    level,
    skill,
    parts,
    timeLimit: 30 * 60, // 30 minutes in seconds
    audioUrl: skill === 'listening' ? `/audio/${level.toLowerCase()}_mock_${mockId}.mp3` : undefined,
  };
};

const getInstructionForType = (type: QuestionType): string => {
  switch (type) {
    case 'matching-headings':
      return 'Read the passage and match the headings (i-viii) to the paragraphs (A-F). You may not use all the headings.';
    case 'matching-paragraph':
      return 'The passage has six paragraphs, A-F. Which paragraph contains the following information? You may use any letter more than once.';
    case 'multiple-choice':
      return 'Choose the correct answer, A, B, C, or D, based on the information in the passage.';
    case 'matching-features':
      return 'Match each feature with the correct category according to the passage.';
    case 'matching-endings':
      return 'Complete each sentence with the correct ending, A-D.';
    case 'list-selection':
      return 'Choose TWO letters, A-E, that correctly answer each question.';
    case 'choose-title':
      return 'Choose the most suitable title for this passage.';
    default:
      return 'Answer the following questions based on the passage.';
  }
};

export const getAllMocksForLevel = (level: CEFRLevel): { reading: number[]; listening: number[] } => {
  return {
    reading: Array.from({ length: 20 }, (_, i) => i + 1),
    listening: Array.from({ length: 20 }, (_, i) => i + 1),
  };
};

export const levels: { level: CEFRLevel; name: string; description: string; color: string }[] = [
  { level: 'A1', name: 'Beginner', description: 'Basic phrases and everyday expressions', color: 'level-a1' },
  { level: 'A2', name: 'Elementary', description: 'Simple everyday communication', color: 'level-a2' },
  { level: 'B1', name: 'Intermediate', description: 'Handle most travel situations', color: 'level-b1' },
  { level: 'B2', name: 'Upper Intermediate', description: 'Complex texts and discussions', color: 'level-b2' },
  { level: 'C1', name: 'Advanced', description: 'Fluent and spontaneous expression', color: 'level-c1' },
];
