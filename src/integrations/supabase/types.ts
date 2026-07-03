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
      advertisements: {
        Row: {
          click_count: number
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string | null
          id: string
          image_url: string | null
          is_active: boolean
          link_text: string
          link_url: string | null
          position: string
          priority: number
          show_to: string
          start_date: string | null
          title: string
          type: string
          updated_at: string
          view_count: number
        }
        Insert: {
          click_count?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          link_text?: string
          link_url?: string | null
          position?: string
          priority?: number
          show_to?: string
          start_date?: string | null
          title: string
          type?: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          click_count?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          link_text?: string
          link_url?: string | null
          position?: string
          priority?: number
          show_to?: string
          start_date?: string | null
          title?: string
          type?: string
          updated_at?: string
          view_count?: number
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
          forwarded_from: string | null
          id: string
          image_url: string | null
          reply_to_id: string | null
          room_id: string
          user_id: string
        }
        Insert: {
          audio_url?: string | null
          content: string
          created_at?: string
          forwarded_from?: string | null
          id?: string
          image_url?: string | null
          reply_to_id?: string | null
          room_id: string
          user_id: string
        }
        Update: {
          audio_url?: string | null
          content?: string
          created_at?: string
          forwarded_from?: string | null
          id?: string
          image_url?: string | null
          reply_to_id?: string | null
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
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
      daily_challenges: {
        Row: {
          challenge_data: Json
          challenge_date: string
          challenge_type: string
          created_at: string
          description: string
          difficulty: string
          id: string
          title: string
          xp_reward: number
        }
        Insert: {
          challenge_data?: Json
          challenge_date?: string
          challenge_type?: string
          created_at?: string
          description: string
          difficulty?: string
          id?: string
          title: string
          xp_reward?: number
        }
        Update: {
          challenge_data?: Json
          challenge_date?: string
          challenge_type?: string
          created_at?: string
          description?: string
          difficulty?: string
          id?: string
          title?: string
          xp_reward?: number
        }
        Relationships: []
      }
      daily_game_quests: {
        Row: {
          created_at: string
          description: string
          game_type: string | null
          id: string
          quest_date: string
          quest_type: string
          target_value: number
          title: string
          xp_reward: number
        }
        Insert: {
          created_at?: string
          description: string
          game_type?: string | null
          id?: string
          quest_date?: string
          quest_type: string
          target_value?: number
          title: string
          xp_reward?: number
        }
        Update: {
          created_at?: string
          description?: string
          game_type?: string | null
          id?: string
          quest_date?: string
          quest_type?: string
          target_value?: number
          title?: string
          xp_reward?: number
        }
        Relationships: []
      }
      direct_messages: {
        Row: {
          audio_url: string | null
          content: string
          created_at: string
          forwarded_from: string | null
          id: string
          image_url: string | null
          is_read: boolean
          receiver_id: string
          reply_to_id: string | null
          sender_id: string
        }
        Insert: {
          audio_url?: string | null
          content: string
          created_at?: string
          forwarded_from?: string | null
          id?: string
          image_url?: string | null
          is_read?: boolean
          receiver_id: string
          reply_to_id?: string | null
          sender_id: string
        }
        Update: {
          audio_url?: string | null
          content?: string
          created_at?: string
          forwarded_from?: string | null
          id?: string
          image_url?: string | null
          is_read?: boolean
          receiver_id?: string
          reply_to_id?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "direct_messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "direct_messages"
            referencedColumns: ["id"]
          },
        ]
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
          access_code: string | null
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
          access_code?: string | null
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
          access_code?: string | null
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
      friendships: {
        Row: {
          created_at: string
          friend_id: string
          id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          friend_id: string
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          friend_id?: string
          id?: string
          status?: string
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
      message_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          message_id: string
          message_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          message_id: string
          message_type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          message_id?: string
          message_type?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_requests: {
        Row: {
          admin_note: string | null
          amount: number
          created_at: string
          id: string
          plan: string
          receipt_url: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
          user_note: string | null
        }
        Insert: {
          admin_note?: string | null
          amount: number
          created_at?: string
          id?: string
          plan: string
          receipt_url: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
          user_note?: string | null
        }
        Update: {
          admin_note?: string | null
          amount?: number
          created_at?: string
          id?: string
          plan?: string
          receipt_url?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          user_note?: string | null
        }
        Relationships: []
      }
      phone_otp_codes: {
        Row: {
          attempts: number
          code_hash: string
          consumed_at: string | null
          created_at: string
          expires_at: string
          id: string
          phone: string
        }
        Insert: {
          attempts?: number
          code_hash: string
          consumed_at?: string | null
          created_at?: string
          expires_at: string
          id?: string
          phone: string
        }
        Update: {
          attempts?: number
          code_hash?: string
          consumed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          phone?: string
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
          is_pro: boolean | null
          pro_expires_at: string | null
          progress_updates: boolean | null
          promo_code_used: string | null
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
          is_pro?: boolean | null
          pro_expires_at?: string | null
          progress_updates?: boolean | null
          promo_code_used?: string | null
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
          is_pro?: boolean | null
          pro_expires_at?: string | null
          progress_updates?: boolean | null
          promo_code_used?: string | null
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
      school_assignments: {
        Row: {
          class_id: string | null
          completed: boolean | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          skill: string | null
          title: string
        }
        Insert: {
          class_id?: string | null
          completed?: boolean | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          skill?: string | null
          title: string
        }
        Update: {
          class_id?: string | null
          completed?: boolean | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          skill?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_assignments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "school_classes"
            referencedColumns: ["id"]
          },
        ]
      }
      school_classes: {
        Row: {
          created_at: string | null
          id: string
          invite_code: string | null
          level: string | null
          name: string
          school_id: string | null
          teacher_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          invite_code?: string | null
          level?: string | null
          name: string
          school_id?: string | null
          teacher_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          invite_code?: string | null
          level?: string | null
          name?: string
          school_id?: string | null
          teacher_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "school_classes_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      school_students: {
        Row: {
          class_id: string | null
          id: string
          joined_at: string | null
          user_id: string | null
        }
        Insert: {
          class_id?: string | null
          id?: string
          joined_at?: string | null
          user_id?: string | null
        }
        Update: {
          class_id?: string | null
          id?: string
          joined_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "school_students_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "school_classes"
            referencedColumns: ["id"]
          },
        ]
      }
      school_teachers: {
        Row: {
          created_at: string | null
          id: string
          name: string | null
          school_id: string | null
          subject: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name?: string | null
          school_id?: string | null
          subject?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string | null
          school_id?: string | null
          subject?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "school_teachers_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          created_at: string | null
          id: string
          logo_url: string | null
          max_students: number | null
          max_teachers: number | null
          name: string
          owner_id: string | null
          plan: string | null
          slug: string
          teacher_invite_code: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          logo_url?: string | null
          max_students?: number | null
          max_teachers?: number | null
          name: string
          owner_id?: string | null
          plan?: string | null
          slug: string
          teacher_invite_code?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          logo_url?: string | null
          max_students?: number | null
          max_teachers?: number | null
          name?: string
          owner_id?: string | null
          plan?: string | null
          slug?: string
          teacher_invite_code?: string | null
        }
        Relationships: []
      }
      shared_test_results: {
        Row: {
          answers: Json | null
          cheated: boolean | null
          completed_at: string | null
          id: string
          percentage: number
          score: number
          shared_test_id: string | null
          total: number
        }
        Insert: {
          answers?: Json | null
          cheated?: boolean | null
          completed_at?: string | null
          id?: string
          percentage: number
          score: number
          shared_test_id?: string | null
          total: number
        }
        Update: {
          answers?: Json | null
          cheated?: boolean | null
          completed_at?: string | null
          id?: string
          percentage?: number
          score?: number
          shared_test_id?: string | null
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "shared_test_results_shared_test_id_fkey"
            columns: ["shared_test_id"]
            isOneToOne: false
            referencedRelation: "shared_tests"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_tests: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          level: string
          mock_id: number | null
          questions: Json
          skill: string
          test_id: string
          title: string | null
          view_count: number | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          level: string
          mock_id?: number | null
          questions: Json
          skill: string
          test_id: string
          title?: string | null
          view_count?: number | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          level?: string
          mock_id?: number | null
          questions?: Json
          skill?: string
          test_id?: string
          title?: string | null
          view_count?: number | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          assigned_by: string | null
          created_at: string
          expires_at: string | null
          id: string
          plan: string
          plan_key: string | null
          started_at: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          plan?: string
          plan_key?: string | null
          started_at?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_by?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          plan?: string
          plan_key?: string | null
          started_at?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      telegram_phone_links: {
        Row: {
          chat_id: number
          created_at: string
          first_name: string | null
          id: string
          phone: string
          updated_at: string
          username: string | null
        }
        Insert: {
          chat_id: number
          created_at?: string
          first_name?: string | null
          id?: string
          phone: string
          updated_at?: string
          username?: string | null
        }
        Update: {
          chat_id?: number
          created_at?: string
          first_name?: string | null
          id?: string
          phone?: string
          updated_at?: string
          username?: string | null
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
      tournament_daily_progress: {
        Row: {
          box_opened: boolean
          box_result: string | null
          committed: boolean
          created_at: string
          daily_xp: number
          id: string
          listening_done: boolean
          reading_done: boolean
          speaking_done: boolean
          task_date: string
          tournament_id: string
          updated_at: string
          user_id: string
          writing_done: boolean
        }
        Insert: {
          box_opened?: boolean
          box_result?: string | null
          committed?: boolean
          created_at?: string
          daily_xp?: number
          id?: string
          listening_done?: boolean
          reading_done?: boolean
          speaking_done?: boolean
          task_date?: string
          tournament_id: string
          updated_at?: string
          user_id: string
          writing_done?: boolean
        }
        Update: {
          box_opened?: boolean
          box_result?: string | null
          committed?: boolean
          created_at?: string
          daily_xp?: number
          id?: string
          listening_done?: boolean
          reading_done?: boolean
          speaking_done?: boolean
          task_date?: string
          tournament_id?: string
          updated_at?: string
          user_id?: string
          writing_done?: boolean
        }
        Relationships: []
      }
      tournament_participants: {
        Row: {
          games_played: number
          id: string
          joined_at: string
          total_score: number
          tournament_id: string
          user_id: string
        }
        Insert: {
          games_played?: number
          id?: string
          joined_at?: string
          total_score?: number
          tournament_id: string
          user_id: string
        }
        Update: {
          games_played?: number
          id?: string
          joined_at?: string
          total_score?: number
          tournament_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_participants_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournaments: {
        Row: {
          created_at: string
          end_date: string
          game_type: string
          id: string
          prize_xp: number
          start_date: string
          status: string
          title: string
        }
        Insert: {
          created_at?: string
          end_date: string
          game_type?: string
          id?: string
          prize_xp?: number
          start_date?: string
          status?: string
          title: string
        }
        Update: {
          created_at?: string
          end_date?: string
          game_type?: string
          id?: string
          prize_xp?: number
          start_date?: string
          status?: string
          title?: string
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
      user_daily_challenges: {
        Row: {
          challenge_id: string
          completed_at: string
          id: string
          score: number
          streak_multiplier: number
          user_id: string
          xp_earned: number
        }
        Insert: {
          challenge_id: string
          completed_at?: string
          id?: string
          score?: number
          streak_multiplier?: number
          user_id: string
          xp_earned?: number
        }
        Update: {
          challenge_id?: string
          completed_at?: string
          id?: string
          score?: number
          streak_multiplier?: number
          user_id?: string
          xp_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_daily_challenges_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "daily_challenges"
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
      user_quest_progress: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          current_value: number
          id: string
          quest_id: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          current_value?: number
          id?: string
          quest_id: string
          user_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          current_value?: number
          id?: string
          quest_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_quest_progress_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "daily_game_quests"
            referencedColumns: ["id"]
          },
        ]
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
      video_lessons: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          duration: string | null
          id: string
          is_active: boolean
          level: string
          order_index: number
          skill: string
          thumbnail_url: string | null
          title: string
          updated_at: string
          youtube_id: string | null
          youtube_url: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration?: string | null
          id?: string
          is_active?: boolean
          level?: string
          order_index?: number
          skill?: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          youtube_id?: string | null
          youtube_url: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration?: string | null
          id?: string
          is_active?: boolean
          level?: string
          order_index?: number
          skill?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          youtube_id?: string | null
          youtube_url?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_username_available: {
        Args: { p_username: string }
        Returns: boolean
      }
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
      increment_ad_stat: {
        Args: { ad_id: string; stat_type: string }
        Returns: undefined
      }
      increment_test_views: { Args: { test_uuid: string }; Returns: undefined }
      join_school_as_teacher: {
        Args: { p_invite_code: string; p_subject?: string }
        Returns: Json
      }
      join_school_class_by_code: {
        Args: { p_invite_code: string }
        Returns: Json
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
