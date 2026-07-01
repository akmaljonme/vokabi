export interface School {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  owner_id: string;
  plan: 'free' | 'basic' | 'pro';
  max_teachers: number;
  max_students: number;
  created_at: string;
  telegram_chat_id?: string | null;
}

export interface SchoolTeacher {
  id: string;
  school_id: string;
  user_id: string;
  name: string;
  subject: string;
  created_at: string;
}

export interface SchoolClass {
  id: string;
  school_id: string;
  teacher_id: string;
  name: string;
  level: string;
  invite_code: string;
  created_at: string;
  student_count?: number;
}

export interface SchoolStudent {
  id: string;
  class_id: string;
  user_id: string;
  full_name: string;
  streak: number;
  xp: number;
  joined_at: string;
}

export interface Assignment {
  id: string;
  class_id: string;
  teacher_id: string;
  title: string;
  description?: string;
  type: 'test' | 'essay' | 'game' | 'vocabulary';
  due_date?: string;
  max_score: number;
  created_at: string;
}

export interface Submission {
  id: string;
  assignment_id: string;
  student_id: string;
  score?: number;
  content?: string;
  ai_feedback?: string;
  submitted_at: string;
}

export interface Payment {
  id: string;
  school_id: string;
  amount: number;
  currency: string;
  provider: 'payme' | 'click' | 'cash';
  status: 'pending' | 'paid' | 'failed';
  created_at: string;
}
