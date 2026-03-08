export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          category: string
          created_at: string
          description: string
          icon: string
          id: string
          key: string
          threshold: number
          title: string
          xp_reward: number
        }
        Insert: {
          category?: string
          created_at?: string
          description: string
          icon?: string
          id?: string
          key: string
          threshold?: number
          title: string
          xp_reward?: number
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          icon?: string
          id?: string
          key?: string
          threshold?: number
          title?: string
          xp_reward?: number
        }
        Relationships: []
      }
      audio_files: {
        Row: {
          created_at: string
          duration: number | null
          file_name: string
          file_url: string
          id: string
          order_index: number
          question_id: string | null
          test_id: string | null
          transcript: string | null
        }
        Insert: {
          created_at?: string
          duration?: number | null
          file_name: string
          file_url: string
          id?: string
          order_index?: number
          question_id?: string | null
          test_id?: string | null
          transcript?: string | null
        }
        Update: {
          created_at?: string
          duration?: number | null
          file_name?: string
          file_url?: string
          id?: string
          order_index?: number
          question_id?: string | null
          test_id?: string | null
          transcript?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audio_files_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audio_files_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
        ]
      }
      call_signals: {
        Row: {
          callee_id: string
          caller_id: string
          created_at: string
          id: string
          signal_data: Json | null
          signal_type: string
        }
        Insert: {
          callee_id: string
          caller_id: string
          created_at?: string
          id?: string
          signal_data?: Json | null
          signal_type: string
        }
        Update: {
          callee_id?: string
          caller_id?: string
          created_at?: string
          id?: string
          signal_data?: Json | null
          signal_type?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          audio_url: string | null
          content: string
          created_at: string
          id: string
          image_url: string | null
          room_id: string
          user_id: string
        }
        Insert: {
          audio_url?: string | null
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          room_id: string
          user_id: string
        }
        Update: {
          audio_url?: string | null
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_rooms: {
        Row: {
          created_at: string
          description: string | null
          id: string
          level: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          level?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          level?: string
          name?: string
        }
        Relationships: []
      }
      direct_messages: {
        Row: {
          audio_url: string | null
          content: string
          created_at: string
          id: string
          image_url: string | null
          is_read: boolean
          receiver_id: string
          sender_id: string
        }
        Insert: {
          audio_url?: string | null
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_read?: boolean
          receiver_id: string
          sender_id: string
        }
        Update: {
          audio_url?: string | null
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_read?: boolean
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      exam_attempts: {
        Row: {
          answers: Json | null
          completed_at: string | null
          exam_id: string
          id: string
          passed: boolean | null
          percentage: number | null
          score: number | null
          started_at: string
          time_taken: number | null
          total_questions: number | null
          user_id: string
        }
        Insert: {
          answers?: Json | null
          completed_at?: string | null
          exam_id: string
          id?: string
          passed?: boolean | null
          percentage?: number | null
          score?: number | null
          started_at?: string
          time_taken?: number | null
          total_questions?: number | null
          user_id: string
        }
        Update: {
          answers?: Json | null
          completed_at?: string | null
          exam_id?: string
          id?: string
          passed?: boolean | null
          percentage?: number | null
          score?: number | null
          started_at?: string
          time_taken?: number | null
          total_questions?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_attempts_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_audio_files: {
        Row: {
          created_at: string
          duration: number | null
          exam_id: string
          file_name: string
          file_url: string
          id: string
          order_index: number
          transcript: string | null
        }
        Insert: {
          created_at?: string
          duration?: number | null
          exam_id: string
          file_name: string
          file_url: string
          id?: string
          order_index?: number
          transcript?: string | null
        }
        Update: {
          created_at?: string
          duration?: number | null
          exam_id?: string
          file_name?: string
          file_url?: string
          id?: string
          order_index?: number
          transcript?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exam_audio_files_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_group_members: {
        Row: {
          added_at: string
          group_id: string
          id: string
          user_id: string
        }
        Insert: {
          added_at?: string
          group_id: string
          id?: string
          user_id: string
        }
        Update: {
          added_at?: string
          group_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "exam_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_group_permissions: {
        Row: {
          exam_id: string
          granted_at: string
          group_id: string
          id: string
        }
        Insert: {
          exam_id: string
          granted_at?: string
          group_id: string
          id?: string
        }
        Update: {
          exam_id?: string
          granted_at?: string
          group_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_group_permissions_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_group_permissions_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "exam_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_groups: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      exam_questions: {
        Row: {
          correct_answer: string
          created_at: string
          exam_id: string
          explanation: string | null
          id: string
          image_url: string | null
          options: Json | null
          order_index: number
          points: number
          question_text: string
          question_type: string
          updated_at: string
        }
        Insert: {
          correct_answer: string
          created_at?: string
          exam_id: string
          explanation?: string | null
          id?: string
          image_url?: string | null
          options?: Json | null
          order_index?: number
          points?: number
          question_text: string
          question_type: string
          updated_at?: string
        }
        Update: {
          correct_answer?: string
          created_at?: string
          exam_id?: string
          explanation?: string | null
          id?: string
          image_url?: string | null
          options?: Json | null
          order_index?: number
          points?: number
          question_text?: string
          question_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_questions_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_reading_passages: {
        Row: {
          content: string
          created_at: string
          exam_id: string
          id: string
          order_index: number
          paragraphs: Json | null
          title: string
        }
        Insert: {
          content: string
          created_at?: string
          exam_id: string
          id?: string
          order_index?: number
          paragraphs?: Json | null
          title: string
        }
        Update: {
          content?: string
          created_at?: string
          exam_id?: string
          id?: string
          order_index?: number
          paragraphs?: Json | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_reading_passages_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_user_assignments: {
        Row: {
          assigned_at: string
          exam_id: string
          id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          exam_id: string
          id?: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          exam_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_user_assignments_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      exams: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          level: string
          max_attempts: number
          skill: string
          time_limit: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          level: string
          max_attempts?: number
          skill: string
          time_limit?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          level?: string
          max_attempts?: number
          skill?: string
          time_limit?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      feedbacks: {
        Row: {
          created_at: string
          full_name: string
          id: string
          is_approved: boolean
          level_info: string | null
          message: string
          rating: number
          user_id: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id?: string
          is_approved?: boolean
          level_info?: string | null
          message: string
          rating?: number
          user_id: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          is_approved?: boolean
          level_info?: string | null
          message?: string
          rating?: number
          user_id?: string
        }
        Relationships: []
      }
      game_rooms: {
        Row: {
          created_at: string
          current_turn: string | null
          current_word: string | null
          id: string
          last_move_at: string | null
          player1_id: string
          player1_name: string
          player1_score: number
          player2_id: string | null
          player2_name: string | null
          player2_score: number
          round: number
          status: string
          used_words: Json
          winner_id: string | null
        }
        Insert: {
          created_at?: string
          current_turn?: string | null
          current_word?: string | null
          id?: string
          last_move_at?: string | null
          player1_id: string
          player1_name?: string
          player1_score?: number
          player2_id?: string | null
          player2_name?: string | null
          player2_score?: number
          round?: number
          status?: string
          used_words?: Json
          winner_id?: string | null
        }
        Update: {
          created_at?: string
          current_turn?: string | null
          current_word?: string | null
          id?: string
          last_move_at?: string | null
          player1_id?: string
          player1_name?: string
          player1_score?: number
          player2_id?: string | null
          player2_name?: string | null
          player2_score?: number
          round?: number
          status?: string
          used_words?: Json
          winner_id?: string | null
        }
        Relationships: []
      }
      game_scores: {
        Row: {
          created_at: string
          game_type: string
          id: string
          level: string
          score: number
          user_id: string
        }
        Insert: {
          created_at?: string
          game_type: string
          id?: string
          level?: string
          score?: number
          user_id: string
        }
        Update: {
          created_at?: string
          game_type?: string
          id?: string
          level?: string
          score?: number
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email_notifications: boolean | null
          full_name: string | null
          id: string
          progress_updates: boolean | null
          test_reminders: boolean | null
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email_notifications?: boolean | null
          full_name?: string | null
          id?: string
          progress_updates?: boolean | null
          test_reminders?: boolean | null
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email_notifications?: boolean | null
          full_name?: string | null
          id?: string
          progress_updates?: boolean | null
          test_reminders?: boolean | null
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      questions: {
        Row: {
          category: string
          correct_answer: string
          created_at: string
          explanation: string | null
          id: string
          image_url: string | null
          options: Json | null
          order_index: number
          points: number
          question_text: string
          question_type: string
          test_id: string | null
          updated_at: string
        }
        Insert: {
          category: string
          correct_answer: string
          created_at?: string
          explanation?: string | null
          id?: string
          image_url?: string | null
          options?: Json | null
          order_index?: number
          points?: number
          question_text: string
          question_type: string
          test_id?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          correct_answer?: string
          created_at?: string
          explanation?: string | null
          id?: string
          image_url?: string | null
          options?: Json | null
          order_index?: number
          points?: number
          question_text?: string
          question_type?: string
          test_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
        ]
      }
      reading_passages: {
        Row: {
          content: string
          created_at: string
          id: string
          order_index: number
          paragraphs: Json | null
          test_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          order_index?: number
          paragraphs?: Json | null
          test_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          order_index?: number
          paragraphs?: Json | null
          test_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reading_passages_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          assigned_by: string | null
          created_at: string
          expires_at: string | null
          id: string
          plan: string
          started_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          plan?: string
          started_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_by?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          plan?: string
          started_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      test_results: {
        Row: {
          answers: Json | null
          correct_answers: number
          created_at: string
          id: string
          level: string
          mock_id: number
          passed: boolean
          percentage: number
          skill: string
          time_taken: number
          total_questions: number
          user_id: string
        }
        Insert: {
          answers?: Json | null
          correct_answers: number
          created_at?: string
          id?: string
          level: string
          mock_id: number
          passed: boolean
          percentage: number
          skill: string
          time_taken: number
          total_questions: number
          user_id: string
        }
        Update: {
          answers?: Json | null
          correct_answers?: number
          created_at?: string
          id?: string
          level?: string
          mock_id?: number
          passed?: boolean
          percentage?: number
          skill?: string
          time_taken?: number
          total_questions?: number
          user_id?: string
        }
        Relationships: []
      }
      tests: {
        Row: {
          book_number: number | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          level: string
          randomize_questions: boolean
          skill: string
          time_limit: number
          title: string
          unit_number: number | null
          updated_at: string
        }
        Insert: {
          book_number?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          level: string
          randomize_questions?: boolean
          skill: string
          time_limit?: number
          title: string
          unit_number?: number | null
          updated_at?: string
        }
        Update: {
          book_number?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          level?: string
          randomize_questions?: boolean
          skill?: string
          time_limit?: number
          title?: string
          unit_number?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          id?: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_progress: {
        Row: {
          created_at: string
          current_streak: number
          id: string
          last_activity_date: string | null
          level: number
          longest_streak: number
          tests_completed: number
          total_study_time: number
          updated_at: string
          user_id: string
          xp: number
        }
        Insert: {
          created_at?: string
          current_streak?: number
          id?: string
          last_activity_date?: string | null
          level?: number
          longest_streak?: number
          tests_completed?: number
          total_study_time?: number
          updated_at?: string
          user_id: string
          xp?: number
        }
        Update: {
          created_at?: string
          current_streak?: number
          id?: string
          last_activity_date?: string | null
          level?: number
          longest_streak?: number
          tests_completed?: number
          total_study_time?: number
          updated_at?: string
          user_id?: string
          xp?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_leaderboard: {
        Args: { limit_count?: number }
        Returns: {
          avatar_url: string
          current_streak: number
          full_name: string
          level: number
          user_id: string
          xp: number
        }[]
      }
      get_public_stats: { Args: never; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
