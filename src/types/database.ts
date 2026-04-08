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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      activity_categories: {
        Row: {
          code: string
          color: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          code: string
          color?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          code?: string
          color?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      activity_library: {
        Row: {
          age_range_max: number | null
          age_range_min: number | null
          category_id: string | null
          created_at: string | null
          default_duration_minutes: number | null
          description: string | null
          difficulty_level: string | null
          id: string
          instructions: string | null
          is_active: boolean | null
          is_archived: boolean | null
          is_global: boolean | null
          materials: string | null
          name: string
          objectives: string | null
          tags: string[] | null
          therapist_id: string | null
          times_used: number | null
          updated_at: string | null
        }
        Insert: {
          age_range_max?: number | null
          age_range_min?: number | null
          category_id?: string | null
          created_at?: string | null
          default_duration_minutes?: number | null
          description?: string | null
          difficulty_level?: string | null
          id?: string
          instructions?: string | null
          is_active?: boolean | null
          is_archived?: boolean | null
          is_global?: boolean | null
          materials?: string | null
          name: string
          objectives?: string | null
          tags?: string[] | null
          therapist_id?: string | null
          times_used?: number | null
          updated_at?: string | null
        }
        Update: {
          age_range_max?: number | null
          age_range_min?: number | null
          category_id?: string | null
          created_at?: string | null
          default_duration_minutes?: number | null
          description?: string | null
          difficulty_level?: string | null
          id?: string
          instructions?: string | null
          is_active?: boolean | null
          is_archived?: boolean | null
          is_global?: boolean | null
          materials?: string | null
          name?: string
          objectives?: string | null
          tags?: string[] | null
          therapist_id?: string | null
          times_used?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_library_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "activity_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_library_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_library_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "activity_library_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_library_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      adir_evaluations: {
        Row: {
          clasificacion: string | null
          created_at: string | null
          cumple_criterio_a: boolean | null
          cumple_criterio_b: boolean | null
          cumple_criterio_c: boolean | null
          cumple_criterio_d: boolean | null
          examinador: string | null
          fecha_evaluacion: string
          id: string
          informacion_adicional: string | null
          informant_name: string | null
          informant_relationship: string | null
          observaciones: string | null
          patient_id: string
          status: string | null
          therapist_id: string
          total_a: number | null
          total_b: number | null
          total_c: number | null
          total_d: number | null
          updated_at: string | null
          verbal_status: string
        }
        Insert: {
          clasificacion?: string | null
          created_at?: string | null
          cumple_criterio_a?: boolean | null
          cumple_criterio_b?: boolean | null
          cumple_criterio_c?: boolean | null
          cumple_criterio_d?: boolean | null
          examinador?: string | null
          fecha_evaluacion?: string
          id?: string
          informacion_adicional?: string | null
          informant_name?: string | null
          informant_relationship?: string | null
          observaciones?: string | null
          patient_id: string
          status?: string | null
          therapist_id: string
          total_a?: number | null
          total_b?: number | null
          total_c?: number | null
          total_d?: number | null
          updated_at?: string | null
          verbal_status: string
        }
        Update: {
          clasificacion?: string | null
          created_at?: string | null
          cumple_criterio_a?: boolean | null
          cumple_criterio_b?: boolean | null
          cumple_criterio_c?: boolean | null
          cumple_criterio_d?: boolean | null
          examinador?: string | null
          fecha_evaluacion?: string
          id?: string
          informacion_adicional?: string | null
          informant_name?: string | null
          informant_relationship?: string | null
          observaciones?: string | null
          patient_id?: string
          status?: string | null
          therapist_id?: string
          total_a?: number | null
          total_b?: number | null
          total_c?: number | null
          total_d?: number | null
          updated_at?: string | null
          verbal_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "adir_evaluations_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      adir_item_responses: {
        Row: {
          algorithm_score: number | null
          domain: string
          evaluation_id: string | null
          id: string
          item_code: string
          item_name: string | null
          notes: string | null
          period: string | null
          raw_score: number | null
          section: string | null
        }
        Insert: {
          algorithm_score?: number | null
          domain: string
          evaluation_id?: string | null
          id?: string
          item_code: string
          item_name?: string | null
          notes?: string | null
          period?: string | null
          raw_score?: number | null
          section?: string | null
        }
        Update: {
          algorithm_score?: number | null
          domain?: string
          evaluation_id?: string | null
          id?: string
          item_code?: string
          item_name?: string | null
          notes?: string | null
          period?: string | null
          raw_score?: number | null
          section?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "adir_item_responses_evaluation_id_fkey"
            columns: ["evaluation_id"]
            isOneToOne: false
            referencedRelation: "adir_evaluations"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_audit_logs: {
        Row: {
          action: string
          admin_id: string | null
          created_at: string | null
          details: Json | null
          id: string
          ip_address: unknown
          target_id: string | null
          target_resource: string | null
        }
        Insert: {
          action: string
          admin_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown
          target_id?: string | null
          target_resource?: string | null
        }
        Update: {
          action?: string
          admin_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown
          target_id?: string | null
          target_resource?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_audit_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_audit_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "admin_audit_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_audit_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      admin_permissions: {
        Row: {
          can_read: boolean | null
          can_write: boolean | null
          granted_at: string | null
          granted_by: string | null
          id: string
          module: string
          user_id: string
        }
        Insert: {
          can_read?: boolean | null
          can_write?: boolean | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          module: string
          user_id: string
        }
        Update: {
          can_read?: boolean | null
          can_write?: boolean | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          module?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_permissions_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_permissions_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "admin_permissions_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_permissions_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "admin_permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "admin_permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      ados2_evaluations: {
        Row: {
          algorithm: string | null
          created_at: string | null
          examinador: string | null
          fecha_evaluacion: string | null
          id: string
          informacion_adicional: string | null
          module: string
          observaciones: string | null
          patient_id: string
          rango_preocupacion: string | null
          status: string
          therapist_id: string
          total_as: number | null
          total_com: number | null
          total_crr: number | null
          total_global: number | null
          updated_at: string | null
        }
        Insert: {
          algorithm?: string | null
          created_at?: string | null
          examinador?: string | null
          fecha_evaluacion?: string | null
          id?: string
          informacion_adicional?: string | null
          module: string
          observaciones?: string | null
          patient_id: string
          rango_preocupacion?: string | null
          status?: string
          therapist_id: string
          total_as?: number | null
          total_com?: number | null
          total_crr?: number | null
          total_global?: number | null
          updated_at?: string | null
        }
        Update: {
          algorithm?: string | null
          created_at?: string | null
          examinador?: string | null
          fecha_evaluacion?: string | null
          id?: string
          informacion_adicional?: string | null
          module?: string
          observaciones?: string | null
          patient_id?: string
          rango_preocupacion?: string | null
          status?: string
          therapist_id?: string
          total_as?: number | null
          total_com?: number | null
          total_crr?: number | null
          total_global?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ados2_evaluations_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ados2_evaluations_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ados2_evaluations_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "ados2_evaluations_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ados2_evaluations_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      ados2_item_responses: {
        Row: {
          algorithm_score: number | null
          created_at: string | null
          domain: string
          evaluation_id: string
          id: string
          item_code: string
          item_name: string
          raw_score: number | null
        }
        Insert: {
          algorithm_score?: number | null
          created_at?: string | null
          domain: string
          evaluation_id: string
          id?: string
          item_code: string
          item_name: string
          raw_score?: number | null
        }
        Update: {
          algorithm_score?: number | null
          created_at?: string | null
          domain?: string
          evaluation_id?: string
          id?: string
          item_code?: string
          item_name?: string
          raw_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ados2_item_responses_evaluation_id_fkey"
            columns: ["evaluation_id"]
            isOneToOne: false
            referencedRelation: "ados2_evaluations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_chat_messages: {
        Row: {
          analyzed: boolean | null
          created_at: string | null
          feedback: Json | null
          id: string
          message: string
          metadata: Json | null
          model_used: string | null
          response_time_ms: number | null
          sender_type: Database["public"]["Enums"]["sender_type_enum"]
          session_id: string
          tokens_used: number | null
        }
        Insert: {
          analyzed?: boolean | null
          created_at?: string | null
          feedback?: Json | null
          id?: string
          message: string
          metadata?: Json | null
          model_used?: string | null
          response_time_ms?: number | null
          sender_type: Database["public"]["Enums"]["sender_type_enum"]
          session_id: string
          tokens_used?: number | null
        }
        Update: {
          analyzed?: boolean | null
          created_at?: string | null
          feedback?: Json | null
          id?: string
          message?: string
          metadata?: Json | null
          model_used?: string | null
          response_time_ms?: number | null
          sender_type?: Database["public"]["Enums"]["sender_type_enum"]
          session_id?: string
          tokens_used?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "ai_chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_chat_sessions: {
        Row: {
          created_at: string | null
          end_time: string | null
          free_conversations_count: number | null
          id: string
          is_active: boolean | null
          patient_id: string | null
          session_type: string
          start_time: string | null
          subscription_status: string | null
          therapist_id: string | null
          total_messages: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          end_time?: string | null
          free_conversations_count?: number | null
          id?: string
          is_active?: boolean | null
          patient_id?: string | null
          session_type: string
          start_time?: string | null
          subscription_status?: string | null
          therapist_id?: string | null
          total_messages?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          end_time?: string | null
          free_conversations_count?: number | null
          id?: string
          is_active?: boolean | null
          patient_id?: string | null
          session_type?: string
          start_time?: string | null
          subscription_status?: string | null
          therapist_id?: string | null
          total_messages?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_chat_sessions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_chat_sessions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "ai_chat_sessions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_chat_sessions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "ai_chat_sessions_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_chat_sessions_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "ai_chat_sessions_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_chat_sessions_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      ai_conversation_analysis: {
        Row: {
          analysis_type: string
          confidence_score: number | null
          created_at: string | null
          id: string
          results: Json
          session_id: string
        }
        Insert: {
          analysis_type: string
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          results: Json
          session_id: string
        }
        Update: {
          analysis_type?: string
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          results?: Json
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_conversation_analysis_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "ai_chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_feedback: {
        Row: {
          comments: string | null
          created_at: string | null
          id: string
          patient_id: string | null
          rating: number | null
          session_id: string | null
          status: string
          suggestion_content: Json | null
          suggestion_id: string | null
          suggestion_type: string | null
          therapist_id: string | null
          updated_at: string | null
        }
        Insert: {
          comments?: string | null
          created_at?: string | null
          id?: string
          patient_id?: string | null
          rating?: number | null
          session_id?: string | null
          status: string
          suggestion_content?: Json | null
          suggestion_id?: string | null
          suggestion_type?: string | null
          therapist_id?: string | null
          updated_at?: string | null
        }
        Update: {
          comments?: string | null
          created_at?: string | null
          id?: string
          patient_id?: string | null
          rating?: number | null
          session_id?: string | null
          status?: string
          suggestion_content?: Json | null
          suggestion_id?: string | null
          suggestion_type?: string | null
          therapist_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_feedback_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_feedback_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "ai_feedback_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_feedback_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "ai_feedback_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "clinical_history"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_feedback_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "v_patient_clinical_timeline"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_feedback_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_feedback_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "ai_feedback_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_feedback_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      ai_plan_limits: {
        Row: {
          max_calls_per_month: number
          max_tokens_per_month: number
          model: string
          plan_name: string
        }
        Insert: {
          max_calls_per_month: number
          max_tokens_per_month: number
          model?: string
          plan_name: string
        }
        Update: {
          max_calls_per_month?: number
          max_tokens_per_month?: number
          model?: string
          plan_name?: string
        }
        Relationships: []
      }
      ai_recommendation_feedback: {
        Row: {
          created_at: string | null
          feedback_score: number | null
          feedback_type: string
          id: string
          interaction_duration: number | null
          model_version: string | null
          modifications: Json | null
          patient_context: Json | null
          recommendation_id: string
          recommendation_type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          feedback_score?: number | null
          feedback_type: string
          id?: string
          interaction_duration?: number | null
          model_version?: string | null
          modifications?: Json | null
          patient_context?: Json | null
          recommendation_id: string
          recommendation_type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          feedback_score?: number | null
          feedback_type?: string
          id?: string
          interaction_duration?: number | null
          model_version?: string | null
          modifications?: Json | null
          patient_context?: Json | null
          recommendation_id?: string
          recommendation_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_recommendation_feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_recommendation_feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "ai_recommendation_feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_recommendation_feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      ai_settings: {
        Row: {
          category: string | null
          description: string | null
          id: string
          key: string
          updated_at: string | null
          value: string
        }
        Insert: {
          category?: string | null
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          value: string
        }
        Update: {
          category?: string | null
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      ai_usage_quotas: {
        Row: {
          calls_used: number
          created_at: string | null
          id: string
          period_end: string
          period_start: string
          plan_name: string
          therapist_id: string
          tokens_used: number
          updated_at: string | null
        }
        Insert: {
          calls_used?: number
          created_at?: string | null
          id?: string
          period_end: string
          period_start: string
          plan_name?: string
          therapist_id: string
          tokens_used?: number
          updated_at?: string | null
        }
        Update: {
          calls_used?: number
          created_at?: string | null
          id?: string
          period_end?: string
          period_start?: string
          plan_name?: string
          therapist_id?: string
          tokens_used?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_quotas_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_usage_quotas_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "ai_usage_quotas_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_usage_quotas_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      appointments: {
        Row: {
          block_type: string | null
          clinic_id: string | null
          color: string | null
          confirmation_status: string | null
          created_at: string | null
          date: string
          duration_minutes: number
          end_time: string
          id: string
          modality_patient: string | null
          notes: string | null
          patient_id: string
          recurring_group_id: string | null
          send_email_reminder: boolean | null
          service_id: string | null
          specialty_id: string | null
          start_time: string
          status: string
          therapist_id: string
          updated_at: string | null
        }
        Insert: {
          block_type?: string | null
          clinic_id?: string | null
          color?: string | null
          confirmation_status?: string | null
          created_at?: string | null
          date: string
          duration_minutes?: number
          end_time: string
          id?: string
          modality_patient?: string | null
          notes?: string | null
          patient_id: string
          recurring_group_id?: string | null
          send_email_reminder?: boolean | null
          service_id?: string | null
          specialty_id?: string | null
          start_time: string
          status?: string
          therapist_id: string
          updated_at?: string | null
        }
        Update: {
          block_type?: string | null
          clinic_id?: string | null
          color?: string | null
          confirmation_status?: string | null
          created_at?: string | null
          date?: string
          duration_minutes?: number
          end_time?: string
          id?: string
          modality_patient?: string | null
          notes?: string | null
          patient_id?: string
          recurring_group_id?: string | null
          send_email_reminder?: boolean | null
          service_id?: string | null
          specialty_id?: string | null
          start_time?: string
          status?: string
          therapist_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "therapist_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "appointments_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      arco_requests: {
        Row: {
          description: string | null
          id: string
          metadata: Json | null
          request_type: string
          requested_at: string | null
          resolved_at: string | null
          resolved_by: string | null
          response: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          description?: string | null
          id?: string
          metadata?: Json | null
          request_type: string
          requested_at?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          response?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          description?: string | null
          id?: string
          metadata?: Json | null
          request_type?: string
          requested_at?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          response?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "arco_requests_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "arco_requests_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "arco_requests_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "arco_requests_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "arco_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "arco_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "arco_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "arco_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          changed_fields: string[] | null
          id: string
          ip_address: unknown
          new_data: Json | null
          old_data: Json | null
          record_id: string
          table_name: string
          timestamp: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          changed_fields?: string[] | null
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          record_id: string
          table_name: string
          timestamp?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          changed_fields?: string[] | null
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string
          table_name?: string
          timestamp?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      availability_logs: {
        Row: {
          action: string
          availability_data: Json | null
          created_at: string | null
          id: string
          performed_by: string
          reason: string | null
          therapist_id: string
        }
        Insert: {
          action: string
          availability_data?: Json | null
          created_at?: string | null
          id?: string
          performed_by: string
          reason?: string | null
          therapist_id: string
        }
        Update: {
          action?: string
          availability_data?: Json | null
          created_at?: string | null
          id?: string
          performed_by?: string
          reason?: string | null
          therapist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "availability_logs_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "availability_logs_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "availability_logs_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "availability_logs_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "availability_logs_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "availability_logs_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "availability_logs_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "availability_logs_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      billing_invoices: {
        Row: {
          amount_paid: number | null
          buyer_id: string | null
          created_at: string | null
          created_by: string | null
          currency: string
          due_date: string
          exchange_rate: number | null
          id: string
          immutable_created_at_log: string
          invoice_file_url: string | null
          invoice_number: string
          notes: string | null
          organization_id: string | null
          payment_date: string | null
          payment_method: string | null
          payment_reference: string | null
          period_end: string
          period_start: string
          status: Database["public"]["Enums"]["invoice_status_enum"]
          subtotal: number
          tax_amount: number | null
          therapist_id: string
          total_amount: number
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          amount_paid?: number | null
          buyer_id?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string
          due_date: string
          exchange_rate?: number | null
          id?: string
          immutable_created_at_log?: string
          invoice_file_url?: string | null
          invoice_number: string
          notes?: string | null
          organization_id?: string | null
          payment_date?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          period_end: string
          period_start: string
          status?: Database["public"]["Enums"]["invoice_status_enum"]
          subtotal: number
          tax_amount?: number | null
          therapist_id: string
          total_amount: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          amount_paid?: number | null
          buyer_id?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string
          due_date?: string
          exchange_rate?: number | null
          id?: string
          immutable_created_at_log?: string
          invoice_file_url?: string | null
          invoice_number?: string
          notes?: string | null
          organization_id?: string | null
          payment_date?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          period_end?: string
          period_start?: string
          status?: Database["public"]["Enums"]["invoice_status_enum"]
          subtotal?: number
          tax_amount?: number | null
          therapist_id?: string
          total_amount?: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_invoices_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_invoices_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "billing_invoices_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_invoices_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      blocked_times: {
        Row: {
          clinic_id: string | null
          created_at: string
          end_time: string
          id: string
          reason: string | null
          start_time: string
          therapist_id: string
        }
        Insert: {
          clinic_id?: string | null
          created_at?: string
          end_time: string
          id?: string
          reason?: string | null
          start_time: string
          therapist_id: string
        }
        Update: {
          clinic_id?: string | null
          created_at?: string
          end_time?: string
          id?: string
          reason?: string | null
          start_time?: string
          therapist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocked_times_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_article_tags: {
        Row: {
          article_id: string
          tag_id: string
        }
        Insert: {
          article_id: string
          tag_id: string
        }
        Update: {
          article_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_article_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "blog_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      blog_comments: {
        Row: {
          article_id: string | null
          content: string
          created_at: string | null
          id: string
          parent_id: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          article_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          parent_id?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          article_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          parent_id?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "blog_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          author_id: string
          author_name: string | null
          category: string | null
          content: string | null
          content_html: string | null
          content_md: string | null
          cover_url: string | null
          created_at: string | null
          excerpt: string | null
          faq: Json | null
          id: string
          keywords: string[] | null
          meta_description: string | null
          meta_title: string | null
          published_at: string | null
          question_id: string | null
          shareable_quote: string | null
          slug: string
          specialty_id: string | null
          status: string
          subtitle: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          author_id: string
          author_name?: string | null
          category?: string | null
          content?: string | null
          content_html?: string | null
          content_md?: string | null
          cover_url?: string | null
          created_at?: string | null
          excerpt?: string | null
          faq?: Json | null
          id?: string
          keywords?: string[] | null
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          question_id?: string | null
          shareable_quote?: string | null
          slug: string
          specialty_id?: string | null
          status?: string
          subtitle?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          author_name?: string | null
          category?: string | null
          content?: string | null
          content_html?: string | null
          content_md?: string | null
          cover_url?: string | null
          created_at?: string | null
          excerpt?: string | null
          faq?: Json | null
          id?: string
          keywords?: string[] | null
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          question_id?: string | null
          shareable_quote?: string | null
          slug?: string
          specialty_id?: string | null
          status?: string
          subtitle?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "blog_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "blog_posts_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: true
            referencedRelation: "patient_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_posts_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "specialties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_posts_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "specialties_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_posts_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "v_reputation_badges"
            referencedColumns: ["specialty_id"]
          },
          {
            foreignKeyName: "blog_posts_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "v_reputation_specialty_scores"
            referencedColumns: ["specialty_id"]
          },
          {
            foreignKeyName: "blog_posts_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_specialty_progress"
            referencedColumns: ["specialty_id"]
          },
        ]
      }
      blog_reviews: {
        Row: {
          action: string
          blog_post_id: string
          comments: string | null
          id: string
          reviewed_at: string | null
          reviewer_id: string
        }
        Insert: {
          action: string
          blog_post_id: string
          comments?: string | null
          id?: string
          reviewed_at?: string | null
          reviewer_id: string
        }
        Update: {
          action?: string
          blog_post_id?: string
          comments?: string | null
          id?: string
          reviewed_at?: string | null
          reviewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_reviews_blog_post_id_fkey"
            columns: ["blog_post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "blog_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      blog_tags: {
        Row: {
          created_at: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      cities: {
        Row: {
          created_at: string | null
          id: number
          name: string
          region_id: number | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          name: string
          region_id?: number | null
        }
        Update: {
          created_at?: string | null
          id?: number
          name?: string
          region_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cities_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_invitations: {
        Row: {
          accepted_at: string | null
          cancelled_at: string | null
          clinic_id: string
          created_at: string | null
          email: string
          id: string
          invited_by: string | null
          message: string | null
          rejected_at: string | null
          status: string
          token: string
          updated_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          cancelled_at?: string | null
          clinic_id: string
          created_at?: string | null
          email: string
          id?: string
          invited_by?: string | null
          message?: string | null
          rejected_at?: string | null
          status?: string
          token: string
          updated_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          cancelled_at?: string | null
          clinic_id?: string
          created_at?: string | null
          email?: string
          id?: string
          invited_by?: string | null
          message?: string | null
          rejected_at?: string | null
          status?: string
          token?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clinic_invitations_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinic_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinic_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "clinic_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinic_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      clinic_invoices: {
        Row: {
          appointment_id: string | null
          clinic_id: string
          created_at: string | null
          detalle: Json | null
          document_type: string
          emisor_direccion: string | null
          emisor_giro: string | null
          emisor_razon_social: string | null
          emisor_rut: string | null
          es_exento: boolean | null
          folio: number | null
          id: string
          monto_exento: number
          monto_iva: number
          monto_neto: number
          monto_total: number
          notes: string | null
          patient_id: string | null
          pdf_url: string | null
          periodo: string | null
          receptor_direccion: string | null
          receptor_giro: string | null
          receptor_nombre: string | null
          receptor_rut: string | null
          sii_response: Json | null
          status: string
          therapist_id: string | null
          track_id: string | null
          updated_at: string | null
        }
        Insert: {
          appointment_id?: string | null
          clinic_id: string
          created_at?: string | null
          detalle?: Json | null
          document_type?: string
          emisor_direccion?: string | null
          emisor_giro?: string | null
          emisor_razon_social?: string | null
          emisor_rut?: string | null
          es_exento?: boolean | null
          folio?: number | null
          id?: string
          monto_exento?: number
          monto_iva?: number
          monto_neto?: number
          monto_total?: number
          notes?: string | null
          patient_id?: string | null
          pdf_url?: string | null
          periodo?: string | null
          receptor_direccion?: string | null
          receptor_giro?: string | null
          receptor_nombre?: string | null
          receptor_rut?: string | null
          sii_response?: Json | null
          status?: string
          therapist_id?: string | null
          track_id?: string | null
          updated_at?: string | null
        }
        Update: {
          appointment_id?: string | null
          clinic_id?: string
          created_at?: string | null
          detalle?: Json | null
          document_type?: string
          emisor_direccion?: string | null
          emisor_giro?: string | null
          emisor_razon_social?: string | null
          emisor_rut?: string | null
          es_exento?: boolean | null
          folio?: number | null
          id?: string
          monto_exento?: number
          monto_iva?: number
          monto_neto?: number
          monto_total?: number
          notes?: string | null
          patient_id?: string | null
          pdf_url?: string | null
          periodo?: string | null
          receptor_direccion?: string | null
          receptor_giro?: string | null
          receptor_nombre?: string | null
          receptor_rut?: string | null
          sii_response?: Json | null
          status?: string
          therapist_id?: string | null
          track_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clinic_invoices_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinic_invoices_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinic_invoices_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinic_invoices_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinic_invoices_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "clinic_invoices_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinic_invoices_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      clinic_therapists: {
        Row: {
          clinic_id: string | null
          commission_percent: number | null
          created_at: string | null
          id: string
          is_active: boolean | null
          joined_at: string | null
          show_in_public_profile: boolean | null
          therapist_id: string | null
          updated_at: string | null
        }
        Insert: {
          clinic_id?: string | null
          commission_percent?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          joined_at?: string | null
          show_in_public_profile?: boolean | null
          therapist_id?: string | null
          updated_at?: string | null
        }
        Update: {
          clinic_id?: string | null
          commission_percent?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          joined_at?: string | null
          show_in_public_profile?: boolean | null
          therapist_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clinic_therapists_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinic_therapists_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinic_therapists_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "clinic_therapists_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinic_therapists_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      clinical_access_log: {
        Row: {
          accessed_by: string
          action: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: string | null
          patient_id: string
        }
        Insert: {
          accessed_by: string
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          patient_id: string
        }
        Update: {
          accessed_by?: string
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          patient_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinical_access_log_accessed_by_fkey"
            columns: ["accessed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_access_log_accessed_by_fkey"
            columns: ["accessed_by"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "clinical_access_log_accessed_by_fkey"
            columns: ["accessed_by"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_access_log_accessed_by_fkey"
            columns: ["accessed_by"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "clinical_access_log_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      clinical_entry_types: {
        Row: {
          category: string
          code: string
          name: string
        }
        Insert: {
          category: string
          code: string
          name: string
        }
        Update: {
          category?: string
          code?: string
          name?: string
        }
        Relationships: []
      }
      clinical_history: {
        Row: {
          appointment_id: string | null
          assigned_plan_id: string | null
          care_context: string | null
          caregiver_present: boolean | null
          created_at: string
          details: Json | null
          diagnosis_id: string | null
          duration_minutes: number | null
          entry_date: string
          entry_type: string
          id: string
          is_external: boolean | null
          is_professional_only: boolean | null
          legacy_session_id: string | null
          location_type: string | null
          patient_id: string
          recorded_by: string | null
          risk_flag: boolean | null
          session_notes: string | null
          session_state: string | null
          session_type: string | null
          signed_at: string | null
          signed_by: string | null
          source_system: string | null
          status: string | null
          summary: string | null
          therapist_id: string
          updated_at: string
          visibility: string | null
        }
        Insert: {
          appointment_id?: string | null
          assigned_plan_id?: string | null
          care_context?: string | null
          caregiver_present?: boolean | null
          created_at?: string
          details?: Json | null
          diagnosis_id?: string | null
          duration_minutes?: number | null
          entry_date?: string
          entry_type: string
          id?: string
          is_external?: boolean | null
          is_professional_only?: boolean | null
          legacy_session_id?: string | null
          location_type?: string | null
          patient_id: string
          recorded_by?: string | null
          risk_flag?: boolean | null
          session_notes?: string | null
          session_state?: string | null
          session_type?: string | null
          signed_at?: string | null
          signed_by?: string | null
          source_system?: string | null
          status?: string | null
          summary?: string | null
          therapist_id: string
          updated_at?: string
          visibility?: string | null
        }
        Update: {
          appointment_id?: string | null
          assigned_plan_id?: string | null
          care_context?: string | null
          caregiver_present?: boolean | null
          created_at?: string
          details?: Json | null
          diagnosis_id?: string | null
          duration_minutes?: number | null
          entry_date?: string
          entry_type?: string
          id?: string
          is_external?: boolean | null
          is_professional_only?: boolean | null
          legacy_session_id?: string | null
          location_type?: string | null
          patient_id?: string
          recorded_by?: string | null
          risk_flag?: boolean | null
          session_notes?: string | null
          session_state?: string | null
          session_type?: string | null
          signed_at?: string | null
          signed_by?: string | null
          source_system?: string | null
          status?: string | null
          summary?: string | null
          therapist_id?: string
          updated_at?: string
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clinical_entry_type_fk"
            columns: ["entry_type"]
            isOneToOne: false
            referencedRelation: "clinical_entry_types"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "clinical_history_diagnosis_fk"
            columns: ["diagnosis_id"]
            isOneToOne: false
            referencedRelation: "patient_diagnoses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_history_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_history_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_history_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "clinical_history_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_history_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_appointment"
            columns: ["appointment_id"]
            isOneToOne: true
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      clinical_reports: {
        Row: {
          created_at: string | null
          created_by: string | null
          delivery_status: string | null
          document_id: string | null
          editable_json: Json
          encounter_id: string | null
          final_pdf_url: string | null
          hash_integrity: string | null
          id: string
          locked_at: string | null
          locked_reason: string | null
          patient_id: string
          report_type: string
          signed_at: string | null
          signed_by: string | null
          signed_hash: string | null
          specialty_id: string | null
          status: Database["public"]["Enums"]["report_status"]
          template_id: string | null
          therapist_id: string
          updated_at: string | null
          validated_at: string | null
          validated_by: string | null
          version: number | null
          visibility_scope: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          delivery_status?: string | null
          document_id?: string | null
          editable_json: Json
          encounter_id?: string | null
          final_pdf_url?: string | null
          hash_integrity?: string | null
          id?: string
          locked_at?: string | null
          locked_reason?: string | null
          patient_id: string
          report_type: string
          signed_at?: string | null
          signed_by?: string | null
          signed_hash?: string | null
          specialty_id?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          template_id?: string | null
          therapist_id: string
          updated_at?: string | null
          validated_at?: string | null
          validated_by?: string | null
          version?: number | null
          visibility_scope?: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          delivery_status?: string | null
          document_id?: string | null
          editable_json?: Json
          encounter_id?: string | null
          final_pdf_url?: string | null
          hash_integrity?: string | null
          id?: string
          locked_at?: string | null
          locked_reason?: string | null
          patient_id?: string
          report_type?: string
          signed_at?: string | null
          signed_by?: string | null
          signed_hash?: string | null
          specialty_id?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          template_id?: string | null
          therapist_id?: string
          updated_at?: string | null
          validated_at?: string | null
          validated_by?: string | null
          version?: number | null
          visibility_scope?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinical_reports_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_reports_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_reports_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "clinical_reports_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_reports_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "clinical_reports_validated_by_fkey"
            columns: ["validated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_reports_validated_by_fkey"
            columns: ["validated_by"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "clinical_reports_validated_by_fkey"
            columns: ["validated_by"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_reports_validated_by_fkey"
            columns: ["validated_by"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      clinics: {
        Row: {
          address: string | null
          amenities: string[] | null
          business_hours: Json | null
          city_id: number | null
          created_at: string | null
          description: string | null
          email: string | null
          facebook: string | null
          google_maps_url: string | null
          id: string
          instagram: string | null
          is_active: boolean | null
          is_public: boolean | null
          latitude: number | null
          logo_url: string | null
          longitude: number | null
          modalidad: string | null
          modality: Database["public"]["Enums"]["modality_enum"] | null
          name: string
          phone: string | null
          photos: Json | null
          public_transport: string | null
          razon_social: string | null
          rbd: string | null
          region_id: number | null
          rut: string | null
          rut_empresa: string | null
          schedule_text: string | null
          slug: string | null
          therapist_id: string | null
          type: string | null
          updated_at: string | null
          website: string | null
          website_url: string | null
        }
        Insert: {
          address?: string | null
          amenities?: string[] | null
          business_hours?: Json | null
          city_id?: number | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          facebook?: string | null
          google_maps_url?: string | null
          id?: string
          instagram?: string | null
          is_active?: boolean | null
          is_public?: boolean | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          modalidad?: string | null
          modality?: Database["public"]["Enums"]["modality_enum"] | null
          name: string
          phone?: string | null
          photos?: Json | null
          public_transport?: string | null
          razon_social?: string | null
          rbd?: string | null
          region_id?: number | null
          rut?: string | null
          rut_empresa?: string | null
          schedule_text?: string | null
          slug?: string | null
          therapist_id?: string | null
          type?: string | null
          updated_at?: string | null
          website?: string | null
          website_url?: string | null
        }
        Update: {
          address?: string | null
          amenities?: string[] | null
          business_hours?: Json | null
          city_id?: number | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          facebook?: string | null
          google_maps_url?: string | null
          id?: string
          instagram?: string | null
          is_active?: boolean | null
          is_public?: boolean | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          modalidad?: string | null
          modality?: Database["public"]["Enums"]["modality_enum"] | null
          name?: string
          phone?: string | null
          photos?: Json | null
          public_transport?: string | null
          razon_social?: string | null
          rbd?: string | null
          region_id?: number | null
          rut?: string | null
          rut_empresa?: string | null
          schedule_text?: string | null
          slug?: string | null
          therapist_id?: string | null
          type?: string | null
          updated_at?: string | null
          website?: string | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clinics_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinics_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinics_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinics_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "clinics_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinics_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      commissions: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          payment_date: string | null
          sale_id: string | null
          status: string | null
          therapist_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          payment_date?: string | null
          sale_id?: string | null
          status?: string | null
          therapist_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          payment_date?: string | null
          sale_id?: string | null
          status?: string | null
          therapist_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commissions_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "commissions_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      cookie_consents: {
        Row: {
          analytics: boolean | null
          consent_version: string
          created_at: string | null
          essential: boolean | null
          id: string
          ip_address: string | null
          marketing: boolean | null
          page_url: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          analytics?: boolean | null
          consent_version: string
          created_at?: string | null
          essential?: boolean | null
          id?: string
          ip_address?: string | null
          marketing?: boolean | null
          page_url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          analytics?: boolean | null
          consent_version?: string
          created_at?: string | null
          essential?: boolean | null
          id?: string
          ip_address?: string | null
          marketing?: boolean | null
          page_url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cookie_consents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cookie_consents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "cookie_consents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cookie_consents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      coupon_uses: {
        Row: {
          coupon_id: string
          discount_amount: number
          id: string
          order_id: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          coupon_id: string
          discount_amount: number
          id?: string
          order_id: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          coupon_id?: string
          discount_amount?: number
          id?: string
          order_id?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_uses_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "marketplace_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_uses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_uses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "coupon_uses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_uses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      course_enrollments: {
        Row: {
          amount_paid: number | null
          certificate_url: string | null
          commission_amount: number | null
          completed_at: string | null
          course_id: string
          enrolled_at: string | null
          fonolevel_credited: boolean | null
          id: string
          payment_method: string | null
          payment_status: string | null
          sponsored_by: string | null
          status: string | null
          student_id: string
        }
        Insert: {
          amount_paid?: number | null
          certificate_url?: string | null
          commission_amount?: number | null
          completed_at?: string | null
          course_id: string
          enrolled_at?: string | null
          fonolevel_credited?: boolean | null
          id?: string
          payment_method?: string | null
          payment_status?: string | null
          sponsored_by?: string | null
          status?: string | null
          student_id: string
        }
        Update: {
          amount_paid?: number | null
          certificate_url?: string | null
          commission_amount?: number | null
          completed_at?: string | null
          course_id?: string
          enrolled_at?: string | null
          fonolevel_credited?: boolean | null
          id?: string
          payment_method?: string | null
          payment_status?: string | null
          sponsored_by?: string | null
          status?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_enrollments_sponsored_by_fkey"
            columns: ["sponsored_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_enrollments_sponsored_by_fkey"
            columns: ["sponsored_by"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "course_enrollments_sponsored_by_fkey"
            columns: ["sponsored_by"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_enrollments_sponsored_by_fkey"
            columns: ["sponsored_by"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "course_enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "course_enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      course_lessons: {
        Row: {
          content: string | null
          created_at: string | null
          duration_minutes: number | null
          id: string
          media_url: string | null
          order_index: number
          product_id: string
          title: string
          updated_at: string | null
          video_url: string | null
          visibility: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          media_url?: string | null
          order_index?: number
          product_id: string
          title: string
          updated_at?: string | null
          video_url?: string | null
          visibility?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          media_url?: string | null
          order_index?: number
          product_id?: string
          title?: string
          updated_at?: string | null
          video_url?: string | null
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_lessons_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      course_modules: {
        Row: {
          course_id: string
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          id: string
          is_free_preview: boolean | null
          sort_order: number | null
          title: string
          video_url: string | null
        }
        Insert: {
          course_id: string
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_free_preview?: boolean | null
          sort_order?: number | null
          title: string
          video_url?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_free_preview?: boolean | null
          sort_order?: number | null
          title?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_reviews: {
        Row: {
          comment: string | null
          course_id: string
          created_at: string | null
          id: string
          rating: number
          reviewer_id: string
        }
        Insert: {
          comment?: string | null
          course_id: string
          created_at?: string | null
          id?: string
          rating: number
          reviewer_id: string
        }
        Update: {
          comment?: string | null
          course_id?: string
          created_at?: string | null
          id?: string
          rating?: number
          reviewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_reviews_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "course_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      courses: {
        Row: {
          course_type: string | null
          cover_image_url: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          end_date: string | null
          format: string | null
          hours: number | null
          id: string
          instructor_id: string
          is_featured: boolean | null
          is_permanent: boolean | null
          level: string | null
          max_students: number | null
          modality: string | null
          platform_url: string | null
          price: number | null
          published_at: string | null
          rating: number | null
          rejection_reason: string | null
          score_boost: number | null
          short_description: string | null
          slug: string | null
          specialty_id: string | null
          start_date: string | null
          status: string | null
          syllabus_url: string | null
          title: string
          total_enrollments: number | null
          total_reviews: number | null
          updated_at: string | null
          video_url: string | null
        }
        Insert: {
          course_type?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          end_date?: string | null
          format?: string | null
          hours?: number | null
          id?: string
          instructor_id: string
          is_featured?: boolean | null
          is_permanent?: boolean | null
          level?: string | null
          max_students?: number | null
          modality?: string | null
          platform_url?: string | null
          price?: number | null
          published_at?: string | null
          rating?: number | null
          rejection_reason?: string | null
          score_boost?: number | null
          short_description?: string | null
          slug?: string | null
          specialty_id?: string | null
          start_date?: string | null
          status?: string | null
          syllabus_url?: string | null
          title: string
          total_enrollments?: number | null
          total_reviews?: number | null
          updated_at?: string | null
          video_url?: string | null
        }
        Update: {
          course_type?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          end_date?: string | null
          format?: string | null
          hours?: number | null
          id?: string
          instructor_id?: string
          is_featured?: boolean | null
          is_permanent?: boolean | null
          level?: string | null
          max_students?: number | null
          modality?: string | null
          platform_url?: string | null
          price?: number | null
          published_at?: string | null
          rating?: number | null
          rejection_reason?: string | null
          score_boost?: number | null
          short_description?: string | null
          slug?: string | null
          specialty_id?: string | null
          start_date?: string | null
          status?: string | null
          syllabus_url?: string | null
          title?: string
          total_enrollments?: number | null
          total_reviews?: number | null
          updated_at?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "courses_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "courses_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "courses_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "specialties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "specialties_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "v_reputation_badges"
            referencedColumns: ["specialty_id"]
          },
          {
            foreignKeyName: "courses_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "v_reputation_specialty_scores"
            referencedColumns: ["specialty_id"]
          },
          {
            foreignKeyName: "courses_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_specialty_progress"
            referencedColumns: ["specialty_id"]
          },
        ]
      }
      debug_signup_logs: {
        Row: {
          created_at: string | null
          id: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      diagnosis_codes: {
        Row: {
          code: string
          code_alt: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          system_id: string
        }
        Insert: {
          code: string
          code_alt?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          system_id: string
        }
        Update: {
          code?: string
          code_alt?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          system_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "diagnosis_codes_system_id_fkey"
            columns: ["system_id"]
            isOneToOne: false
            referencedRelation: "diagnosis_systems"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnosis_specialty_map: {
        Row: {
          created_at: string | null
          diagnosis_pattern: string
          id: string
          match_type: string
          priority: number | null
          specialty_id: string
        }
        Insert: {
          created_at?: string | null
          diagnosis_pattern: string
          id?: string
          match_type?: string
          priority?: number | null
          specialty_id: string
        }
        Update: {
          created_at?: string | null
          diagnosis_pattern?: string
          id?: string
          match_type?: string
          priority?: number | null
          specialty_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "diagnosis_specialty_map_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "specialties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnosis_specialty_map_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "specialties_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnosis_specialty_map_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "v_reputation_badges"
            referencedColumns: ["specialty_id"]
          },
          {
            foreignKeyName: "diagnosis_specialty_map_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "v_reputation_specialty_scores"
            referencedColumns: ["specialty_id"]
          },
          {
            foreignKeyName: "diagnosis_specialty_map_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_specialty_progress"
            referencedColumns: ["specialty_id"]
          },
        ]
      }
      diagnosis_systems: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      discount_coupons: {
        Row: {
          applicable_plans: string[] | null
          code: string
          coupon_type: string | null
          created_at: string | null
          created_by: string | null
          current_uses: number | null
          description: string | null
          discount_type: string
          discount_value: number
          expiration_date: string | null
          id: string
          is_active: boolean | null
          max_discount_amount: number | null
          max_uses: number | null
          min_purchase_amount: number | null
          updated_at: string | null
          valid_from: string | null
        }
        Insert: {
          applicable_plans?: string[] | null
          code: string
          coupon_type?: string | null
          created_at?: string | null
          created_by?: string | null
          current_uses?: number | null
          description?: string | null
          discount_type: string
          discount_value: number
          expiration_date?: string | null
          id?: string
          is_active?: boolean | null
          max_discount_amount?: number | null
          max_uses?: number | null
          min_purchase_amount?: number | null
          updated_at?: string | null
          valid_from?: string | null
        }
        Update: {
          applicable_plans?: string[] | null
          code?: string
          coupon_type?: string | null
          created_at?: string | null
          created_by?: string | null
          current_uses?: number | null
          description?: string | null
          discount_type?: string
          discount_value?: number
          expiration_date?: string | null
          id?: string
          is_active?: boolean | null
          max_discount_amount?: number | null
          max_uses?: number | null
          min_purchase_amount?: number | null
          updated_at?: string | null
          valid_from?: string | null
        }
        Relationships: []
      }
      education_recommendations: {
        Row: {
          country: string | null
          description: string | null
          duration_hours: number | null
          education_level: string | null
          estimated_points: number | null
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          modality: string | null
          price_clp: number | null
          provider: string | null
          provider_url: string | null
          specialty_id: string | null
          tags: string[] | null
          title: string
          url: string | null
        }
        Insert: {
          country?: string | null
          description?: string | null
          duration_hours?: number | null
          education_level?: string | null
          estimated_points?: number | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          modality?: string | null
          price_clp?: number | null
          provider?: string | null
          provider_url?: string | null
          specialty_id?: string | null
          tags?: string[] | null
          title: string
          url?: string | null
        }
        Update: {
          country?: string | null
          description?: string | null
          duration_hours?: number | null
          education_level?: string | null
          estimated_points?: number | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          modality?: string | null
          price_clp?: number | null
          provider?: string | null
          provider_url?: string | null
          specialty_id?: string | null
          tags?: string[] | null
          title?: string
          url?: string | null
        }
        Relationships: []
      }
      email_notifications: {
        Row: {
          body_html: string | null
          body_text: string | null
          cc_emails: string[] | null
          created_at: string | null
          error_message: string | null
          failed_at: string | null
          id: string
          metadata: Json | null
          notification_type: string
          recipient_email: string
          scheduled_for: string | null
          sent_at: string | null
          status: string
          subject: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          body_html?: string | null
          body_text?: string | null
          cc_emails?: string[] | null
          created_at?: string | null
          error_message?: string | null
          failed_at?: string | null
          id?: string
          metadata?: Json | null
          notification_type: string
          recipient_email: string
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string
          subject: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          body_html?: string | null
          body_text?: string | null
          cc_emails?: string[] | null
          created_at?: string | null
          error_message?: string | null
          failed_at?: string | null
          id?: string
          metadata?: Json | null
          notification_type?: string
          recipient_email?: string
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string
          subject?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "email_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      email_templates: {
        Row: {
          body_html_template: string
          body_text_template: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          notification_type: string
          subject_template: string
          template_name: string
          updated_at: string | null
          variables: Json | null
        }
        Insert: {
          body_html_template: string
          body_text_template?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          notification_type: string
          subject_template: string
          template_name: string
          updated_at?: string | null
          variables?: Json | null
        }
        Update: {
          body_html_template?: string
          body_text_template?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          notification_type?: string
          subject_template?: string
          template_name?: string
          updated_at?: string | null
          variables?: Json | null
        }
        Relationships: []
      }
      faq_chatbot: {
        Row: {
          answer: string
          category: string | null
          created_at: string | null
          id: string
          question: string
          updated_at: string | null
        }
        Insert: {
          answer: string
          category?: string | null
          created_at?: string | null
          id?: string
          question: string
          updated_at?: string | null
        }
        Update: {
          answer?: string
          category?: string | null
          created_at?: string | null
          id?: string
          question?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      favorite_lists: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          icon: string | null
          id: string
          is_default: boolean | null
          is_public: boolean | null
          name: string
          share_code: string | null
          updated_at: string | null
          user_id: string
          view_count: number | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_default?: boolean | null
          is_public?: boolean | null
          name: string
          share_code?: string | null
          updated_at?: string | null
          user_id: string
          view_count?: number | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_default?: boolean | null
          is_public?: boolean | null
          name?: string
          share_code?: string | null
          updated_at?: string | null
          user_id?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "favorite_lists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorite_lists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "favorite_lists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorite_lists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      generated_templates: {
        Row: {
          created_at: string | null
          generated_content: string | null
          id: string
          patient_info: Json | null
          status: string | null
          template_type: string
          therapist_id: string
          title: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          generated_content?: string | null
          id?: string
          patient_info?: Json | null
          status?: string | null
          template_type: string
          therapist_id: string
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          generated_content?: string | null
          id?: string
          patient_info?: Json | null
          status?: string | null
          template_type?: string
          therapist_id?: string
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      insurance_providers: {
        Row: {
          code: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          updated_at: string | null
          website: string | null
        }
        Insert: {
          code?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          code?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      legal_disputes: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          description: string | null
          id: string
          priority: string | null
          reported_by: string | null
          resolution: string | null
          resolution_date: string | null
          status: string | null
          title: string
          type: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          priority?: string | null
          reported_by?: string | null
          resolution?: string | null
          resolution_date?: string | null
          status?: string | null
          title: string
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          priority?: string | null
          reported_by?: string | null
          resolution?: string | null
          resolution_date?: string | null
          status?: string | null
          title?: string
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "legal_disputes_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legal_disputes_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "legal_disputes_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legal_disputes_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      legal_document_versions: {
        Row: {
          change_summary: string | null
          content: string | null
          created_at: string | null
          created_by: string | null
          document_id: string
          id: string
          version: number
        }
        Insert: {
          change_summary?: string | null
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          document_id: string
          id?: string
          version: number
        }
        Update: {
          change_summary?: string | null
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          document_id?: string
          id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "legal_document_versions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legal_document_versions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "legal_document_versions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legal_document_versions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "legal_document_versions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "legal_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_documents: {
        Row: {
          content: string | null
          created_at: string | null
          created_by: string | null
          effective_date: string | null
          expiry_date: string | null
          id: string
          published_at: string | null
          slug: string | null
          status: string | null
          title: string
          type: string
          updated_at: string | null
          version: number | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          effective_date?: string | null
          expiry_date?: string | null
          id?: string
          published_at?: string | null
          slug?: string | null
          status?: string | null
          title: string
          type?: string
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          effective_date?: string | null
          expiry_date?: string | null
          id?: string
          published_at?: string | null
          slug?: string | null
          status?: string | null
          title?: string
          type?: string
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "legal_documents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legal_documents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "legal_documents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legal_documents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      legal_policies: {
        Row: {
          category: string | null
          content: string | null
          created_at: string | null
          created_by: string | null
          id: string
          responsible: string | null
          review_date: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          responsible?: string | null
          review_date?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          responsible?: string | null
          review_date?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "legal_policies_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legal_policies_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "legal_policies_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legal_policies_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      legal_signatures: {
        Row: {
          accepted_at: string | null
          document_id: string
          document_version: number
          id: string
          ip_address: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          document_id: string
          document_version: number
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          document_id?: string
          document_version?: number
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "legal_signatures_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "legal_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legal_signatures_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legal_signatures_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "legal_signatures_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legal_signatures_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      marketing_leads: {
        Row: {
          city: string | null
          contacted_at: string | null
          converted_at: string | null
          country: string | null
          created_at: string | null
          created_by: string | null
          doctoralia_url: string | null
          email: string | null
          first_purchase_date: string | null
          full_name: string | null
          has_doctoralia: boolean | null
          id: string
          imported_at: string | null
          institution: string | null
          last_activity_date: string | null
          metadata: Json | null
          notes: string | null
          phone: string | null
          region: string | null
          rut: string | null
          segment: string | null
          source: string
          specialty: string | null
          status: string | null
          tags: Json | null
          total_orders: number | null
          total_spent: number | null
          updated_at: string | null
        }
        Insert: {
          city?: string | null
          contacted_at?: string | null
          converted_at?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          doctoralia_url?: string | null
          email?: string | null
          first_purchase_date?: string | null
          full_name?: string | null
          has_doctoralia?: boolean | null
          id?: string
          imported_at?: string | null
          institution?: string | null
          last_activity_date?: string | null
          metadata?: Json | null
          notes?: string | null
          phone?: string | null
          region?: string | null
          rut?: string | null
          segment?: string | null
          source?: string
          specialty?: string | null
          status?: string | null
          tags?: Json | null
          total_orders?: number | null
          total_spent?: number | null
          updated_at?: string | null
        }
        Update: {
          city?: string | null
          contacted_at?: string | null
          converted_at?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          doctoralia_url?: string | null
          email?: string | null
          first_purchase_date?: string | null
          full_name?: string | null
          has_doctoralia?: boolean | null
          id?: string
          imported_at?: string | null
          institution?: string | null
          last_activity_date?: string | null
          metadata?: Json | null
          notes?: string | null
          phone?: string | null
          region?: string | null
          rut?: string | null
          segment?: string | null
          source?: string
          specialty?: string | null
          status?: string | null
          tags?: Json | null
          total_orders?: number | null
          total_spent?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketing_leads_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_leads_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "marketing_leads_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_leads_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      marketplace_favorites: {
        Row: {
          created_at: string | null
          id: string
          marketplace_plan_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          marketplace_plan_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          marketplace_plan_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_favorites_marketplace_plan_id_fkey"
            columns: ["marketplace_plan_id"]
            isOneToOne: false
            referencedRelation: "marketplace_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "marketplace_favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      marketplace_items: {
        Row: {
          admin_feedback: string | null
          author_credentials: string | null
          badge_text: string | null
          bundle_ids: Json | null
          category: string | null
          commission_percentage: number | null
          created_at: string | null
          currency: string | null
          description: string | null
          discount_price: number | null
          downsell_ids: Json | null
          duration_weeks: number | null
          gallery_urls: Json | null
          hide_add_to_cart: boolean | null
          id: string
          is_active: boolean | null
          is_approved: boolean | null
          item_type: string
          language: string | null
          plan_template_id: string | null
          preview_content: Json | null
          price: number
          product_id: string | null
          rating: number | null
          related_ids: Json | null
          sample_pdf_url: string | null
          seller_id: string
          sku: string | null
          slug: string | null
          subtitle: string | null
          target_age_max: number | null
          target_age_min: number | null
          target_diagnosis: string[] | null
          therapist_material_id: string | null
          therapist_plan_template_id: string | null
          title: string
          total_activities: number | null
          total_reviews: number | null
          total_sales: number | null
          total_sessions: number | null
          track_quantity: boolean | null
          updated_at: string | null
          upsell_ids: Json | null
          view_count: number | null
        }
        Insert: {
          admin_feedback?: string | null
          author_credentials?: string | null
          badge_text?: string | null
          bundle_ids?: Json | null
          category?: string | null
          commission_percentage?: number | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          discount_price?: number | null
          downsell_ids?: Json | null
          duration_weeks?: number | null
          gallery_urls?: Json | null
          hide_add_to_cart?: boolean | null
          id?: string
          is_active?: boolean | null
          is_approved?: boolean | null
          item_type: string
          language?: string | null
          plan_template_id?: string | null
          preview_content?: Json | null
          price: number
          product_id?: string | null
          rating?: number | null
          related_ids?: Json | null
          sample_pdf_url?: string | null
          seller_id: string
          sku?: string | null
          slug?: string | null
          subtitle?: string | null
          target_age_max?: number | null
          target_age_min?: number | null
          target_diagnosis?: string[] | null
          therapist_material_id?: string | null
          therapist_plan_template_id?: string | null
          title: string
          total_activities?: number | null
          total_reviews?: number | null
          total_sales?: number | null
          total_sessions?: number | null
          track_quantity?: boolean | null
          updated_at?: string | null
          upsell_ids?: Json | null
          view_count?: number | null
        }
        Update: {
          admin_feedback?: string | null
          author_credentials?: string | null
          badge_text?: string | null
          bundle_ids?: Json | null
          category?: string | null
          commission_percentage?: number | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          discount_price?: number | null
          downsell_ids?: Json | null
          duration_weeks?: number | null
          gallery_urls?: Json | null
          hide_add_to_cart?: boolean | null
          id?: string
          is_active?: boolean | null
          is_approved?: boolean | null
          item_type?: string
          language?: string | null
          plan_template_id?: string | null
          preview_content?: Json | null
          price?: number
          product_id?: string | null
          rating?: number | null
          related_ids?: Json | null
          sample_pdf_url?: string | null
          seller_id?: string
          sku?: string | null
          slug?: string | null
          subtitle?: string | null
          target_age_max?: number | null
          target_age_min?: number | null
          target_diagnosis?: string[] | null
          therapist_material_id?: string | null
          therapist_plan_template_id?: string | null
          title?: string
          total_activities?: number | null
          total_reviews?: number | null
          total_sales?: number | null
          total_sessions?: number | null
          track_quantity?: boolean | null
          updated_at?: string | null
          upsell_ids?: Json | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_marketplace_plan_template"
            columns: ["plan_template_id"]
            isOneToOne: false
            referencedRelation: "treatment_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_items_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_items_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "marketplace_items_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_items_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "marketplace_items_therapist_material_fk"
            columns: ["therapist_material_id"]
            isOneToOne: false
            referencedRelation: "therapist_materials"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_orders: {
        Row: {
          buyer_id: string
          created_at: string | null
          currency: string | null
          id: string
          notes: string | null
          order_number: string
          payment_id: string | null
          payment_method: string | null
          status: string | null
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          buyer_id: string
          created_at?: string | null
          currency?: string | null
          id?: string
          notes?: string | null
          order_number: string
          payment_id?: string | null
          payment_method?: string | null
          status?: string | null
          total_amount: number
          updated_at?: string | null
        }
        Update: {
          buyer_id?: string
          created_at?: string | null
          currency?: string | null
          id?: string
          notes?: string | null
          order_number?: string
          payment_id?: string | null
          payment_method?: string | null
          status?: string | null
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_orders_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_orders_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "marketplace_orders_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_orders_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      marketplace_payouts: {
        Row: {
          author_id: string
          created_at: string | null
          gross_amount: number
          id: string
          net_amount: number
          paid_at: string | null
          payment_method: string | null
          payment_reference: string | null
          period_end: string
          period_start: string
          platform_fee: number
          status: string | null
        }
        Insert: {
          author_id: string
          created_at?: string | null
          gross_amount: number
          id?: string
          net_amount: number
          paid_at?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          period_end: string
          period_start: string
          platform_fee: number
          status?: string | null
        }
        Update: {
          author_id?: string
          created_at?: string | null
          gross_amount?: number
          id?: string
          net_amount?: number
          paid_at?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          period_end?: string
          period_start?: string
          platform_fee?: number
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_payouts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_payouts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "marketplace_payouts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_payouts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      marketplace_plans: {
        Row: {
          author_credentials: string | null
          author_id: string
          author_name: string | null
          average_rating: number | null
          cover_image_url: string | null
          created_at: string | null
          description: string | null
          discount_percentage: number | null
          discount_valid_until: string | null
          duration_weeks: number
          id: string
          is_featured: boolean | null
          is_free: boolean | null
          language: string | null
          long_description: string | null
          meta_description: string | null
          meta_title: string | null
          name: string
          objectives_preview: Json | null
          original_plan_id: string | null
          preview_video_url: string | null
          price_clp: number
          price_usd: number | null
          published_at: string | null
          purchase_count: number | null
          review_count: number | null
          sample_pdf_url: string | null
          slug: string | null
          status: string | null
          tags: string[] | null
          target_age_max: number | null
          target_age_min: number | null
          target_diagnosis: string[] | null
          total_activities: number | null
          total_sessions: number
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          author_credentials?: string | null
          author_id: string
          author_name?: string | null
          average_rating?: number | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          discount_percentage?: number | null
          discount_valid_until?: string | null
          duration_weeks?: number
          id?: string
          is_featured?: boolean | null
          is_free?: boolean | null
          language?: string | null
          long_description?: string | null
          meta_description?: string | null
          meta_title?: string | null
          name: string
          objectives_preview?: Json | null
          original_plan_id?: string | null
          preview_video_url?: string | null
          price_clp?: number
          price_usd?: number | null
          published_at?: string | null
          purchase_count?: number | null
          review_count?: number | null
          sample_pdf_url?: string | null
          slug?: string | null
          status?: string | null
          tags?: string[] | null
          target_age_max?: number | null
          target_age_min?: number | null
          target_diagnosis?: string[] | null
          total_activities?: number | null
          total_sessions?: number
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          author_credentials?: string | null
          author_id?: string
          author_name?: string | null
          average_rating?: number | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          discount_percentage?: number | null
          discount_valid_until?: string | null
          duration_weeks?: number
          id?: string
          is_featured?: boolean | null
          is_free?: boolean | null
          language?: string | null
          long_description?: string | null
          meta_description?: string | null
          meta_title?: string | null
          name?: string
          objectives_preview?: Json | null
          original_plan_id?: string | null
          preview_video_url?: string | null
          price_clp?: number
          price_usd?: number | null
          published_at?: string | null
          purchase_count?: number | null
          review_count?: number | null
          sample_pdf_url?: string | null
          slug?: string | null
          status?: string | null
          tags?: string[] | null
          target_age_max?: number | null
          target_age_min?: number | null
          target_diagnosis?: string[] | null
          total_activities?: number | null
          total_sessions?: number
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_plans_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_plans_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "marketplace_plans_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_plans_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "marketplace_plans_original_plan_id_fkey"
            columns: ["original_plan_id"]
            isOneToOne: false
            referencedRelation: "treatment_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_purchases: {
        Row: {
          buyer_id: string
          cloned_plan_id: string | null
          completed_at: string | null
          created_at: string | null
          currency: string | null
          discount_applied: number | null
          id: string
          license_expires_at: string | null
          license_type: string | null
          marketplace_plan_id: string
          payment_method: string | null
          payment_reference: string | null
          payment_status: string | null
          price_paid: number
        }
        Insert: {
          buyer_id: string
          cloned_plan_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          currency?: string | null
          discount_applied?: number | null
          id?: string
          license_expires_at?: string | null
          license_type?: string | null
          marketplace_plan_id: string
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          price_paid: number
        }
        Update: {
          buyer_id?: string
          cloned_plan_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          currency?: string | null
          discount_applied?: number | null
          id?: string
          license_expires_at?: string | null
          license_type?: string | null
          marketplace_plan_id?: string
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          price_paid?: number
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_purchases_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_purchases_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "marketplace_purchases_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_purchases_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "marketplace_purchases_cloned_plan_id_fkey"
            columns: ["cloned_plan_id"]
            isOneToOne: false
            referencedRelation: "treatment_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_purchases_marketplace_plan_id_fkey"
            columns: ["marketplace_plan_id"]
            isOneToOne: false
            referencedRelation: "marketplace_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_review_votes: {
        Row: {
          created_at: string | null
          id: string
          review_id: string
          user_id: string
          vote_type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          review_id: string
          user_id: string
          vote_type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          review_id?: string
          user_id?: string
          vote_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_review_votes_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "marketplace_reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_review_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_review_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "marketplace_review_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_review_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      marketplace_reviews: {
        Row: {
          attachments: Json | null
          author_responded_at: string | null
          author_response: string | null
          cons: string[] | null
          content: string | null
          created_at: string | null
          diagnosis_used_for: string[] | null
          helpful_count: number | null
          id: string
          is_edited: boolean | null
          is_featured: boolean | null
          is_verified_purchase: boolean | null
          is_visible: boolean | null
          marketplace_item_id: string
          moderated_at: string | null
          moderated_by: string | null
          moderation_reason: string | null
          not_helpful_count: number | null
          order_id: string | null
          patient_age_range: string | null
          pros: string[] | null
          published_at: string | null
          purchase_date: string | null
          rating: number
          rating_ease_of_use: number | null
          rating_effectiveness: number | null
          rating_quality: number | null
          rating_value: number | null
          report_count: number | null
          reviewer_id: string
          search_vector: unknown
          sessions_completed: number | null
          status: string | null
          title: string | null
          updated_at: string | null
          verification_date: string | null
          would_recommend: boolean | null
        }
        Insert: {
          attachments?: Json | null
          author_responded_at?: string | null
          author_response?: string | null
          cons?: string[] | null
          content?: string | null
          created_at?: string | null
          diagnosis_used_for?: string[] | null
          helpful_count?: number | null
          id?: string
          is_edited?: boolean | null
          is_featured?: boolean | null
          is_verified_purchase?: boolean | null
          is_visible?: boolean | null
          marketplace_item_id: string
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_reason?: string | null
          not_helpful_count?: number | null
          order_id?: string | null
          patient_age_range?: string | null
          pros?: string[] | null
          published_at?: string | null
          purchase_date?: string | null
          rating: number
          rating_ease_of_use?: number | null
          rating_effectiveness?: number | null
          rating_quality?: number | null
          rating_value?: number | null
          report_count?: number | null
          reviewer_id: string
          search_vector?: unknown
          sessions_completed?: number | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          verification_date?: string | null
          would_recommend?: boolean | null
        }
        Update: {
          attachments?: Json | null
          author_responded_at?: string | null
          author_response?: string | null
          cons?: string[] | null
          content?: string | null
          created_at?: string | null
          diagnosis_used_for?: string[] | null
          helpful_count?: number | null
          id?: string
          is_edited?: boolean | null
          is_featured?: boolean | null
          is_verified_purchase?: boolean | null
          is_visible?: boolean | null
          marketplace_item_id?: string
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_reason?: string | null
          not_helpful_count?: number | null
          order_id?: string | null
          patient_age_range?: string | null
          pros?: string[] | null
          published_at?: string | null
          purchase_date?: string | null
          rating?: number
          rating_ease_of_use?: number | null
          rating_effectiveness?: number | null
          rating_quality?: number | null
          rating_value?: number | null
          report_count?: number | null
          reviewer_id?: string
          search_vector?: unknown
          sessions_completed?: number | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          verification_date?: string | null
          would_recommend?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_reviews_marketplace_item_id_fkey"
            columns: ["marketplace_item_id"]
            isOneToOne: false
            referencedRelation: "marketplace_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_reviews_marketplace_item_id_fkey"
            columns: ["marketplace_item_id"]
            isOneToOne: false
            referencedRelation: "marketplace_items_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "marketplace_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "marketplace_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      marketplace_saved_searches: {
        Row: {
          created_at: string | null
          filters: Json
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          filters: Json
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          filters?: Json
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      measure_scales: {
        Row: {
          citation: string | null
          created_at: string | null
          description: string | null
          domain: string
          higher_is_better: boolean | null
          id: string
          max_value: number | null
          min_value: number | null
          name: string
        }
        Insert: {
          citation?: string | null
          created_at?: string | null
          description?: string | null
          domain: string
          higher_is_better?: boolean | null
          id?: string
          max_value?: number | null
          min_value?: number | null
          name: string
        }
        Update: {
          citation?: string | null
          created_at?: string | null
          description?: string | null
          domain?: string
          higher_is_better?: boolean | null
          id?: string
          max_value?: number | null
          min_value?: number | null
          name?: string
        }
        Relationships: []
      }
      membership_plans: {
        Row: {
          billing_cycle: string
          created_at: string | null
          description: string | null
          features: Json | null
          id: string
          is_active: boolean | null
          is_public: boolean | null
          name: string
          price_clp: number
          price_usd: number | null
          updated_at: string | null
        }
        Insert: {
          billing_cycle: string
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          is_public?: boolean | null
          name: string
          price_clp: number
          price_usd?: number | null
          updated_at?: string | null
        }
        Update: {
          billing_cycle?: string
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          is_public?: boolean | null
          name?: string
          price_clp?: number
          price_usd?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      metrics_summary: {
        Row: {
          average_session_duration: number | null
          completion_rate: number | null
          created_at: string | null
          id: string
          metric_type: string
          metrics_data: Json
          period_end: string
          period_start: string
          total_patients: number | null
          total_revenue: number | null
          total_sessions: number | null
          user_id: string
        }
        Insert: {
          average_session_duration?: number | null
          completion_rate?: number | null
          created_at?: string | null
          id?: string
          metric_type: string
          metrics_data: Json
          period_end: string
          period_start: string
          total_patients?: number | null
          total_revenue?: number | null
          total_sessions?: number | null
          user_id: string
        }
        Update: {
          average_session_duration?: number | null
          completion_rate?: number | null
          created_at?: string | null
          id?: string
          metric_type?: string
          metrics_data?: Json
          period_end?: string
          period_start?: string
          total_patients?: number | null
          total_revenue?: number | null
          total_sessions?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "metrics_summary_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "metrics_summary_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "metrics_summary_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "metrics_summary_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      moderation_logs: {
        Row: {
          action: string
          created_at: string | null
          entity_id: string
          entity_type: string
          id: string
          moderator_id: string | null
          reason: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          moderator_id?: string | null
          reason?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          moderator_id?: string | null
          reason?: string | null
        }
        Relationships: []
      }
      motivational_patient: {
        Row: {
          id: string
          patient_id: string
          phrase: string | null
          phrase_id: string
          seen: boolean | null
          seen_at: string | null
          sent_at: string | null
        }
        Insert: {
          id?: string
          patient_id: string
          phrase?: string | null
          phrase_id: string
          seen?: boolean | null
          seen_at?: string | null
          sent_at?: string | null
        }
        Update: {
          id?: string
          patient_id?: string
          phrase?: string | null
          phrase_id?: string
          seen?: boolean | null
          seen_at?: string | null
          sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "motivational_patient_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "motivational_patient_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "motivational_patient_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "motivational_patient_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "motivational_patient_phrase_id_fkey"
            columns: ["phrase_id"]
            isOneToOne: false
            referencedRelation: "motivational_phrases"
            referencedColumns: ["id"]
          },
        ]
      }
      motivational_phrases: {
        Row: {
          author: string | null
          category: string | null
          content: string
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          language: string | null
          updated_at: string | null
        }
        Insert: {
          author?: string | null
          category?: string | null
          content: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          language?: string | null
          updated_at?: string | null
        }
        Update: {
          author?: string | null
          category?: string | null
          content?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          language?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "motivational_phrases_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "motivational_phrases_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "motivational_phrases_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "motivational_phrases_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string | null
          data: Json | null
          expires_at: string | null
          id: string
          message: string
          priority: string | null
          read: boolean | null
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string | null
          data?: Json | null
          expires_at?: string | null
          id?: string
          message: string
          priority?: string | null
          read?: boolean | null
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string | null
          data?: Json | null
          expires_at?: string | null
          id?: string
          message?: string
          priority?: string | null
          read?: boolean | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      notiz_sessions: {
        Row: {
          audio_file_path: string | null
          created_at: string | null
          extracted_data: Json | null
          id: string
          key_points: string[] | null
          next_steps: string[] | null
          patient_id: string | null
          status: string | null
          summary: string | null
          therapist_id: string
          transcription: string | null
          updated_at: string | null
        }
        Insert: {
          audio_file_path?: string | null
          created_at?: string | null
          extracted_data?: Json | null
          id?: string
          key_points?: string[] | null
          next_steps?: string[] | null
          patient_id?: string | null
          status?: string | null
          summary?: string | null
          therapist_id: string
          transcription?: string | null
          updated_at?: string | null
        }
        Update: {
          audio_file_path?: string | null
          created_at?: string | null
          extracted_data?: Json | null
          id?: string
          key_points?: string[] | null
          next_steps?: string[] | null
          patient_id?: string | null
          status?: string | null
          summary?: string | null
          therapist_id?: string
          transcription?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notiz_sessions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notiz_sessions_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notiz_sessions_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "notiz_sessions_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notiz_sessions_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      order_items: {
        Row: {
          commission_amount: number | null
          created_at: string | null
          discount_amount: number | null
          id: string
          marketplace_item_id: string
          order_id: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          commission_amount?: number | null
          created_at?: string | null
          discount_amount?: number | null
          id?: string
          marketplace_item_id: string
          order_id: string
          quantity?: number
          total_price: number
          unit_price: number
        }
        Update: {
          commission_amount?: number | null
          created_at?: string | null
          discount_amount?: number | null
          id?: string
          marketplace_item_id?: string
          order_id?: string
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_marketplace_item_id_fkey"
            columns: ["marketplace_item_id"]
            isOneToOne: false
            referencedRelation: "marketplace_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_marketplace_item_id_fkey"
            columns: ["marketplace_item_id"]
            isOneToOne: false
            referencedRelation: "marketplace_items_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "marketplace_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string | null
          currency: string
          id: string
          patient_id: string | null
          status: string
          therapist_id: string
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          currency?: string
          id?: string
          patient_id?: string | null
          status?: string
          therapist_id: string
          total_amount: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string
          id?: string
          patient_id?: string | null
          status?: string
          therapist_id?: string
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "orders_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "orders_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "orders_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      patient_access_grants: {
        Row: {
          accepted_at: string | null
          access_level: string
          granted_at: string | null
          granted_by: string
          granted_to: string | null
          id: string
          is_active: boolean | null
          notes: string | null
          patient_id: string
          profile_id: string
          revoked_at: string | null
          share_token: string | null
          token_expires_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          access_level?: string
          granted_at?: string | null
          granted_by?: string
          granted_to?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          patient_id: string
          profile_id: string
          revoked_at?: string | null
          share_token?: string | null
          token_expires_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          access_level?: string
          granted_at?: string | null
          granted_by?: string
          granted_to?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          patient_id?: string
          profile_id?: string
          revoked_at?: string | null
          share_token?: string | null
          token_expires_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_access_grants_granted_to_fkey"
            columns: ["granted_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_access_grants_granted_to_fkey"
            columns: ["granted_to"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "patient_access_grants_granted_to_fkey"
            columns: ["granted_to"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_access_grants_granted_to_fkey"
            columns: ["granted_to"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "patient_access_grants_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_access_grants_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_access_grants_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "patient_access_grants_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_access_grants_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      patient_activities: {
        Row: {
          created_at: string | null
          description: string | null
          difficulty: Database["public"]["Enums"]["difficulty_enum"] | null
          display_order: number | null
          exercise_id: string | null
          goal_id: string | null
          id: string
          image_url: string | null
          instructions: string | null
          is_active: boolean | null
          name: string
          patient_id: string
          pdf_url: string | null
          updated_at: string | null
          video_url: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          difficulty?: Database["public"]["Enums"]["difficulty_enum"] | null
          display_order?: number | null
          exercise_id?: string | null
          goal_id?: string | null
          id?: string
          image_url?: string | null
          instructions?: string | null
          is_active?: boolean | null
          name: string
          patient_id: string
          pdf_url?: string | null
          updated_at?: string | null
          video_url?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          difficulty?: Database["public"]["Enums"]["difficulty_enum"] | null
          display_order?: number | null
          exercise_id?: string | null
          goal_id?: string | null
          id?: string
          image_url?: string | null
          instructions?: string | null
          is_active?: boolean | null
          name?: string
          patient_id?: string
          pdf_url?: string | null
          updated_at?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_patient_activities_exercise"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "therapist_exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_activities_exercise_fk"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "therapist_exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_activities_goal_fk"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "patient_goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_activities_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "patient_goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_activities_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_activities_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "patient_activities_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_activities_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      patient_activity_logs: {
        Row: {
          achievement_level: number | null
          activity_id: string
          activity_type: string | null
          completion_date: string | null
          created_at: string | null
          duration_minutes: number | null
          id: string
          log_date: string | null
          notes: string | null
          observation: string | null
          patient_id: string
          score: number | null
          session_id: string | null
          therapist_id: string | null
          updated_at: string | null
        }
        Insert: {
          achievement_level?: number | null
          activity_id: string
          activity_type?: string | null
          completion_date?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          log_date?: string | null
          notes?: string | null
          observation?: string | null
          patient_id: string
          score?: number | null
          session_id?: string | null
          therapist_id?: string | null
          updated_at?: string | null
        }
        Update: {
          achievement_level?: number | null
          activity_id?: string
          activity_type?: string | null
          completion_date?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          log_date?: string | null
          notes?: string | null
          observation?: string | null
          patient_id?: string
          score?: number | null
          session_id?: string | null
          therapist_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_activity_logs_activity_fk"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "patient_activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_activity_logs_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "patient_activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_activity_logs_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_activity_logs_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "patient_activity_logs_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_activity_logs_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "patient_activity_logs_session_fk"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "clinical_history"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_activity_logs_session_fk"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "v_patient_clinical_timeline"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_activity_logs_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_activity_logs_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "patient_activity_logs_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_activity_logs_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      patient_assigned_plans: {
        Row: {
          completed_sessions: number | null
          created_at: string | null
          current_session: number | null
          end_date: string | null
          id: string
          name: string
          notes: string | null
          patient_id: string
          plan_template_id: string | null
          progress_percentage: number | null
          specialty_id: string | null
          start_date: string
          status: string | null
          therapist_id: string
          total_sessions: number | null
          updated_at: string | null
        }
        Insert: {
          completed_sessions?: number | null
          created_at?: string | null
          current_session?: number | null
          end_date?: string | null
          id?: string
          name: string
          notes?: string | null
          patient_id: string
          plan_template_id?: string | null
          progress_percentage?: number | null
          specialty_id?: string | null
          start_date: string
          status?: string | null
          therapist_id: string
          total_sessions?: number | null
          updated_at?: string | null
        }
        Update: {
          completed_sessions?: number | null
          created_at?: string | null
          current_session?: number | null
          end_date?: string | null
          id?: string
          name?: string
          notes?: string | null
          patient_id?: string
          plan_template_id?: string | null
          progress_percentage?: number | null
          specialty_id?: string | null
          start_date?: string
          status?: string | null
          therapist_id?: string
          total_sessions?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_assigned_plans_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_assigned_plans_plan_template_fk"
            columns: ["plan_template_id"]
            isOneToOne: false
            referencedRelation: "treatment_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_assigned_plans_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_assigned_plans_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "patient_assigned_plans_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_assigned_plans_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      patient_development_areas: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      patient_diagnoses: {
        Row: {
          clinical_description: string | null
          code_id: string
          created_at: string | null
          diagnosed_at: string | null
          diagnosis_name: string
          id: string
          is_active: boolean | null
          is_primary: boolean | null
          patient_id: string
          related_entry_id: string | null
          severity: string | null
          specialty_id: string | null
          system_id: string
          therapist_id: string
          updated_at: string | null
        }
        Insert: {
          clinical_description?: string | null
          code_id: string
          created_at?: string | null
          diagnosed_at?: string | null
          diagnosis_name: string
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          patient_id: string
          related_entry_id?: string | null
          severity?: string | null
          specialty_id?: string | null
          system_id: string
          therapist_id: string
          updated_at?: string | null
        }
        Update: {
          clinical_description?: string | null
          code_id?: string
          created_at?: string | null
          diagnosed_at?: string | null
          diagnosis_name?: string
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          patient_id?: string
          related_entry_id?: string | null
          severity?: string | null
          specialty_id?: string | null
          system_id?: string
          therapist_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_diagnoses_code_fk"
            columns: ["code_id"]
            isOneToOne: false
            referencedRelation: "diagnosis_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_diagnoses_patient_fk"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_diagnoses_system_fk"
            columns: ["system_id"]
            isOneToOne: false
            referencedRelation: "diagnosis_systems"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_diagnoses_therapist_fk"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "therapist_details"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "patient_diagnoses_therapist_fk"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "patient_diagnoses_therapist_fk"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_metrics"
            referencedColumns: ["therapist_id"]
          },
        ]
      }
      patient_document_templates: {
        Row: {
          category: string | null
          content: string | null
          created_at: string | null
          id: string
          is_global: boolean | null
          name: string
          therapist_id: string | null
          updated_at: string | null
          variables: Json | null
        }
        Insert: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          is_global?: boolean | null
          name: string
          therapist_id?: string | null
          updated_at?: string | null
          variables?: Json | null
        }
        Update: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          is_global?: boolean | null
          name?: string
          therapist_id?: string | null
          updated_at?: string | null
          variables?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_document_templates_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_document_templates_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "patient_document_templates_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_document_templates_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      patient_documents: {
        Row: {
          created_at: string | null
          description: string | null
          document_date: string | null
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          patient_id: string
          source: string | null
          source_id: string | null
          therapist_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          document_date?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          patient_id: string
          source?: string | null
          source_id?: string | null
          therapist_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          document_date?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          patient_id?: string
          source?: string | null
          source_id?: string | null
          therapist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_documents_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_documents_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "patient_documents_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_documents_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "patient_documents_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_documents_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "patient_documents_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_documents_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      patient_evaluations: {
        Row: {
          created_at: string | null
          evaluation_date: string | null
          evaluation_type: string | null
          id: string
          observations: string | null
          patient_id: string
          results: Json | null
          specialty_id: string | null
          therapist_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          evaluation_date?: string | null
          evaluation_type?: string | null
          id?: string
          observations?: string | null
          patient_id: string
          results?: Json | null
          specialty_id?: string | null
          therapist_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          evaluation_date?: string | null
          evaluation_type?: string | null
          id?: string
          observations?: string | null
          patient_id?: string
          results?: Json | null
          specialty_id?: string | null
          therapist_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_evaluations_patient_fk"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_evaluations_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_evaluations_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "patient_evaluations_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_evaluations_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "patient_evaluations_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_evaluations_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "patient_evaluations_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_evaluations_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      patient_goals: {
        Row: {
          achieved: boolean | null
          achieved_date: string | null
          area_id: string | null
          created_at: string | null
          description: string | null
          evaluation_id: string | null
          goal_type: Database["public"]["Enums"]["goal_type_enum"]
          id: string
          patient_id: string
          plan_objective_id: string | null
          target_date: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          achieved?: boolean | null
          achieved_date?: string | null
          area_id?: string | null
          created_at?: string | null
          description?: string | null
          evaluation_id?: string | null
          goal_type: Database["public"]["Enums"]["goal_type_enum"]
          id?: string
          patient_id: string
          plan_objective_id?: string | null
          target_date?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          achieved?: boolean | null
          achieved_date?: string | null
          area_id?: string | null
          created_at?: string | null
          description?: string | null
          evaluation_id?: string | null
          goal_type?: Database["public"]["Enums"]["goal_type_enum"]
          id?: string
          patient_id?: string
          plan_objective_id?: string | null
          target_date?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_goals_area_fk"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "patient_development_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_goals_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "patient_development_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_goals_evaluation_fk"
            columns: ["evaluation_id"]
            isOneToOne: false
            referencedRelation: "patient_evaluations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_goals_evaluation_id_fkey"
            columns: ["evaluation_id"]
            isOneToOne: false
            referencedRelation: "patient_evaluations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_goals_patient_fk"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_goals_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_goals_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "patient_goals_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_goals_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "patient_goals_plan_objective_fk"
            columns: ["plan_objective_id"]
            isOneToOne: false
            referencedRelation: "plan_objectives"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_materials: {
        Row: {
          acknowledged_at: string | null
          assigned_by: string | null
          assigned_reason: string | null
          category: string | null
          completed_at: string | null
          created_at: string | null
          description: string | null
          file_type: string | null
          file_url: string | null
          id: string
          is_public: boolean | null
          name: string
          patient_id: string
          source_material_id: string | null
          therapist_id: string
          updated_at: string | null
          visible_to_family: boolean | null
        }
        Insert: {
          acknowledged_at?: string | null
          assigned_by?: string | null
          assigned_reason?: string | null
          category?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_public?: boolean | null
          name: string
          patient_id: string
          source_material_id?: string | null
          therapist_id: string
          updated_at?: string | null
          visible_to_family?: boolean | null
        }
        Update: {
          acknowledged_at?: string | null
          assigned_by?: string | null
          assigned_reason?: string | null
          category?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_public?: boolean | null
          name?: string
          patient_id?: string
          source_material_id?: string | null
          therapist_id?: string
          updated_at?: string | null
          visible_to_family?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_materials_assigned_by_fk"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "therapist_details"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "patient_materials_assigned_by_fk"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "v_public_therapists"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "patient_materials_assigned_by_fk"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "v_therapist_metrics"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "patient_materials_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_materials_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "patient_materials_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_materials_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "patient_materials_source_material_fk"
            columns: ["source_material_id"]
            isOneToOne: false
            referencedRelation: "therapist_materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_materials_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_materials_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "patient_materials_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_materials_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      patient_payments: {
        Row: {
          amount: number
          appointment_id: string | null
          concept: string | null
          created_at: string | null
          currency: string | null
          id: string
          notes: string | null
          patient_id: string
          payment_date: string
          payment_method: string | null
          payment_reference: string | null
          status: string | null
          therapist_id: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          appointment_id?: string | null
          concept?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          notes?: string | null
          patient_id: string
          payment_date?: string
          payment_method?: string | null
          payment_reference?: string | null
          status?: string | null
          therapist_id: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          appointment_id?: string | null
          concept?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          notes?: string | null
          patient_id?: string
          payment_date?: string
          payment_method?: string | null
          payment_reference?: string | null
          status?: string | null
          therapist_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_payments_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_payments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_payments_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_payments_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "patient_payments_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_payments_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      patient_private_notes: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          patient_id: string
          therapist_id: string
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          patient_id: string
          therapist_id: string
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          patient_id?: string
          therapist_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_private_notes_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_private_notes_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "patient_private_notes_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_private_notes_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "patient_private_notes_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_private_notes_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "patient_private_notes_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_private_notes_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      patient_questions: {
        Row: {
          body: string | null
          created_at: string | null
          id: string
          patient_id: string
          specialty_id: string | null
          status: string
          therapist_id: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string | null
          id?: string
          patient_id: string
          specialty_id?: string | null
          status?: string
          therapist_id?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string | null
          id?: string
          patient_id?: string
          specialty_id?: string | null
          status?: string
          therapist_id?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_questions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_questions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "patient_questions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_questions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "patient_questions_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "specialties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_questions_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "specialties_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_questions_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "v_reputation_badges"
            referencedColumns: ["specialty_id"]
          },
          {
            foreignKeyName: "patient_questions_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "v_reputation_specialty_scores"
            referencedColumns: ["specialty_id"]
          },
          {
            foreignKeyName: "patient_questions_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_specialty_progress"
            referencedColumns: ["specialty_id"]
          },
          {
            foreignKeyName: "patient_questions_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_questions_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "patient_questions_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_questions_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      patient_reviews: {
        Row: {
          created_at: string | null
          id: string
          rating: number | null
          review: string | null
          therapist_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          rating?: number | null
          review?: string | null
          therapist_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          rating?: number | null
          review?: string | null
          therapist_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_reviews_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_reviews_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "patient_reviews_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_reviews_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      patients: {
        Row: {
          admission_date: string | null
          alerts: Json | null
          allergies: string | null
          anamnesis_template: string | null
          attention_type: string | null
          avatar_url: string | null
          birth_city: string | null
          clinic_id: string | null
          clinical_consent_date: string | null
          clinical_consent_signed: boolean | null
          communication_channel: string | null
          created_at: string | null
          diagnosis: string | null
          diagnosis_summary: string | null
          discharge_date: string | null
          evaluation_template: string | null
          id: string
          is_blacklisted: boolean | null
          last_appointment_date: string | null
          medical_history: string | null
          nationality: string | null
          notes: string | null
          notiz_consent: boolean | null
          other_info: string | null
          patient_type: string | null
          profile_id: string | null
          responsible_name: string | null
          responsible_rut: string | null
          status: string | null
          therapist_id: string | null
          treatment_stage: string | null
          updated_at: string | null
        }
        Insert: {
          admission_date?: string | null
          alerts?: Json | null
          allergies?: string | null
          anamnesis_template?: string | null
          attention_type?: string | null
          avatar_url?: string | null
          birth_city?: string | null
          clinic_id?: string | null
          clinical_consent_date?: string | null
          clinical_consent_signed?: boolean | null
          communication_channel?: string | null
          created_at?: string | null
          diagnosis?: string | null
          diagnosis_summary?: string | null
          discharge_date?: string | null
          evaluation_template?: string | null
          id?: string
          is_blacklisted?: boolean | null
          last_appointment_date?: string | null
          medical_history?: string | null
          nationality?: string | null
          notes?: string | null
          notiz_consent?: boolean | null
          other_info?: string | null
          patient_type?: string | null
          profile_id?: string | null
          responsible_name?: string | null
          responsible_rut?: string | null
          status?: string | null
          therapist_id?: string | null
          treatment_stage?: string | null
          updated_at?: string | null
        }
        Update: {
          admission_date?: string | null
          alerts?: Json | null
          allergies?: string | null
          anamnesis_template?: string | null
          attention_type?: string | null
          avatar_url?: string | null
          birth_city?: string | null
          clinic_id?: string | null
          clinical_consent_date?: string | null
          clinical_consent_signed?: boolean | null
          communication_channel?: string | null
          created_at?: string | null
          diagnosis?: string | null
          diagnosis_summary?: string | null
          discharge_date?: string | null
          evaluation_template?: string | null
          id?: string
          is_blacklisted?: boolean | null
          last_appointment_date?: string | null
          medical_history?: string | null
          nationality?: string | null
          notes?: string | null
          notiz_consent?: boolean | null
          other_info?: string | null
          patient_type?: string | null
          profile_id?: string | null
          responsible_name?: string | null
          responsible_rut?: string | null
          status?: string | null
          therapist_id?: string | null
          treatment_stage?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patients_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patients_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patients_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "patients_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patients_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          appointment_id: string | null
          created_at: string
          currency: string
          id: string
          method: string | null
          paid_at: string | null
          patient_id: string
          service_id: string | null
          status: Database["public"]["Enums"]["payment_status"]
          therapist_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          appointment_id?: string | null
          created_at?: string
          currency: string
          id?: string
          method?: string | null
          paid_at?: string | null
          patient_id: string
          service_id?: string | null
          status: Database["public"]["Enums"]["payment_status"]
          therapist_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          appointment_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          method?: string | null
          paid_at?: string | null
          patient_id?: string
          service_id?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          therapist_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: true
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "payments_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      performance_metrics: {
        Row: {
          created_at: string | null
          id: string
          measured_at: string | null
          metadata: Json | null
          metric_name: string
          metric_unit: string | null
          metric_value: number | null
          resource_id: string | null
          resource_type: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          measured_at?: string | null
          metadata?: Json | null
          metric_name: string
          metric_unit?: string | null
          metric_value?: number | null
          resource_id?: string | null
          resource_type?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          measured_at?: string | null
          metadata?: Json | null
          metric_name?: string
          metric_unit?: string | null
          metric_value?: number | null
          resource_id?: string | null
          resource_type?: string | null
        }
        Relationships: []
      }
      pie_paci: {
        Row: {
          created_at: string | null
          id: string
          objectives: Json | null
          period: string | null
          student_id: string | null
          therapist_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          objectives?: Json | null
          period?: string | null
          student_id?: string | null
          therapist_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          objectives?: Json | null
          period?: string | null
          student_id?: string | null
          therapist_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pie_paci_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "pie_students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pie_paci_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pie_paci_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "pie_paci_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pie_paci_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      pie_schedule_blocks: {
        Row: {
          academic_year: number | null
          block_type: string | null
          created_at: string | null
          day_of_week: number | null
          end_time: string
          id: string
          is_manual: boolean | null
          school_id: string | null
          start_time: string
          student_id: string | null
          therapist_id: string | null
        }
        Insert: {
          academic_year?: number | null
          block_type?: string | null
          created_at?: string | null
          day_of_week?: number | null
          end_time: string
          id?: string
          is_manual?: boolean | null
          school_id?: string | null
          start_time: string
          student_id?: string | null
          therapist_id?: string | null
        }
        Update: {
          academic_year?: number | null
          block_type?: string | null
          created_at?: string | null
          day_of_week?: number | null
          end_time?: string
          id?: string
          is_manual?: boolean | null
          school_id?: string | null
          start_time?: string
          student_id?: string | null
          therapist_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pie_schedule_blocks_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pie_schedule_blocks_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "pie_students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pie_schedule_blocks_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pie_schedule_blocks_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "pie_schedule_blocks_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pie_schedule_blocks_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      pie_sessions: {
        Row: {
          attended: boolean | null
          created_at: string | null
          id: string
          notes: string | null
          objectives_worked: string[] | null
          schedule_block_id: string | null
          session_date: string
          student_id: string | null
          student_performance: string | null
          therapist_id: string | null
        }
        Insert: {
          attended?: boolean | null
          created_at?: string | null
          id?: string
          notes?: string | null
          objectives_worked?: string[] | null
          schedule_block_id?: string | null
          session_date: string
          student_id?: string | null
          student_performance?: string | null
          therapist_id?: string | null
        }
        Update: {
          attended?: boolean | null
          created_at?: string | null
          id?: string
          notes?: string | null
          objectives_worked?: string[] | null
          schedule_block_id?: string | null
          session_date?: string
          student_id?: string | null
          student_performance?: string | null
          therapist_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pie_sessions_schedule_block_id_fkey"
            columns: ["schedule_block_id"]
            isOneToOne: false
            referencedRelation: "pie_schedule_blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pie_sessions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "pie_students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pie_sessions_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pie_sessions_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "pie_sessions_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pie_sessions_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      pie_student_data: {
        Row: {
          academic_year: number | null
          active: boolean | null
          course: string | null
          created_at: string | null
          diagnosis: string | null
          id: string
          nee_type: string | null
          patient_id: string
          school_id: string | null
          teacher_name: string | null
          therapist_id: string
          updated_at: string | null
        }
        Insert: {
          academic_year?: number | null
          active?: boolean | null
          course?: string | null
          created_at?: string | null
          diagnosis?: string | null
          id?: string
          nee_type?: string | null
          patient_id: string
          school_id?: string | null
          teacher_name?: string | null
          therapist_id: string
          updated_at?: string | null
        }
        Update: {
          academic_year?: number | null
          active?: boolean | null
          course?: string | null
          created_at?: string | null
          diagnosis?: string | null
          id?: string
          nee_type?: string | null
          patient_id?: string
          school_id?: string | null
          teacher_name?: string | null
          therapist_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pie_student_data_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pie_student_data_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pie_student_data_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pie_student_data_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "pie_student_data_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pie_student_data_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      pie_students: {
        Row: {
          active: boolean | null
          course: string | null
          created_at: string | null
          diagnosis: string | null
          full_name: string
          id: string
          nee_type: string | null
          rut: string | null
          school_id: string | null
          teacher_name: string | null
        }
        Insert: {
          active?: boolean | null
          course?: string | null
          created_at?: string | null
          diagnosis?: string | null
          full_name: string
          id?: string
          nee_type?: string | null
          rut?: string | null
          school_id?: string | null
          teacher_name?: string | null
        }
        Update: {
          active?: boolean | null
          course?: string | null
          created_at?: string | null
          diagnosis?: string | null
          full_name?: string
          id?: string
          nee_type?: string | null
          rut?: string | null
          school_id?: string | null
          teacher_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pie_students_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      pie_therapist_schools: {
        Row: {
          academic_year: number | null
          hours_assigned: number | null
          id: string
          school_id: string | null
          therapist_id: string | null
        }
        Insert: {
          academic_year?: number | null
          hours_assigned?: number | null
          id?: string
          school_id?: string | null
          therapist_id?: string | null
        }
        Update: {
          academic_year?: number | null
          hours_assigned?: number | null
          id?: string
          school_id?: string | null
          therapist_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pie_therapist_schools_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pie_therapist_schools_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pie_therapist_schools_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "pie_therapist_schools_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pie_therapist_schools_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      plan_objective_activities: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          duration_minutes: number | null
          exercise_id: string | null
          id: string
          instructions: string | null
          is_active: boolean | null
          materials: string | null
          name: string
          objective_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          duration_minutes?: number | null
          exercise_id?: string | null
          id?: string
          instructions?: string | null
          is_active?: boolean | null
          materials?: string | null
          name: string
          objective_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          duration_minutes?: number | null
          exercise_id?: string | null
          id?: string
          instructions?: string | null
          is_active?: boolean | null
          materials?: string | null
          name?: string
          objective_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_objective_activities_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "therapist_exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_objective_activities_objective_id_fkey"
            columns: ["objective_id"]
            isOneToOne: false
            referencedRelation: "plan_objectives"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_objectives: {
        Row: {
          baseline_value: number | null
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          objective_type: string
          parent_objective_id: string | null
          plan_id: string
          scale_id: string | null
          target_value: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          baseline_value?: number | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          objective_type: string
          parent_objective_id?: string | null
          plan_id: string
          scale_id?: string | null
          target_value?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          baseline_value?: number | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          objective_type?: string
          parent_objective_id?: string | null
          plan_id?: string
          scale_id?: string | null
          target_value?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plan_objectives_parent_objective_id_fkey"
            columns: ["parent_objective_id"]
            isOneToOne: false
            referencedRelation: "plan_objectives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_objectives_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "treatment_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_objectives_scale_id_fkey"
            columns: ["scale_id"]
            isOneToOne: false
            referencedRelation: "measure_scales"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_sessions: {
        Row: {
          assigned_plan_id: string
          clinical_history_id: string | null
          completed_date: string | null
          created_at: string | null
          duration_minutes: number | null
          id: string
          notes: string | null
          scheduled_date: string | null
          session_number: number
          status: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_plan_id: string
          clinical_history_id?: string | null
          completed_date?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          scheduled_date?: string | null
          session_number: number
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_plan_id?: string
          clinical_history_id?: string | null
          completed_date?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          scheduled_date?: string | null
          session_number?: number
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plan_sessions_assigned_plan_id_fkey"
            columns: ["assigned_plan_id"]
            isOneToOne: false
            referencedRelation: "patient_assigned_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_sessions_assigned_plan_id_fkey"
            columns: ["assigned_plan_id"]
            isOneToOne: false
            referencedRelation: "v_patient_plans_summary"
            referencedColumns: ["assigned_plan_id"]
          },
          {
            foreignKeyName: "plan_sessions_clinical_history_id_fkey"
            columns: ["clinical_history_id"]
            isOneToOne: false
            referencedRelation: "clinical_history"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_sessions_clinical_history_id_fkey"
            columns: ["clinical_history_id"]
            isOneToOne: false
            referencedRelation: "v_patient_clinical_timeline"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_template_exercises: {
        Row: {
          created_at: string | null
          day_number: number | null
          duration_minutes: number | null
          exercise_id: string
          id: string
          notes: string | null
          order_index: number | null
          plan_template_id: string | null
          repetitions: number | null
          therapist_plan_template_id: string | null
          week_number: number | null
        }
        Insert: {
          created_at?: string | null
          day_number?: number | null
          duration_minutes?: number | null
          exercise_id: string
          id?: string
          notes?: string | null
          order_index?: number | null
          plan_template_id?: string | null
          repetitions?: number | null
          therapist_plan_template_id?: string | null
          week_number?: number | null
        }
        Update: {
          created_at?: string | null
          day_number?: number | null
          duration_minutes?: number | null
          exercise_id?: string
          id?: string
          notes?: string | null
          order_index?: number | null
          plan_template_id?: string | null
          repetitions?: number | null
          therapist_plan_template_id?: string | null
          week_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "plan_template_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "therapist_exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      planification_types: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      platform_feedback: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string
          rating: number
          reward_amount: number | null
          reward_granted: boolean | null
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string
          rating: number
          reward_amount?: number | null
          reward_granted?: boolean | null
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string
          rating?: number
          reward_amount?: number | null
          reward_granted?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "platform_feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      products: {
        Row: {
          created_at: string | null
          currency: string
          current_stock: number | null
          description: string | null
          download_url: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_featured: boolean
          media_url: string | null
          name: string
          options: Json | null
          preview_url: string | null
          price: number
          product_type: string
          sku: string | null
          stock_limit: number | null
          tags: string[] | null
          therapist_id: string
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          currency?: string
          current_stock?: number | null
          description?: string | null
          download_url?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean
          media_url?: string | null
          name: string
          options?: Json | null
          preview_url?: string | null
          price: number
          product_type?: string
          sku?: string | null
          stock_limit?: number | null
          tags?: string[] | null
          therapist_id: string
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string
          current_stock?: number | null
          description?: string | null
          download_url?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean
          media_url?: string | null
          name?: string
          options?: Json | null
          preview_url?: string | null
          price?: number
          product_type?: string
          sku?: string | null
          stock_limit?: number | null
          tags?: string[] | null
          therapist_id?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "products_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profiles: {
        Row: {
          birthdate: string | null
          city_id: number | null
          created_at: string | null
          email: string
          full_name: string | null
          gender: string | null
          id: string
          is_super_admin: boolean | null
          languages: Json | null
          onboarding_completed: boolean | null
          phone: string | null
          region_id: number | null
          role: Database["public"]["Enums"]["user_role"]
          rut: string | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          birthdate?: string | null
          city_id?: number | null
          created_at?: string | null
          email: string
          full_name?: string | null
          gender?: string | null
          id: string
          is_super_admin?: boolean | null
          languages?: Json | null
          onboarding_completed?: boolean | null
          phone?: string | null
          region_id?: number | null
          role?: Database["public"]["Enums"]["user_role"]
          rut?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          birthdate?: string | null
          city_id?: number | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          gender?: string | null
          id?: string
          is_super_admin?: boolean | null
          languages?: Json | null
          onboarding_completed?: boolean | null
          phone?: string | null
          region_id?: number | null
          role?: Database["public"]["Enums"]["user_role"]
          rut?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_profiles_city"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_profiles_region"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      progress_reports: {
        Row: {
          analysis_data: Json
          created_at: string | null
          generated_at: string | null
          id: string
          patient_id: string
          report_type: string
          shared_with_admin: boolean | null
          shared_with_patient: boolean | null
          therapist_id: string
        }
        Insert: {
          analysis_data: Json
          created_at?: string | null
          generated_at?: string | null
          id?: string
          patient_id: string
          report_type: string
          shared_with_admin?: boolean | null
          shared_with_patient?: boolean | null
          therapist_id: string
        }
        Update: {
          analysis_data?: Json
          created_at?: string | null
          generated_at?: string | null
          id?: string
          patient_id?: string
          report_type?: string
          shared_with_admin?: boolean | null
          shared_with_patient?: boolean | null
          therapist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "progress_reports_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_reports_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "progress_reports_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_reports_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "progress_reports_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_reports_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "progress_reports_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_reports_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      refund_requests: {
        Row: {
          admin_notes: string | null
          amount: number
          created_at: string | null
          currency: string | null
          detailed_explanation: string | null
          id: string
          invoice_id: string | null
          mp_payment_id: string | null
          mp_refund_id: string | null
          reason: string
          refund_method: string | null
          refund_reference: string | null
          refunded_at: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          subscription_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          created_at?: string | null
          currency?: string | null
          detailed_explanation?: string | null
          id?: string
          invoice_id?: string | null
          mp_payment_id?: string | null
          mp_refund_id?: string | null
          reason: string
          refund_method?: string | null
          refund_reference?: string | null
          refunded_at?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          subscription_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          created_at?: string | null
          currency?: string | null
          detailed_explanation?: string | null
          id?: string
          invoice_id?: string | null
          mp_payment_id?: string | null
          mp_refund_id?: string | null
          reason?: string
          refund_method?: string | null
          refund_reference?: string | null
          refunded_at?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          subscription_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "refund_requests_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "billing_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refund_requests_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "therapist_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      regions: {
        Row: {
          country_code: string | null
          created_at: string | null
          id: number
          name: string
          ordinal: number | null
        }
        Insert: {
          country_code?: string | null
          created_at?: string | null
          id?: number
          name: string
          ordinal?: number | null
        }
        Update: {
          country_code?: string | null
          created_at?: string | null
          id?: number
          name?: string
          ordinal?: number | null
        }
        Relationships: []
      }
      reminder_logs: {
        Row: {
          appointment_id: string | null
          channel: string | null
          delivery_status: string | null
          error_details: Json | null
          id: string
          recipient_email: string | null
          reminder_id: string | null
          reminder_type: string | null
          sent_at: string | null
        }
        Insert: {
          appointment_id?: string | null
          channel?: string | null
          delivery_status?: string | null
          error_details?: Json | null
          id?: string
          recipient_email?: string | null
          reminder_id?: string | null
          reminder_type?: string | null
          sent_at?: string | null
        }
        Update: {
          appointment_id?: string | null
          channel?: string | null
          delivery_status?: string | null
          error_details?: Json | null
          id?: string
          recipient_email?: string | null
          reminder_id?: string | null
          reminder_type?: string | null
          sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reminder_logs_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminder_logs_reminder_id_fkey"
            columns: ["reminder_id"]
            isOneToOne: false
            referencedRelation: "scheduled_reminders"
            referencedColumns: ["id"]
          },
        ]
      }
      report_logs: {
        Row: {
          action: string
          details: Json | null
          id: string
          ip_address: unknown
          report_id: string
          timestamp: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          report_id: string
          timestamp?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          report_id?: string
          timestamp?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_logs_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "clinical_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "report_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      review_helpful_votes: {
        Row: {
          created_at: string | null
          id: string
          is_helpful: boolean
          review_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_helpful: boolean
          review_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_helpful?: boolean
          review_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_helpful_votes_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "marketplace_reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_helpful_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_helpful_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "review_helpful_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_helpful_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      review_reports: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          reason: string
          reporter_id: string
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          review_id: string
          status: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          reason: string
          reporter_id: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          review_id: string
          status?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          reason?: string
          reporter_id?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          review_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "review_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "review_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "review_reports_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_reports_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "review_reports_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_reports_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "review_reports_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "marketplace_reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          amount: number
          buyer_id: string | null
          commission_amount: number
          created_at: string | null
          creator_earnings: number
          id: string
          payment_id: string | null
          product_id: string | null
          seller_id: string | null
          status: string | null
        }
        Insert: {
          amount: number
          buyer_id?: string | null
          commission_amount: number
          created_at?: string | null
          creator_earnings: number
          id?: string
          payment_id?: string | null
          product_id?: string | null
          seller_id?: string | null
          status?: string | null
        }
        Update: {
          amount?: number
          buyer_id?: string | null
          commission_amount?: number
          created_at?: string | null
          creator_earnings?: number
          id?: string
          payment_id?: string | null
          product_id?: string | null
          seller_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "sales_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "sales_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "marketplace_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "marketplace_items_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "sales_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      sales_summary: {
        Row: {
          client_info: Json | null
          commission_amount: number | null
          created_at: string | null
          delivery_status: string | null
          id: string
          net_amount: number | null
          order_id: string
          payment_status: string | null
          product_info: Json
          quantity: number
          seller_id: string
          total_price: number
          unit_price: number
        }
        Insert: {
          client_info?: Json | null
          commission_amount?: number | null
          created_at?: string | null
          delivery_status?: string | null
          id?: string
          net_amount?: number | null
          order_id: string
          payment_status?: string | null
          product_info: Json
          quantity: number
          seller_id: string
          total_price: number
          unit_price: number
        }
        Update: {
          client_info?: Json | null
          commission_amount?: number | null
          created_at?: string | null
          delivery_status?: string | null
          id?: string
          net_amount?: number | null
          order_id?: string
          payment_status?: string | null
          product_info?: Json
          quantity?: number
          seller_id?: string
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_summary_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "marketplace_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_summary_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_summary_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "sales_summary_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_summary_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      scheduled_reminders: {
        Row: {
          appointment_id: string | null
          channel: string | null
          created_at: string | null
          error_message: string | null
          id: string
          patient_id: string | null
          reminder_type: string | null
          scheduled_time: string | null
          sent_at: string | null
          status: string | null
          therapist_id: string | null
          updated_at: string | null
        }
        Insert: {
          appointment_id?: string | null
          channel?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          patient_id?: string | null
          reminder_type?: string | null
          scheduled_time?: string | null
          sent_at?: string | null
          status?: string | null
          therapist_id?: string | null
          updated_at?: string | null
        }
        Update: {
          appointment_id?: string | null
          channel?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          patient_id?: string | null
          reminder_type?: string | null
          scheduled_time?: string | null
          sent_at?: string | null
          status?: string | null
          therapist_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_reminders_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_reminders_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_reminders_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "scheduled_reminders_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_reminders_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "scheduled_reminders_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_reminders_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "scheduled_reminders_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_reminders_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      schools: {
        Row: {
          city_id: number | null
          coordinator_id: string | null
          created_at: string | null
          id: string
          name: string
          rbd: string | null
          region_id: number | null
        }
        Insert: {
          city_id?: number | null
          coordinator_id?: string | null
          created_at?: string | null
          id?: string
          name: string
          rbd?: string | null
          region_id?: number | null
        }
        Update: {
          city_id?: number | null
          coordinator_id?: string | null
          created_at?: string | null
          id?: string
          name?: string
          rbd?: string | null
          region_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "schools_coordinator_id_fkey"
            columns: ["coordinator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schools_coordinator_id_fkey"
            columns: ["coordinator_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "schools_coordinator_id_fkey"
            columns: ["coordinator_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schools_coordinator_id_fkey"
            columns: ["coordinator_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      search_logs: {
        Row: {
          clicked_result_id: string | null
          created_at: string | null
          id: string
          ip_address: unknown
          modalidad_received: string | null
          results_count: number | null
          search_filters: Json | null
          search_query: string
          search_type: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          clicked_result_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: unknown
          modalidad_received?: string | null
          results_count?: number | null
          search_filters?: Json | null
          search_query: string
          search_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          clicked_result_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: unknown
          modalidad_received?: string | null
          results_count?: number | null
          search_filters?: Json | null
          search_query?: string
          search_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "search_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "search_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "search_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "search_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      sensorial_evaluations: {
        Row: {
          atypical_sections: number | null
          classifications_by_section: Json | null
          created_at: string | null
          examinador: string | null
          fecha_evaluacion: string | null
          id: string
          informant_name: string | null
          informant_relationship: string | null
          observaciones: string | null
          overall_classification: string | null
          patient_id: string
          scores_by_section: Json | null
          status: string | null
          therapist_id: string
          total_score: number | null
          updated_at: string | null
        }
        Insert: {
          atypical_sections?: number | null
          classifications_by_section?: Json | null
          created_at?: string | null
          examinador?: string | null
          fecha_evaluacion?: string | null
          id?: string
          informant_name?: string | null
          informant_relationship?: string | null
          observaciones?: string | null
          overall_classification?: string | null
          patient_id: string
          scores_by_section?: Json | null
          status?: string | null
          therapist_id: string
          total_score?: number | null
          updated_at?: string | null
        }
        Update: {
          atypical_sections?: number | null
          classifications_by_section?: Json | null
          created_at?: string | null
          examinador?: string | null
          fecha_evaluacion?: string | null
          id?: string
          informant_name?: string | null
          informant_relationship?: string | null
          observaciones?: string | null
          overall_classification?: string | null
          patient_id?: string
          scores_by_section?: Json | null
          status?: string | null
          therapist_id?: string
          total_score?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sensorial_evaluations_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      sensorial_item_responses: {
        Row: {
          created_at: string | null
          evaluation_id: string
          id: string
          item_code: string
          item_name: string | null
          notes: string | null
          score: number | null
          section: string
        }
        Insert: {
          created_at?: string | null
          evaluation_id: string
          id?: string
          item_code: string
          item_name?: string | null
          notes?: string | null
          score?: number | null
          section: string
        }
        Update: {
          created_at?: string | null
          evaluation_id?: string
          id?: string
          item_code?: string
          item_name?: string | null
          notes?: string | null
          score?: number | null
          section?: string
        }
        Relationships: [
          {
            foreignKeyName: "sensorial_item_responses_evaluation_id_fkey"
            columns: ["evaluation_id"]
            isOneToOne: false
            referencedRelation: "sensorial_evaluations"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          clinic_id: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          duration_minutes: number | null
          id: string
          is_active: boolean | null
          name: string
          price: number | null
          therapist_id: string | null
          updated_at: string | null
        }
        Insert: {
          clinic_id?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          price?: number | null
          therapist_id?: string | null
          updated_at?: string | null
        }
        Update: {
          clinic_id?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number | null
          therapist_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "services_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "services_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      session_activities: {
        Row: {
          achievement_level: string | null
          activity_id: string | null
          created_at: string | null
          description: string | null
          display_order: number
          duration_minutes: number | null
          exercise_id: string | null
          id: string
          instructions: string | null
          materials: string | null
          name: string
          notes: string | null
          objective_id: string | null
          session_id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          achievement_level?: string | null
          activity_id?: string | null
          created_at?: string | null
          description?: string | null
          display_order: number
          duration_minutes?: number | null
          exercise_id?: string | null
          id?: string
          instructions?: string | null
          materials?: string | null
          name: string
          notes?: string | null
          objective_id?: string | null
          session_id: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          achievement_level?: string | null
          activity_id?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number
          duration_minutes?: number | null
          exercise_id?: string | null
          id?: string
          instructions?: string | null
          materials?: string | null
          name?: string
          notes?: string | null
          objective_id?: string | null
          session_id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "session_activities_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "plan_objective_activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_activities_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "therapist_exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_activities_objective_id_fkey"
            columns: ["objective_id"]
            isOneToOne: false
            referencedRelation: "plan_objectives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_activities_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "plan_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      specialties: {
        Row: {
          category: string | null
          description: string | null
          id: string
          name: string
          slug: string | null
        }
        Insert: {
          category?: string | null
          description?: string | null
          id?: string
          name: string
          slug?: string | null
        }
        Update: {
          category?: string | null
          description?: string | null
          id?: string
          name?: string
          slug?: string | null
        }
        Relationships: []
      }
      specialty_change_logs: {
        Row: {
          approved_by: string | null
          change_reason: string | null
          created_at: string | null
          id: string
          new_specialties: string[] | null
          old_specialties: string[] | null
          therapist_id: string
        }
        Insert: {
          approved_by?: string | null
          change_reason?: string | null
          created_at?: string | null
          id?: string
          new_specialties?: string[] | null
          old_specialties?: string[] | null
          therapist_id: string
        }
        Update: {
          approved_by?: string | null
          change_reason?: string | null
          created_at?: string | null
          id?: string
          new_specialties?: string[] | null
          old_specialties?: string[] | null
          therapist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "specialty_change_logs_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "specialty_change_logs_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "specialty_change_logs_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "specialty_change_logs_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "specialty_change_logs_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "specialty_change_logs_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "specialty_change_logs_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "specialty_change_logs_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      specialty_keywords: {
        Row: {
          created_at: string | null
          id: string
          keyword: string
          specialty_id: string
          weight: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          keyword: string
          specialty_id: string
          weight?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          keyword?: string
          specialty_id?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "specialty_keywords_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "specialties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "specialty_keywords_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "specialties_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "specialty_keywords_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "v_reputation_badges"
            referencedColumns: ["specialty_id"]
          },
          {
            foreignKeyName: "specialty_keywords_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "v_reputation_specialty_scores"
            referencedColumns: ["specialty_id"]
          },
          {
            foreignKeyName: "specialty_keywords_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_specialty_progress"
            referencedColumns: ["specialty_id"]
          },
        ]
      }
      subscription_payments: {
        Row: {
          amount: number
          created_at: string | null
          currency: string
          id: string
          invoice_url: string | null
          payment_method: string | null
          provider_payment_id: string | null
          status: string
          subscription_id: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string
          id?: string
          invoice_url?: string | null
          payment_method?: string | null
          provider_payment_id?: string | null
          status: string
          subscription_id?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string
          id?: string
          invoice_url?: string | null
          payment_method?: string | null
          provider_payment_id?: string | null
          status?: string
          subscription_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscription_payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "subscription_payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          billing_cycle: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          features: Json | null
          id: string
          is_active: boolean | null
          max_clinics: number | null
          max_patients: number | null
          max_storage_mb: number | null
          max_users: number | null
          name: string
          price: number
          slug: string | null
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          billing_cycle?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          max_clinics?: number | null
          max_patients?: number | null
          max_storage_mb?: number | null
          max_users?: number | null
          name: string
          price: number
          slug?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          billing_cycle?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          max_clinics?: number | null
          max_patients?: number | null
          max_storage_mb?: number | null
          max_users?: number | null
          name?: string
          price?: number
          slug?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          canceled_at: string | null
          created_at: string | null
          current_period_end: string
          current_period_start: string
          id: string
          metadata: Json | null
          plan_id: string | null
          status: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string | null
          current_period_end: string
          current_period_start: string
          id?: string
          metadata?: Json | null
          plan_id?: string | null
          status: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string | null
          current_period_end?: string
          current_period_start?: string
          id?: string
          metadata?: Json | null
          plan_id?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "membership_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      suggested_courses: {
        Row: {
          created_at: string | null
          id: string
          provider: string | null
          specialty_id: string | null
          status: string | null
          suggested_by: string | null
          title: string
          updated_at: string | null
          url: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          provider?: string | null
          specialty_id?: string | null
          status?: string | null
          suggested_by?: string | null
          title: string
          updated_at?: string | null
          url?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          provider?: string | null
          specialty_id?: string | null
          status?: string | null
          suggested_by?: string | null
          title?: string
          updated_at?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "suggested_courses_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "specialties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suggested_courses_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "specialties_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suggested_courses_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "v_reputation_badges"
            referencedColumns: ["specialty_id"]
          },
          {
            foreignKeyName: "suggested_courses_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "v_reputation_specialty_scores"
            referencedColumns: ["specialty_id"]
          },
          {
            foreignKeyName: "suggested_courses_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_specialty_progress"
            referencedColumns: ["specialty_id"]
          },
          {
            foreignKeyName: "suggested_courses_suggested_by_fkey"
            columns: ["suggested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suggested_courses_suggested_by_fkey"
            columns: ["suggested_by"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "suggested_courses_suggested_by_fkey"
            columns: ["suggested_by"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suggested_courses_suggested_by_fkey"
            columns: ["suggested_by"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      support_incident_notes: {
        Row: {
          author_id: string | null
          content: string
          created_at: string | null
          id: string
          incident_id: string | null
        }
        Insert: {
          author_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          incident_id?: string | null
        }
        Update: {
          author_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          incident_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_incident_notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_incident_notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "support_incident_notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_incident_notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "support_incident_notes_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "support_incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      support_incidents: {
        Row: {
          affected_service: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          resolved_at: string | null
          severity: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          affected_service?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          resolved_at?: string | null
          severity?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          affected_service?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          resolved_at?: string | null
          severity?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_incidents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_incidents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "support_incidents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_incidents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      support_ticket_notes: {
        Row: {
          author_id: string | null
          content: string
          created_at: string | null
          id: string
          is_internal: boolean | null
          ticket_id: string | null
        }
        Insert: {
          author_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          is_internal?: boolean | null
          ticket_id?: string | null
        }
        Update: {
          author_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          is_internal?: boolean | null
          ticket_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_ticket_notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_ticket_notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "support_ticket_notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_ticket_notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "support_ticket_notes_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          metadata: Json | null
          priority: string | null
          resolved_at: string | null
          status: string | null
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          priority?: string | null
          resolved_at?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          priority?: string | null
          resolved_at?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "support_tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "support_tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "support_tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      symptom_profiles: {
        Row: {
          additional_info: string | null
          created_at: string | null
          id: string
          patient_id: string | null
          symptoms: Json | null
          updated_at: string | null
        }
        Insert: {
          additional_info?: string | null
          created_at?: string | null
          id?: string
          patient_id?: string | null
          symptoms?: Json | null
          updated_at?: string | null
        }
        Update: {
          additional_info?: string | null
          created_at?: string | null
          id?: string
          patient_id?: string | null
          symptoms?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      system_logs: {
        Row: {
          created_at: string | null
          id: string
          level: string | null
          message: string
          metadata: Json | null
          source: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          level?: string | null
          message: string
          metadata?: Json | null
          source?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          level?: string | null
          message?: string
          metadata?: Json | null
          source?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "system_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "system_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      team_members: {
        Row: {
          clinic_id: string
          created_at: string | null
          id: string
          invitation_accepted_at: string | null
          invitation_sent_at: string | null
          invitation_token: string | null
          invited_by: string | null
          permissions: Json | null
          role: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          clinic_id: string
          created_at?: string | null
          id?: string
          invitation_accepted_at?: string | null
          invitation_sent_at?: string | null
          invitation_token?: string | null
          invited_by?: string | null
          permissions?: Json | null
          role?: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          clinic_id?: string
          created_at?: string | null
          id?: string
          invitation_accepted_at?: string | null
          invitation_sent_at?: string | null
          invitation_token?: string | null
          invited_by?: string | null
          permissions?: Json | null
          role?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      therapist_availabilities: {
        Row: {
          clinic_id: string | null
          created_at: string | null
          day_of_week: number
          end_time: string
          id: string
          is_active: boolean | null
          modality: Database["public"]["Enums"]["modality_enum"] | null
          start_time: string
          therapist_id: string
          updated_at: string | null
        }
        Insert: {
          clinic_id?: string | null
          created_at?: string | null
          day_of_week: number
          end_time: string
          id?: string
          is_active?: boolean | null
          modality?: Database["public"]["Enums"]["modality_enum"] | null
          start_time: string
          therapist_id: string
          updated_at?: string | null
        }
        Update: {
          clinic_id?: string | null
          created_at?: string | null
          day_of_week?: number
          end_time?: string
          id?: string
          is_active?: boolean | null
          modality?: Database["public"]["Enums"]["modality_enum"] | null
          start_time?: string
          therapist_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "therapist_availabilities_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "therapist_availabilities_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "therapist_availabilities_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "therapist_availabilities_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "therapist_availabilities_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      therapist_branding: {
        Row: {
          accent_color: string | null
          avatar_url: string | null
          background_color: string | null
          created_at: string | null
          font_family: string | null
          font_size_base: number | null
          id: string
          logo_url: string | null
          primary_color: string | null
          secondary_color: string | null
          text_color: string | null
          therapist_id: string | null
          updated_at: string | null
        }
        Insert: {
          accent_color?: string | null
          avatar_url?: string | null
          background_color?: string | null
          created_at?: string | null
          font_family?: string | null
          font_size_base?: number | null
          id?: string
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          text_color?: string | null
          therapist_id?: string | null
          updated_at?: string | null
        }
        Update: {
          accent_color?: string | null
          avatar_url?: string | null
          background_color?: string | null
          created_at?: string | null
          font_family?: string | null
          font_size_base?: number | null
          id?: string
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          text_color?: string | null
          therapist_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "therapist_branding_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "therapist_branding_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: true
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "therapist_branding_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: true
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "therapist_branding_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: true
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      therapist_commissions: {
        Row: {
          commission_amount: number
          commission_percentage: number
          created_at: string | null
          id: string
          order_item_id: string
          paid_at: string | null
          payment_reference: string | null
          status: string | null
          therapist_id: string
          updated_at: string | null
        }
        Insert: {
          commission_amount: number
          commission_percentage: number
          created_at?: string | null
          id?: string
          order_item_id: string
          paid_at?: string | null
          payment_reference?: string | null
          status?: string | null
          therapist_id: string
          updated_at?: string | null
        }
        Update: {
          commission_amount?: number
          commission_percentage?: number
          created_at?: string | null
          id?: string
          order_item_id?: string
          paid_at?: string | null
          payment_reference?: string | null
          status?: string | null
          therapist_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "therapist_commissions_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "therapist_commissions_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "therapist_commissions_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "therapist_commissions_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "therapist_commissions_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      therapist_conditions: {
        Row: {
          condition_name: string
          created_at: string | null
          id: string
          is_public: boolean
          specialty_id: string | null
          therapist_id: string
        }
        Insert: {
          condition_name: string
          created_at?: string | null
          id?: string
          is_public?: boolean
          specialty_id?: string | null
          therapist_id: string
        }
        Update: {
          condition_name?: string
          created_at?: string | null
          id?: string
          is_public?: boolean
          specialty_id?: string | null
          therapist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "therapist_conditions_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "therapist_conditions_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "therapist_conditions_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "therapist_conditions_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      therapist_details: {
        Row: {
          about_me: string | null
          account_holder_name: string | null
          account_holder_rut: string | null
          account_number: string | null
          account_type: string | null
          bank_email: string | null
          bank_name: string | null
          bank_verification_status: string | null
          bank_verified: boolean | null
          city_id: number | null
          created_at: string | null
          graduation_year: number | null
          headline_statement: string | null
          is_public: boolean | null
          languages: string[] | null
          main_address: string | null
          professional_title: string | null
          public_email: string | null
          registration_secreduc: string | null
          registration_supersalud: string | null
          reminder_preferences: Json | null
          slug: string | null
          social_facebook_url: string | null
          social_instagram_url: string | null
          social_linkedin_url: string | null
          social_twitter_url: string | null
          specialization_areas: string[] | null
          university: string | null
          updated_at: string | null
          user_id: string
          years_experience: number | null
        }
        Insert: {
          about_me?: string | null
          account_holder_name?: string | null
          account_holder_rut?: string | null
          account_number?: string | null
          account_type?: string | null
          bank_email?: string | null
          bank_name?: string | null
          bank_verification_status?: string | null
          bank_verified?: boolean | null
          city_id?: number | null
          created_at?: string | null
          graduation_year?: number | null
          headline_statement?: string | null
          is_public?: boolean | null
          languages?: string[] | null
          main_address?: string | null
          professional_title?: string | null
          public_email?: string | null
          registration_secreduc?: string | null
          registration_supersalud?: string | null
          reminder_preferences?: Json | null
          slug?: string | null
          social_facebook_url?: string | null
          social_instagram_url?: string | null
          social_linkedin_url?: string | null
          social_twitter_url?: string | null
          specialization_areas?: string[] | null
          university?: string | null
          updated_at?: string | null
          user_id: string
          years_experience?: number | null
        }
        Update: {
          about_me?: string | null
          account_holder_name?: string | null
          account_holder_rut?: string | null
          account_number?: string | null
          account_type?: string | null
          bank_email?: string | null
          bank_name?: string | null
          bank_verification_status?: string | null
          bank_verified?: boolean | null
          city_id?: number | null
          created_at?: string | null
          graduation_year?: number | null
          headline_statement?: string | null
          is_public?: boolean | null
          languages?: string[] | null
          main_address?: string | null
          professional_title?: string | null
          public_email?: string | null
          registration_secreduc?: string | null
          registration_supersalud?: string | null
          reminder_preferences?: Json | null
          slug?: string | null
          social_facebook_url?: string | null
          social_instagram_url?: string | null
          social_linkedin_url?: string | null
          social_twitter_url?: string | null
          specialization_areas?: string[] | null
          university?: string | null
          updated_at?: string | null
          user_id?: string
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_therapist_profile"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_therapist_profile"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "fk_therapist_profile"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_therapist_profile"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "therapist_details_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "therapist_details_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "therapist_details_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "therapist_details_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "therapist_details_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      therapist_documents: {
        Row: {
          category: string
          created_at: string
          education_level: string | null
          file_id: string
          id: string
          name: string
          size: number
          specialty_id: string | null
          storage_path: string
          therapist_id: string
          type: string
          updated_at: string
          verified: boolean | null
        }
        Insert: {
          category: string
          created_at?: string
          education_level?: string | null
          file_id: string
          id?: string
          name: string
          size: number
          specialty_id?: string | null
          storage_path: string
          therapist_id: string
          type: string
          updated_at?: string
          verified?: boolean | null
        }
        Update: {
          category?: string
          created_at?: string
          education_level?: string | null
          file_id?: string
          id?: string
          name?: string
          size?: number
          specialty_id?: string | null
          storage_path?: string
          therapist_id?: string
          type?: string
          updated_at?: string
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "therapist_documents_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "therapist_documents_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "therapist_documents_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "therapist_documents_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      therapist_education: {
        Row: {
          certificate_url: string | null
          created_at: string | null
          description: string | null
          education_level: string | null
          graduation_year: number | null
          hours: number | null
          id: string
          institution: string | null
          is_public: boolean | null
          specialty_id: string | null
          therapist_id: string | null
          title: string
          updated_at: string | null
          verified: boolean | null
        }
        Insert: {
          certificate_url?: string | null
          created_at?: string | null
          description?: string | null
          education_level?: string | null
          graduation_year?: number | null
          hours?: number | null
          id?: string
          institution?: string | null
          is_public?: boolean | null
          specialty_id?: string | null
          therapist_id?: string | null
          title: string
          updated_at?: string | null
          verified?: boolean | null
        }
        Update: {
          certificate_url?: string | null
          created_at?: string | null
          description?: string | null
          education_level?: string | null
          graduation_year?: number | null
          hours?: number | null
          id?: string
          institution?: string | null
          is_public?: boolean | null
          specialty_id?: string | null
          therapist_id?: string | null
          title?: string
          updated_at?: string | null
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "therapist_education_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "therapist_education_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "therapist_education_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "therapist_education_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      therapist_exercises: {
        Row: {
          category: string | null
          created_at: string | null
          default_duration_minutes: number | null
          description: string | null
          difficulty: Database["public"]["Enums"]["difficulty_enum"] | null
          exercise_type: string | null
          id: string
          image_url: string | null
          instructions: string | null
          is_active: boolean | null
          is_public: boolean | null
          materials: string | null
          name: string
          pdf_url: string | null
          therapist_id: string | null
          times_used: number | null
          updated_at: string | null
          usage_count: number | null
          video_url: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          default_duration_minutes?: number | null
          description?: string | null
          difficulty?: Database["public"]["Enums"]["difficulty_enum"] | null
          exercise_type?: string | null
          id?: string
          image_url?: string | null
          instructions?: string | null
          is_active?: boolean | null
          is_public?: boolean | null
          materials?: string | null
          name: string
          pdf_url?: string | null
          therapist_id?: string | null
          times_used?: number | null
          updated_at?: string | null
          usage_count?: number | null
          video_url?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          default_duration_minutes?: number | null
          description?: string | null
          difficulty?: Database["public"]["Enums"]["difficulty_enum"] | null
          exercise_type?: string | null
          id?: string
          image_url?: string | null
          instructions?: string | null
          is_active?: boolean | null
          is_public?: boolean | null
          materials?: string | null
          name?: string
          pdf_url?: string | null
          therapist_id?: string | null
          times_used?: number | null
          updated_at?: string | null
          usage_count?: number | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "therapist_exercises_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "therapist_exercises_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "therapist_exercises_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "therapist_exercises_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      therapist_experience: {
        Row: {
          created_at: string | null
          description: string | null
          end_date: string | null
          id: string
          institution: string
          is_public: boolean | null
          location: string | null
          role: string
          start_date: string | null
          therapist_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          institution: string
          is_public?: boolean | null
          location?: string | null
          role: string
          start_date?: string | null
          therapist_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          institution?: string
          is_public?: boolean | null
          location?: string | null
          role?: string
          start_date?: string | null
          therapist_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "therapist_experience_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "therapist_experience_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "therapist_experience_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "therapist_experience_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      therapist_favorite_activities: {
        Row: {
          activity_id: string
          created_at: string | null
          id: string
          therapist_id: string
        }
        Insert: {
          activity_id: string
          created_at?: string | null
          id?: string
          therapist_id: string
        }
        Update: {
          activity_id?: string
          created_at?: string | null
          id?: string
          therapist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "therapist_favorite_activities_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "therapist_exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "therapist_favorite_activities_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "therapist_favorite_activities_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "therapist_favorite_activities_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "therapist_favorite_activities_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      therapist_insurances: {
        Row: {
          coverage_details: string | null
          created_at: string | null
          id: string
          insurance_provider_id: string
          is_active: boolean | null
          therapist_id: string
          updated_at: string | null
        }
        Insert: {
          coverage_details?: string | null
          created_at?: string | null
          id?: string
          insurance_provider_id: string
          is_active?: boolean | null
          therapist_id: string
          updated_at?: string | null
        }
        Update: {
          coverage_details?: string | null
          created_at?: string | null
          id?: string
          insurance_provider_id?: string
          is_active?: boolean | null
          therapist_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "therapist_insurances_insurance_provider_id_fkey"
            columns: ["insurance_provider_id"]
            isOneToOne: false
            referencedRelation: "insurance_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "therapist_insurances_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "therapist_details"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "therapist_insurances_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "therapist_insurances_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_metrics"
            referencedColumns: ["therapist_id"]
          },
        ]
      }
      therapist_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          invite_code: string
          invitee_email: string | null
          invitee_id: string | null
          inviter_id: string
          reward_amount: number | null
          reward_credited: boolean | null
          status: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          invite_code: string
          invitee_email?: string | null
          invitee_id?: string | null
          inviter_id: string
          reward_amount?: number | null
          reward_credited?: boolean | null
          status?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          invite_code?: string
          invitee_email?: string | null
          invitee_id?: string | null
          inviter_id?: string
          reward_amount?: number | null
          reward_credited?: boolean | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "therapist_invitations_invitee_id_fkey"
            columns: ["invitee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "therapist_invitations_invitee_id_fkey"
            columns: ["invitee_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "therapist_invitations_invitee_id_fkey"
            columns: ["invitee_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "therapist_invitations_invitee_id_fkey"
            columns: ["invitee_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "therapist_invitations_inviter_id_fkey"
            columns: ["inviter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "therapist_invitations_inviter_id_fkey"
            columns: ["inviter_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "therapist_invitations_inviter_id_fkey"
            columns: ["inviter_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "therapist_invitations_inviter_id_fkey"
            columns: ["inviter_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      therapist_invite_quotas: {
        Row: {
          id: string
          last_reset_at: string | null
          monthly_limit: number
          therapist_id: string
          used_this_month: number
        }
        Insert: {
          id?: string
          last_reset_at?: string | null
          monthly_limit?: number
          therapist_id: string
          used_this_month?: number
        }
        Update: {
          id?: string
          last_reset_at?: string | null
          monthly_limit?: number
          therapist_id?: string
          used_this_month?: number
        }
        Relationships: [
          {
            foreignKeyName: "therapist_invite_quotas_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "therapist_invite_quotas_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: true
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "therapist_invite_quotas_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: true
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "therapist_invite_quotas_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: true
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      therapist_landing_pages: {
        Row: {
          contact_section: Json | null
          created_at: string | null
          custom_url: string
          hero_image_url: string | null
          hero_subtitle: string | null
          hero_title: string | null
          id: string
          meta_description: string | null
          meta_title: string | null
          published: boolean | null
          testimonials_section: Json | null
          theme_options: Json | null
          therapist_id: string
          updated_at: string | null
        }
        Insert: {
          contact_section?: Json | null
          created_at?: string | null
          custom_url: string
          hero_image_url?: string | null
          hero_subtitle?: string | null
          hero_title?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          published?: boolean | null
          testimonials_section?: Json | null
          theme_options?: Json | null
          therapist_id: string
          updated_at?: string | null
        }
        Update: {
          contact_section?: Json | null
          created_at?: string | null
          custom_url?: string
          hero_image_url?: string | null
          hero_subtitle?: string | null
          hero_title?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          published?: boolean | null
          testimonials_section?: Json | null
          theme_options?: Json | null
          therapist_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_therapist_landing_pages_therapist"
            columns: ["therapist_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_therapist_landing_pages_therapist"
            columns: ["therapist_id"]
            isOneToOne: true
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "fk_therapist_landing_pages_therapist"
            columns: ["therapist_id"]
            isOneToOne: true
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_therapist_landing_pages_therapist"
            columns: ["therapist_id"]
            isOneToOne: true
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      therapist_materials: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          file_name: string | null
          file_url: string
          id: string
          material_name: string
          therapist_id: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          file_name?: string | null
          file_url: string
          id?: string
          material_name: string
          therapist_id?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          file_name?: string | null
          file_url?: string
          id?: string
          material_name?: string
          therapist_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "therapist_materials_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "therapist_materials_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "therapist_materials_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "therapist_materials_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      therapist_recommendations: {
        Row: {
          id: string
          match_score: number | null
          patient_id: string | null
          recommendation_date: string | null
          recommended_therapist_id: string | null
          symptoms_matched: Json | null
        }
        Insert: {
          id?: string
          match_score?: number | null
          patient_id?: string | null
          recommendation_date?: string | null
          recommended_therapist_id?: string | null
          symptoms_matched?: Json | null
        }
        Update: {
          id?: string
          match_score?: number | null
          patient_id?: string | null
          recommendation_date?: string | null
          recommended_therapist_id?: string | null
          symptoms_matched?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "therapist_recommendations_recommended_therapist_id_fkey"
            columns: ["recommended_therapist_id"]
            isOneToOne: false
            referencedRelation: "therapists"
            referencedColumns: ["id"]
          },
        ]
      }
      therapist_services: {
        Row: {
          created_at: string | null
          duration_minutes: number | null
          id: string
          insurance_coverage: boolean | null
          insurance_providers: string[] | null
          is_active: boolean | null
          is_public: boolean | null
          max_age: number | null
          max_participants: number | null
          min_age: number | null
          modality: string | null
          price_clp: number | null
          price_usd: number | null
          requirements: string | null
          service_category: string | null
          service_description: string | null
          service_name: string
          therapist_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          insurance_coverage?: boolean | null
          insurance_providers?: string[] | null
          is_active?: boolean | null
          is_public?: boolean | null
          max_age?: number | null
          max_participants?: number | null
          min_age?: number | null
          modality?: string | null
          price_clp?: number | null
          price_usd?: number | null
          requirements?: string | null
          service_category?: string | null
          service_description?: string | null
          service_name: string
          therapist_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          insurance_coverage?: boolean | null
          insurance_providers?: string[] | null
          is_active?: boolean | null
          is_public?: boolean | null
          max_age?: number | null
          max_participants?: number | null
          min_age?: number | null
          modality?: string | null
          price_clp?: number | null
          price_usd?: number | null
          requirements?: string | null
          service_category?: string | null
          service_description?: string | null
          service_name?: string
          therapist_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "therapist_services_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "therapist_services_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "therapist_services_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "therapist_services_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      therapist_specialties: {
        Row: {
          created_at: string | null
          is_public: boolean
          specialty_id: string
          therapist_id: string
        }
        Insert: {
          created_at?: string | null
          is_public?: boolean
          specialty_id: string
          therapist_id: string
        }
        Update: {
          created_at?: string | null
          is_public?: boolean
          specialty_id?: string
          therapist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "therapist_specialties_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "specialties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "therapist_specialties_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "specialties_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "therapist_specialties_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "v_reputation_badges"
            referencedColumns: ["specialty_id"]
          },
          {
            foreignKeyName: "therapist_specialties_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "v_reputation_specialty_scores"
            referencedColumns: ["specialty_id"]
          },
          {
            foreignKeyName: "therapist_specialties_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_specialty_progress"
            referencedColumns: ["specialty_id"]
          },
          {
            foreignKeyName: "therapist_specialties_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "therapist_specialties_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "therapist_specialties_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "therapist_specialties_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      therapist_subscriptions: {
        Row: {
          billing_cycle: string
          cancel_at_period_end: boolean | null
          cancelled_at: string | null
          clinic_id: string | null
          created_at: string | null
          currency: string | null
          current_period_end: string
          current_period_start: string
          discount_percent: number | null
          external_reference: string | null
          final_price: number | null
          id: string
          last_payment_id: string | null
          mercadopago_subscription_id: string | null
          mp_preapproval_id: string | null
          mp_subscription_id: string | null
          next_payment_date: string | null
          original_price: number | null
          payment_id: string | null
          payment_method: string | null
          payment_status: string | null
          plan_name: string
          preference_id: string | null
          price: number
          status: string | null
          therapist_id: string
          updated_at: string | null
        }
        Insert: {
          billing_cycle: string
          cancel_at_period_end?: boolean | null
          cancelled_at?: string | null
          clinic_id?: string | null
          created_at?: string | null
          currency?: string | null
          current_period_end: string
          current_period_start: string
          discount_percent?: number | null
          external_reference?: string | null
          final_price?: number | null
          id?: string
          last_payment_id?: string | null
          mercadopago_subscription_id?: string | null
          mp_preapproval_id?: string | null
          mp_subscription_id?: string | null
          next_payment_date?: string | null
          original_price?: number | null
          payment_id?: string | null
          payment_method?: string | null
          payment_status?: string | null
          plan_name: string
          preference_id?: string | null
          price: number
          status?: string | null
          therapist_id: string
          updated_at?: string | null
        }
        Update: {
          billing_cycle?: string
          cancel_at_period_end?: boolean | null
          cancelled_at?: string | null
          clinic_id?: string | null
          created_at?: string | null
          currency?: string | null
          current_period_end?: string
          current_period_start?: string
          discount_percent?: number | null
          external_reference?: string | null
          final_price?: number | null
          id?: string
          last_payment_id?: string | null
          mercadopago_subscription_id?: string | null
          mp_preapproval_id?: string | null
          mp_subscription_id?: string | null
          next_payment_date?: string | null
          original_price?: number | null
          payment_id?: string | null
          payment_method?: string | null
          payment_status?: string | null
          plan_name?: string
          preference_id?: string | null
          price?: number
          status?: string | null
          therapist_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "therapist_subscriptions_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "therapist_subscriptions_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "therapist_subscriptions_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "therapist_subscriptions_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "therapist_subscriptions_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      therapists: {
        Row: {
          availability_status: string | null
          bio: string | null
          certifications: string[] | null
          created_at: string | null
          experience_years: number | null
          id: string
          languages: string[] | null
          name: string
          photo_url: string | null
          specialty: string
          success_rate: number | null
          user_id: string | null
        }
        Insert: {
          availability_status?: string | null
          bio?: string | null
          certifications?: string[] | null
          created_at?: string | null
          experience_years?: number | null
          id?: string
          languages?: string[] | null
          name: string
          photo_url?: string | null
          specialty: string
          success_rate?: number | null
          user_id?: string | null
        }
        Update: {
          availability_status?: string | null
          bio?: string | null
          certifications?: string[] | null
          created_at?: string | null
          experience_years?: number | null
          id?: string
          languages?: string[] | null
          name?: string
          photo_url?: string | null
          specialty?: string
          success_rate?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      treatment_plans: {
        Row: {
          activities: Json | null
          created_at: string
          description: string | null
          diagnosis_scope: string | null
          duration_weeks: number | null
          general_objective: string | null
          id: string
          is_active: boolean
          is_archived: boolean | null
          is_global: boolean
          is_purchasable: boolean | null
          is_template: boolean | null
          marketplace_item_id: string | null
          name: string
          notes: string | null
          number_of_sessions: number | null
          plan_type: string | null
          recommended_sessions: number | null
          session_duration_minutes: number | null
          source_marketplace_item_id: string | null
          specialty_id: string | null
          specific_objectives: Json | null
          target_diagnosis: string | null
          target_population: string | null
          therapist_id: string
          updated_at: string
        }
        Insert: {
          activities?: Json | null
          created_at?: string
          description?: string | null
          diagnosis_scope?: string | null
          duration_weeks?: number | null
          general_objective?: string | null
          id?: string
          is_active?: boolean
          is_archived?: boolean | null
          is_global?: boolean
          is_purchasable?: boolean | null
          is_template?: boolean | null
          marketplace_item_id?: string | null
          name: string
          notes?: string | null
          number_of_sessions?: number | null
          plan_type?: string | null
          recommended_sessions?: number | null
          session_duration_minutes?: number | null
          source_marketplace_item_id?: string | null
          specialty_id?: string | null
          specific_objectives?: Json | null
          target_diagnosis?: string | null
          target_population?: string | null
          therapist_id: string
          updated_at?: string
        }
        Update: {
          activities?: Json | null
          created_at?: string
          description?: string | null
          diagnosis_scope?: string | null
          duration_weeks?: number | null
          general_objective?: string | null
          id?: string
          is_active?: boolean
          is_archived?: boolean | null
          is_global?: boolean
          is_purchasable?: boolean | null
          is_template?: boolean | null
          marketplace_item_id?: string | null
          name?: string
          notes?: string | null
          number_of_sessions?: number | null
          plan_type?: string | null
          recommended_sessions?: number | null
          session_duration_minutes?: number | null
          source_marketplace_item_id?: string | null
          specialty_id?: string | null
          specific_objectives?: Json | null
          target_diagnosis?: string | null
          target_population?: string | null
          therapist_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "treatment_plans_marketplace_item_id_fkey"
            columns: ["marketplace_item_id"]
            isOneToOne: false
            referencedRelation: "marketplace_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_plans_marketplace_item_id_fkey"
            columns: ["marketplace_item_id"]
            isOneToOne: false
            referencedRelation: "marketplace_items_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_plans_source_marketplace_item_id_fkey"
            columns: ["source_marketplace_item_id"]
            isOneToOne: false
            referencedRelation: "marketplace_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_plans_source_marketplace_item_id_fkey"
            columns: ["source_marketplace_item_id"]
            isOneToOne: false
            referencedRelation: "marketplace_items_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_plans_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_plans_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "treatment_plans_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_plans_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_addons: {
        Row: {
          addon_key: string
          billing_cycle: string | null
          created_at: string | null
          currency: string | null
          current_period_end: string | null
          current_period_start: string | null
          external_reference: string | null
          id: string
          mp_subscription_id: string | null
          price: number
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          addon_key: string
          billing_cycle?: string | null
          created_at?: string | null
          currency?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          external_reference?: string | null
          id?: string
          mp_subscription_id?: string | null
          price: number
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          addon_key?: string
          billing_cycle?: string | null
          created_at?: string | null
          currency?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          external_reference?: string | null
          id?: string
          mp_subscription_id?: string | null
          price?: number
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_analytics: {
        Row: {
          created_at: string | null
          device_info: Json | null
          event_data: Json | null
          event_type: string
          id: string
          location_info: Json | null
          platform: string | null
          session_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          device_info?: Json | null
          event_data?: Json | null
          event_type: string
          id?: string
          location_info?: Json | null
          platform?: string | null
          session_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          device_info?: Json | null
          event_data?: Json | null
          event_type?: string
          id?: string
          location_info?: Json | null
          platform?: string | null
          session_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_analytics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_analytics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "user_analytics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_analytics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_favorite_phrases: {
        Row: {
          created_at: string | null
          id: string
          phrase_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          phrase_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          phrase_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_favorite_phrases_phrase_id_fkey"
            columns: ["phrase_id"]
            isOneToOne: false
            referencedRelation: "motivational_phrases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_favorite_phrases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_favorite_phrases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "user_favorite_phrases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_favorite_phrases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_notification_preferences: {
        Row: {
          created_at: string | null
          email_appointments: boolean | null
          email_marketing: boolean | null
          email_messages: boolean | null
          email_reminders: boolean | null
          email_system: boolean | null
          push_appointments: boolean | null
          push_messages: boolean | null
          push_reminders: boolean | null
          reminder_hours_before: number | null
          sms_appointments: boolean | null
          sms_reminders: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email_appointments?: boolean | null
          email_marketing?: boolean | null
          email_messages?: boolean | null
          email_reminders?: boolean | null
          email_system?: boolean | null
          push_appointments?: boolean | null
          push_messages?: boolean | null
          push_reminders?: boolean | null
          reminder_hours_before?: number | null
          sms_appointments?: boolean | null
          sms_reminders?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email_appointments?: boolean | null
          email_marketing?: boolean | null
          email_messages?: boolean | null
          email_reminders?: boolean | null
          email_system?: boolean | null
          push_appointments?: boolean | null
          push_messages?: boolean | null
          push_reminders?: boolean | null
          reminder_hours_before?: number | null
          sms_appointments?: boolean | null
          sms_reminders?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "user_notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      wallet_transactions: {
        Row: {
          amount: number
          created_at: string | null
          description: string | null
          id: string
          reference_id: string | null
          reference_type: string | null
          status: string | null
          type: string
          wallet_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          description?: string | null
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          status?: string | null
          type: string
          wallet_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string | null
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          status?: string | null
          type?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          balance: number
          created_at: string | null
          currency: string | null
          id: string
          last_updated: string | null
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string | null
          currency?: string | null
          id?: string
          last_updated?: string | null
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string | null
          currency?: string | null
          id?: string
          last_updated?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "wallets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      withdrawal_requests: {
        Row: {
          admin_notes: string | null
          amount: number
          bank_account_data: Json
          estimated_completion_date: string | null
          id: string
          processed_at: string | null
          requested_at: string | null
          status: string | null
          user_id: string
          wallet_id: string
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          bank_account_data: Json
          estimated_completion_date?: string | null
          id?: string
          processed_at?: string | null
          requested_at?: string | null
          status?: string | null
          user_id: string
          wallet_id: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          bank_account_data?: Json
          estimated_completion_date?: string | null
          id?: string
          processed_at?: string | null
          requested_at?: string | null
          status?: string | null
          user_id?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "withdrawal_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "withdrawal_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "withdrawal_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "withdrawal_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "withdrawal_requests_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      word_searches: {
        Row: {
          config: Json
          created_at: string
          grid: Json
          id: string
          placed_words: string[]
          solution_grid: Json
          updated_at: string
          user_id: string | null
        }
        Insert: {
          config: Json
          created_at?: string
          grid: Json
          id?: string
          placed_words: string[]
          solution_grid: Json
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          config?: Json
          created_at?: string
          grid?: Json
          id?: string
          placed_words?: string[]
          solution_grid?: Json
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      marketplace_items_view: {
        Row: {
          avg_rating: number | null
          commission_percentage: number | null
          created_at: string | null
          currency: string | null
          description: string | null
          id: string | null
          is_active: boolean | null
          is_approved: boolean | null
          item_type: string | null
          plan_template_id: string | null
          price: number | null
          product_id: string | null
          rating: number | null
          review_count: number | null
          seller_avatar: string | null
          seller_clinic: string | null
          seller_clinic_address: string | null
          seller_clinic_logo: string | null
          seller_experience: number | null
          seller_headline: string | null
          seller_id: string | null
          seller_logo: string | null
          seller_name: string | null
          seller_primary_color: string | null
          seller_specializations: string[] | null
          seller_specialty: string | null
          therapist_plan_template_id: string | null
          title: string | null
          total_reviews: number | null
          total_sales: number | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_marketplace_plan_template"
            columns: ["plan_template_id"]
            isOneToOne: false
            referencedRelation: "treatment_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_items_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_items_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "marketplace_items_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_items_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      specialties_catalog: {
        Row: {
          description: string | null
          display_order: number | null
          icon: string | null
          id: string | null
          is_active: boolean | null
          name: string | null
          slug: string | null
        }
        Relationships: []
      }
      therapist_specialty_badges: {
        Row: {
          badge: string | null
          education_score: number | null
          experience_score: number | null
          final_score: number | null
          matching_education: string[] | null
          matching_experience: string[] | null
          specialty: string | null
          therapist_id: string | null
        }
        Relationships: []
      }
      v_patient_clinical_timeline: {
        Row: {
          appointment_id: string | null
          assigned_plan_id: string | null
          created_at: string | null
          entry_date: string | null
          entry_type: string | null
          id: string | null
          is_external: boolean | null
          is_external_view: boolean | null
          patient_id: string | null
          session_notes: string | null
          summary: string | null
          therapist_id: string | null
          therapist_name: string | null
          therapist_title: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clinical_entry_type_fk"
            columns: ["entry_type"]
            isOneToOne: false
            referencedRelation: "clinical_entry_types"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "clinical_history_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_history_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_history_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "clinical_history_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_history_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_appointment"
            columns: ["appointment_id"]
            isOneToOne: true
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      v_patient_plans_summary: {
        Row: {
          assigned_plan_id: string | null
          completed_sessions: number | null
          end_date: string | null
          general_objective: string | null
          patient_id: string | null
          plan_name: string | null
          plan_type: string | null
          progress_percentage: number | null
          start_date: string | null
          status: string | null
          target_diagnosis: string | null
          therapist_id: string | null
          total_planned_sessions: number | null
          total_sessions: number | null
          total_specific_objectives: number | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_assigned_plans_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_assigned_plans_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_assigned_plans_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "patient_assigned_plans_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_assigned_plans_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      v_patient_timeline: {
        Row: {
          assigned_plan_id: string | null
          created_at: string | null
          details: Json | null
          entry_type: string | null
          event_date: string | null
          id: string | null
          patient_id: string | null
          source_type: string | null
          status: string | null
          summary: string | null
          therapist_id: string | null
          updated_at: string | null
        }
        Relationships: []
      }
      v_public_therapists: {
        Row: {
          accent_color: string | null
          avatar_url: string | null
          background_color: string | null
          city_id: number | null
          created_at: string | null
          font_family: string | null
          font_size_base: number | null
          full_name: string | null
          graduation_year: number | null
          is_public: boolean | null
          languages: string[] | null
          logo_url: string | null
          phone: string | null
          primary_color: string | null
          professional_title: string | null
          public_email: string | null
          region_id: number | null
          registration_secreduc: string | null
          registration_supersalud: string | null
          secondary_color: string | null
          specialization_areas: string[] | null
          text_color: string | null
          therapist_id: string | null
          university: string | null
          updated_at: string | null
          years_experience: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_profiles_city"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_profiles_region"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_therapist_profile"
            columns: ["therapist_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_therapist_profile"
            columns: ["therapist_id"]
            isOneToOne: true
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "fk_therapist_profile"
            columns: ["therapist_id"]
            isOneToOne: true
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_therapist_profile"
            columns: ["therapist_id"]
            isOneToOne: true
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "therapist_details_user_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "therapist_details_user_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: true
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "therapist_details_user_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: true
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "therapist_details_user_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: true
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      v_public_therapists_with_reviews: {
        Row: {
          accent_color: string | null
          avatar_url: string | null
          avg_rating: number | null
          background_color: string | null
          city_id: number | null
          font_family: string | null
          font_size_base: number | null
          full_name: string | null
          graduation_year: number | null
          languages: string[] | null
          logo_url: string | null
          phone: string | null
          primary_color: string | null
          professional_title: string | null
          public_email: string | null
          region_id: number | null
          registration_secreduc: string | null
          registration_supersalud: string | null
          secondary_color: string | null
          specialization_areas: string[] | null
          text_color: string | null
          therapist_id: string | null
          total_reviews: number | null
          university: string | null
          years_experience: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_profiles_city"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_profiles_region"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      v_recent_activity: {
        Row: {
          activity_date: string | null
          activity_type: string | null
          details: Json | null
          id: string | null
          user_id: string | null
        }
        Relationships: []
      }
      v_reputation_badges: {
        Row: {
          appointment_points: number | null
          badge_color: string | null
          badge_emoji: string | null
          badge_label: string | null
          badge_level: string | null
          completed_plans: number | null
          condition_points: number | null
          diagnosis_points: number | null
          education_points: number | null
          evaluation_points: number | null
          experience_points: number | null
          final_score: number | null
          followup_points: number | null
          highest_education: string | null
          patient_diversity_points: number | null
          plan_completion_points: number | null
          report_points: number | null
          signed_reports: number | null
          specialty_icon: string | null
          specialty_id: string | null
          specialty_name: string | null
          specialty_slug: string | null
          therapist_id: string | null
          total_appointments: number | null
          total_evaluations: number | null
          total_formaciones: number | null
          unique_patients: number | null
        }
        Relationships: [
          {
            foreignKeyName: "therapist_specialties_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "therapist_specialties_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "therapist_specialties_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "therapist_specialties_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      v_reputation_clinical_score: {
        Row: {
          appointment_points: number | null
          completed_plans: number | null
          condition_points: number | null
          diagnosis_points: number | null
          evaluation_points: number | null
          experience_points: number | null
          followup_points: number | null
          patient_diversity_points: number | null
          plan_completion_points: number | null
          report_points: number | null
          signed_reports: number | null
          specialty_id: string | null
          specialty_name: string | null
          specialty_slug: string | null
          therapist_id: string | null
          total_appointments: number | null
          total_evaluations: number | null
          unique_patients: number | null
        }
        Relationships: []
      }
      v_reputation_education_score: {
        Row: {
          education_points: number | null
          highest_level: string | null
          precalculated_total: number | null
          specialty_id: string | null
          specialty_name: string | null
          specialty_slug: string | null
          therapist_id: string | null
          total_formaciones: number | null
        }
        Relationships: [
          {
            foreignKeyName: "therapist_specialties_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "specialties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "therapist_specialties_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "specialties_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "therapist_specialties_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "v_reputation_badges"
            referencedColumns: ["specialty_id"]
          },
          {
            foreignKeyName: "therapist_specialties_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "v_reputation_specialty_scores"
            referencedColumns: ["specialty_id"]
          },
          {
            foreignKeyName: "therapist_specialties_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_specialty_progress"
            referencedColumns: ["specialty_id"]
          },
          {
            foreignKeyName: "therapist_specialties_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "therapist_specialties_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "therapist_specialties_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "therapist_specialties_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      v_reputation_specialty_scores: {
        Row: {
          appointment_points: number | null
          completed_plans: number | null
          condition_points: number | null
          diagnosis_points: number | null
          education_points: number | null
          evaluation_points: number | null
          experience_points: number | null
          final_score: number | null
          followup_points: number | null
          highest_education: string | null
          patient_diversity_points: number | null
          plan_completion_points: number | null
          report_points: number | null
          signed_reports: number | null
          specialty_icon: string | null
          specialty_id: string | null
          specialty_name: string | null
          specialty_slug: string | null
          therapist_id: string | null
          total_appointments: number | null
          total_evaluations: number | null
          total_formaciones: number | null
          unique_patients: number | null
        }
        Relationships: [
          {
            foreignKeyName: "therapist_specialties_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "therapist_specialties_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "therapist_specialties_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "therapist_specialties_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      v_reputation_therapist_global: {
        Row: {
          best_specialty_score: number | null
          global_badge: string | null
          global_badge_color: string | null
          global_badge_emoji: string | null
          global_badge_level: string | null
          global_score: number | null
          therapist_id: string | null
          total_appointments: number | null
          total_completed_plans: number | null
          total_signed_reports: number | null
          total_specialties: number | null
          total_unique_patients: number | null
        }
        Relationships: [
          {
            foreignKeyName: "therapist_specialties_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "therapist_specialties_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "therapist_specialties_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "therapist_specialties_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      v_therapist_course_suggestions: {
        Row: {
          course_country: string | null
          course_description: string | null
          course_featured: boolean | null
          course_hours: number | null
          course_id: string | null
          course_level: string | null
          course_modality: string | null
          course_points: number | null
          course_price: number | null
          course_provider: string | null
          course_title: string | null
          course_url: string | null
          motivation_message: string | null
          real_points_gain: number | null
          recommendation_priority: number | null
          specialty_icon: string | null
          specialty_name: string | null
          therapist_id: string | null
          would_level_up: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "therapist_specialties_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "therapist_specialties_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "therapist_specialties_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "therapist_specialties_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      v_therapist_full_profile: {
        Row: {
          about_me: string | null
          accent_color: string | null
          avatar_url: string | null
          background_color: string | null
          city_id: number | null
          email: string | null
          font_family: string | null
          font_size_base: number | null
          full_name: string | null
          graduation_year: number | null
          headline_statement: string | null
          id: string | null
          is_public: boolean | null
          languages: string[] | null
          logo_url: string | null
          main_address: string | null
          phone: string | null
          primary_color: string | null
          professional_title: string | null
          public_email: string | null
          region_id: number | null
          rut: string | null
          secondary_color: string | null
          slug: string | null
          social_facebook_url: string | null
          social_instagram_url: string | null
          social_linkedin_url: string | null
          social_twitter_url: string | null
          specialization_areas: string[] | null
          text_color: string | null
          university: string | null
          years_experience: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_profiles_city"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_profiles_region"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      v_therapist_metrics: {
        Row: {
          avg_session_duration: number | null
          marketplace_items: number | null
          therapist_id: string | null
          therapist_name: string | null
          total_appointments: number | null
          total_commissions: number | null
          total_patients: number | null
          total_sessions: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_therapist_profile"
            columns: ["therapist_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_therapist_profile"
            columns: ["therapist_id"]
            isOneToOne: true
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "fk_therapist_profile"
            columns: ["therapist_id"]
            isOneToOne: true
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_therapist_profile"
            columns: ["therapist_id"]
            isOneToOne: true
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "therapist_details_user_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "therapist_details_user_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: true
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "therapist_details_user_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: true
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "therapist_details_user_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: true
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      v_therapist_specialty_progress: {
        Row: {
          badge_color: string | null
          badge_emoji: string | null
          badge_label: string | null
          badge_level: string | null
          education_points: number | null
          experience_points: number | null
          final_score: number | null
          next_badge_emoji: string | null
          next_badge_label: string | null
          next_badge_level: string | null
          points_to_next_badge: number | null
          progress_to_next_percent: number | null
          specialty_icon: string | null
          specialty_id: string | null
          specialty_name: string | null
          specialty_slug: string | null
          therapist_id: string | null
          unique_patients: number | null
          weakest_axis: string | null
        }
        Relationships: [
          {
            foreignKeyName: "therapist_specialties_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "therapist_specialties_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_public_therapists_with_reviews"
            referencedColumns: ["therapist_id"]
          },
          {
            foreignKeyName: "therapist_specialties_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_therapist_full_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "therapist_specialties_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "v_user_dashboard"
            referencedColumns: ["user_id"]
          },
        ]
      }
      v_user_dashboard: {
        Row: {
          dashboard_path: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          user_id: string | null
        }
        Insert: {
          dashboard_path?: never
          role?: Database["public"]["Enums"]["user_role"] | null
          user_id?: string | null
        }
        Update: {
          dashboard_path?: never
          role?: Database["public"]["Enums"]["user_role"] | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      accept_invitation: {
        Args: {
          p_invite_code: string
          p_invitee_email: string
          p_invitee_id?: string
        }
        Returns: undefined
      }
      add_specialty_to_therapist: {
        Args: {
          p_added_by?: string
          p_specialty_id: number
          p_therapist_id: string
        }
        Returns: Json
      }
      add_to_favorites: {
        Args: {
          p_item_id: string
          p_list_name?: string
          p_notify_on_sale?: boolean
          p_user_id: string
        }
        Returns: string
      }
      assign_specialties_to_therapist: {
        Args: { p_specialty_ids: number[]; p_therapist_id: string }
        Returns: boolean
      }
      associate_patient_to_therapist: {
        Args: { p_profile_id: string; p_therapist_id: string }
        Returns: string
      }
      block_therapist_time_slot: {
        Args: {
          p_block_date: string
          p_clinic_id?: string
          p_end_time: string
          p_reason?: string
          p_start_time: string
          p_therapist_id: string
        }
        Returns: Json
      }
      book_appointment: {
        Args: {
          p_end_time: string
          p_mode: string
          p_patient_id: string
          p_start_time: string
          p_therapist_id: string
        }
        Returns: string
      }
      calculate_ados2_scores: {
        Args: { p_evaluation_id: string }
        Returns: Json
      }
      calculate_daily_metrics: { Args: never; Returns: undefined }
      calculate_specialty_scores: {
        Args: { p_therapist_id: string }
        Returns: {
          out_badge: string
          out_education_score: number
          out_experience_score: number
          out_final_score: number
          out_matching_education: string[]
          out_matching_experience: string[]
          out_specialty: string
          out_specialty_id: string
          out_therapist_id: string
        }[]
      }
      calculate_therapist_rating: {
        Args: { p_therapist_id: string }
        Returns: {
          average_rating: number
          rating_distribution: Json
          total_reviews: number
        }[]
      }
      can_book_appointment: {
        Args: {
          p_end_time: string
          p_start_time: string
          p_therapist_id: string
        }
        Returns: boolean
      }
      can_user_create_clinic: { Args: never; Returns: boolean }
      can_user_review: {
        Args: { p_item_id: string; p_user_id: string }
        Returns: Json
      }
      cancel_appointment: {
        Args: {
          p_appointment_id: string
          p_cancellation_reason?: string
          p_user_id: string
        }
        Returns: Json
      }
      change_user_role: {
        Args: {
          new_role: Database["public"]["Enums"]["role_enum"]
          user_id: string
        }
        Returns: undefined
      }
      check_appointment_availability: {
        Args: {
          p_clinic_id: string
          p_date: string
          p_duration?: number
          p_therapist_id: string
          p_time: string
        }
        Returns: Json
      }
      check_appointment_conflict: {
        Args: {
          p_date: string
          p_end_time: string
          p_exclude_appointment_id?: string
          p_patient_id: string
          p_start_time: string
          p_therapist_id: string
        }
        Returns: {
          conflict_details: Json
          conflict_type: string
          has_conflict: boolean
        }[]
      }
      check_blocked_time_overlap: {
        Args: {
          p_clinic_id: string
          p_end: string
          p_start: string
          p_therapist_id: string
        }
        Returns: boolean
      }
      check_email_exists: { Args: { p_email: string }; Returns: boolean }
      check_expired_subscriptions: { Args: never; Returns: undefined }
      check_policies_health: {
        Args: never
        Returns: {
          has_recursion_risk: boolean
          policy_count: number
          table_name: string
        }[]
      }
      cleanup_failed_registration: {
        Args: { user_id: string }
        Returns: undefined
      }
      clone_purchased_plan: {
        Args: { p_buyer_id: string; p_marketplace_item_id: string }
        Returns: string
      }
      confirm_public_appointment: {
        Args: { p_appointment_id: string }
        Returns: undefined
      }
      count_unread_notifications: {
        Args: { p_user_id: string }
        Returns: number
      }
      create_appointment: {
        Args: {
          p_clinic_id: string
          p_date: string
          p_duration?: number
          p_modalidad: string
          p_notes?: string
          p_patient_id: string
          p_therapist_id: string
          p_time: string
        }
        Returns: Json
      }
      create_appointment_reminder: {
        Args: { p_appointment_id: string; p_hours_before?: number }
        Returns: string
      }
      create_appointment_v3: {
        Args: {
          p_clinic_id: string
          p_date: string
          p_end_time: string
          p_notes?: string
          p_patient_email: string
          p_send_email_reminder?: boolean
          p_service_id: string
          p_start_time: string
          p_therapist_id: string
        }
        Returns: Json
      }
      create_clinic: {
        Args: {
          p_address: string
          p_city_id: number
          p_description?: string
          p_email?: string
          p_modalidad: Database["public"]["Enums"]["clinic_attendance_modality"]
          p_name: string
          p_phone?: string
          p_therapist_id: string
        }
        Returns: Json
      }
      create_clinic_and_associate_therapist: {
        Args: { clinic_data: Json }
        Returns: string
      }
      create_clinic_with_therapist: {
        Args: {
          p_clinic_data: Json
          p_clinic_name: string
          p_therapist_id?: string
        }
        Returns: Json
      }
      create_patient_and_appointment: {
        Args: {
          p_clinic_id: string
          p_date: string
          p_end_time: string
          p_notes?: string
          p_patient_email: string
          p_patient_full_name: string
          p_patient_phone: string
          p_patient_rut: string
          p_service_id: string
          p_start_time: string
          p_therapist_id: string
        }
        Returns: Json
      }
      create_patient_and_appointment_v2: {
        Args: {
          p_clinic_id?: string
          p_date?: string
          p_end_time?: string
          p_notes?: string
          p_patient_email?: string
          p_patient_rut?: string
          p_service_id?: string
          p_start_time?: string
          p_therapist_id?: string
        }
        Returns: Json
      }
      create_recurring_appointments: {
        Args: { p_base_appointment: Json; p_weeks: number }
        Returns: {
          block_type: string | null
          clinic_id: string | null
          color: string | null
          confirmation_status: string | null
          created_at: string | null
          date: string
          duration_minutes: number
          end_time: string
          id: string
          modality_patient: string | null
          notes: string | null
          patient_id: string
          recurring_group_id: string | null
          send_email_reminder: boolean | null
          service_id: string | null
          specialty_id: string | null
          start_time: string
          status: string
          therapist_id: string
          updated_at: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "appointments"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      create_review: {
        Args: { p_appointment_id: string; p_comment?: string; p_rating: number }
        Returns: string
      }
      day_number_to_spanish: {
        Args: { day_num: number }
        Returns: Database["public"]["Enums"]["day_of_week"]
      }
      debug_search_params: {
        Args: { p_modalidad?: string }
        Returns: {
          equals_online: boolean
          equals_presencial: boolean
          equals_todas: boolean
          param_is_null: boolean
          param_length: number
          param_value: string
        }[]
      }
      debug_set_availability: {
        Args: {
          p_availabilities: Json
          p_clinic_id: string
          p_therapist_id: string
        }
        Returns: Json
      }
      delete_all_users: { Args: never; Returns: undefined }
      delete_clinic: {
        Args: {
          p_clinic_id: string
          p_force_delete?: boolean
          p_therapist_id: string
          p_transfer_appointments_to?: string
        }
        Returns: Json
      }
      delete_recurring_appointments: {
        Args: { p_only_future?: boolean; p_recurring_group_id: string }
        Returns: number
      }
      encrypt_rut: { Args: { plain_rut: string }; Returns: string }
      ensure_unique_profile_slug: {
        Args: { desired_slug: string; profile_id_to_exclude?: string }
        Returns: string
      }
      find_and_associate_patient: {
        Args: { p_patient_email: string; p_therapist_id: string }
        Returns: Json
      }
      fn_infer_specialty: {
        Args: { p_diagnosis_code?: string; p_diagnosis_name?: string }
        Returns: string
      }
      generate_slug: { Args: { input_text: string }; Returns: string }
      generate_unique_slug: {
        Args: { base_text: string; column_name: string; table_name: string }
        Returns: string
      }
      get_all_specialties: {
        Args: {
          p_include_stats?: boolean
          p_only_available?: boolean
          p_therapist_id?: string
        }
        Returns: Json
      }
      get_available_slots: {
        Args: { p_clinic_id: string; p_date: string; p_therapist_id: string }
        Returns: {
          end_time: string
          is_available: boolean
          start_time: string
        }[]
      }
      get_available_slots_for_patient: {
        Args: {
          p_consultation_type: string
          p_date: string
          p_therapist_id: string
        }
        Returns: {
          is_available: boolean
          time_slot: string
        }[]
      }
      get_available_time_slots: {
        Args: {
          p_clinic_id: string
          p_from: string
          p_slot_minutes: number
          p_therapist_id: string
          p_to: string
        }
        Returns: {
          slot_end: string
          slot_start: string
        }[]
      }
      get_batch_next_available_slots: {
        Args: {
          p_max_days_per_therapist?: number
          p_max_days_to_show?: number
          p_max_slots_per_day?: number
          p_start_date?: string
          p_therapist_ids: string[]
        }
        Returns: {
          availability_date: string
          therapist_id: string
          time_slots: Json
        }[]
      }
      get_clinical_calendar_events: {
        Args: {
          p_end_date: string
          p_start_date: string
          p_therapist_id: string
        }
        Returns: {
          appointment_id: string
          entry_date: string
          entry_type: string
          event_color: string
          event_title: string
          id: string
          is_external: boolean
          patient_id: string
          patient_name: string
          summary: string
          therapist_id: string
        }[]
      }
      get_complete_therapist_profile: {
        Args: { user_uuid: string }
        Returns: Json
      }
      get_item_review_summary: { Args: { p_item_id: string }; Returns: Json }
      get_marketplace_item_stats: { Args: { p_item_id: string }; Returns: Json }
      get_paginated_patients: {
        Args: {
          p_page?: number
          p_page_size?: number
          p_search_term?: string
          p_sort_by?: string
          p_status?: string
          p_therapist_id: string
        }
        Returns: {
          email: string
          full_name: string
          last_visit: string
          next_visit: string
          patient_id: string
          patient_status: string
          phone: string
          total_results: number
        }[]
      }
      get_patient_appointments:
        | {
            Args: {
              p_date_from?: string
              p_date_to?: string
              p_include_past?: boolean
              p_limit?: number
              p_offset?: number
              p_patient_id: string
              p_status?: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_date_from?: string
              p_date_to?: string
              p_include_past?: boolean
              p_limit?: number
              p_offset?: number
              p_patient_id: string
              p_status?: string
            }
            Returns: Json
          }
      get_patient_clinical_timeline: {
        Args: {
          p_include_external?: boolean
          p_limit?: number
          p_offset?: number
          p_patient_id: string
        }
        Returns: {
          appointment_id: string
          assigned_plan_id: string
          created_at: string
          entry_date: string
          entry_type: string
          id: string
          is_external: boolean
          patient_id: string
          session_notes: string
          summary: string
          therapist_avatar: string
          therapist_id: string
          therapist_name: string
          therapist_title: string
        }[]
      }
      get_patient_external_sessions_count: {
        Args: { p_patient_id: string }
        Returns: {
          external_therapists: Json
          total_external: number
        }[]
      }
      get_public_appointment_details: {
        Args: { p_appointment_id: string }
        Returns: Json
      }
      get_random_motivational_phrase: {
        Args: never
        Returns: {
          author: string | null
          category: string | null
          content: string
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          language: string | null
          updated_at: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "motivational_phrases"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_random_phrase: {
        Args: never
        Returns: {
          author: string
          content: string
        }[]
      }
      get_specialty_change_history: {
        Args: { p_days_back?: number; p_limit?: number; p_therapist_id: string }
        Returns: Json
      }
      get_specialty_ranking: {
        Args: { p_limit?: number; p_specialty_slug: string }
        Returns: Json
      }
      get_therapist_appointments: {
        Args: {
          p_clinic_id?: string
          p_date_from?: string
          p_date_to?: string
          p_limit?: number
          p_offset?: number
          p_status?: string
          p_therapist_id: string
        }
        Returns: Json
      }
      get_therapist_availability: {
        Args: {
          p_clinic_id: string
          p_days: number
          p_start_date: string
          p_therapist_identifier: string
        }
        Returns: {
          availability_date: string
          time_slots: Json
        }[]
      }
      get_therapist_clinics:
        | {
            Args: {
              p_city_id?: string
              p_include_availability?: boolean
              p_include_stats?: boolean
              p_therapist_id: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_city_id?: number
              p_include_availability?: boolean
              p_include_stats?: boolean
              p_therapist_id: string
            }
            Returns: Json
          }
      get_therapist_full_profile: {
        Args: { p_therapist_id: string }
        Returns: Json
      }
      get_therapist_growth_plan: {
        Args: { p_therapist_id: string }
        Returns: Json
      }
      get_therapist_next_available_slots: {
        Args: {
          p_clinic_id?: string
          p_days_ahead?: number
          p_from?: string
          p_limit?: number
          p_slot_minutes?: number
          p_therapist_id: string
        }
        Returns: {
          day_name: string
          slot_date: string
          slot_end: string
          slot_start: string
          slot_time: string
        }[]
      }
      get_therapist_patients_for_agenda: {
        Args: { p_search_term?: string; p_therapist_id: string }
        Returns: {
          email: string
          full_name: string
          id: string
          profile_id: string
        }[]
      }
      get_therapist_patients_with_details: {
        Args: {
          p_page?: number
          p_page_size?: number
          p_search_term?: string
          p_sort_by?: string
          p_status?: string
          p_therapist_id: string
        }
        Returns: {
          last_visit_date: string
          next_visit_date: string
          patient_email: string
          patient_id: string
          patient_name: string
          patient_phone: string
          status: string
          total_count: number
        }[]
      }
      get_therapist_reputation: {
        Args: { p_therapist_id: string }
        Returns: Json
      }
      get_therapist_reputation_overview: {
        Args: {
          p_badge_level?: string
          p_limit?: number
          p_min_score?: number
          p_offset?: number
        }
        Returns: {
          badge_emoji: string
          badges: Json
          calculated_at: string
          email: string
          global_score: number
          id: string
          level_name: string
          name: string
          total_appointments: number
          total_patients: number
          total_specialties: number
        }[]
      }
      get_therapist_reviews: {
        Args: { p_limit?: number; p_offset?: number; p_therapist_id: string }
        Returns: {
          appointment_date: string
          comment: string
          patient_name: string
          rating: number
          review_date: string
          review_id: string
        }[]
      }
      get_therapist_schedule_for_search: {
        Args: { p_therapist_id: string }
        Returns: Json
      }
      get_therapist_specialties: {
        Args: { p_therapist_id: string }
        Returns: {
          description: string
          id: number
          name: string
        }[]
      }
      get_user_email_by_id: { Args: { user_id_param: string }; Returns: string }
      get_user_notifications: {
        Args: {
          p_limit?: number
          p_status?: Database["public"]["Enums"]["notification_status"]
          p_user_id: string
        }
        Returns: {
          created_at: string
          data: Json
          id: string
          message: string
          read_at: string
          sent_at: string
          status: Database["public"]["Enums"]["notification_status"]
          title: string
          type: Database["public"]["Enums"]["notification_type"]
        }[]
      }
      get_user_role: { Args: { p_user_id: string }; Returns: string }
      get_weekly_availability: {
        Args: {
          p_clinic_id?: string
          p_include_stats?: boolean
          p_therapist_id: string
        }
        Returns: Json
      }
      has_role: { Args: { roles: string[] }; Returns: boolean }
      increment_activity_usage: {
        Args: { activity_id: string }
        Returns: undefined
      }
      increment_coupon_usage: {
        Args: { p_coupon_id: string }
        Returns: undefined
      }
      increment_view_count: { Args: { p_item_id: string }; Returns: undefined }
      initialize_therapist_profile: {
        Args: { user_uuid: string }
        Returns: undefined
      }
      is_admin: { Args: never; Returns: boolean }
      is_city_in_region: {
        Args: { p_city_id: number; p_region_id: number }
        Returns: boolean
      }
      is_clinic_owner: { Args: { p_clinic_id: string }; Returns: boolean }
      is_user_admin: { Args: { uid: string }; Returns: boolean }
      is_user_therapist: { Args: { user_id_param: string }; Returns: boolean }
      link_patient_by_email: {
        Args: { p_patient_email: string; p_therapist_id: string }
        Returns: Json
      }
      link_patient_to_therapist: {
        Args: { p_profile_id: string; p_therapist_id: string }
        Returns: string
      }
      list_patients_paginated: {
        Args: {
          p_page?: number
          p_page_size?: number
          p_search_term?: string
          p_sort_by?: string
          p_status?: string
          p_therapist_id: string
        }
        Returns: {
          email: string
          full_name: string
          id: string
          last_visit: string
          next_visit: string
          patient_status: string
          phone: string
          total_results: number
        }[]
      }
      log_search_params: {
        Args: {
          p_city_id: number
          p_modalidad: string
          p_modalidad_clean: string
          p_region_id: number
          p_result_count: number
          p_search_term: string
          p_specialty_id: number
        }
        Returns: undefined
      }
      make_first_admin: { Args: { admin_email: string }; Returns: undefined }
      mark_all_notifications_as_read: {
        Args: { p_user_id: string }
        Returns: number
      }
      mark_notification_as_read: {
        Args: { p_notification_id: string; p_user_id: string }
        Returns: boolean
      }
      match_faq: {
        Args: { query_text: string; threshold?: number }
        Returns: {
          answer: string
          id: string
          question: string
          similarity: number
        }[]
      }
      normalize_role: {
        Args: { in_role: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      notify_appointment_cancelled: {
        Args: {
          p_appointment_id: string
          p_cancellation_reason?: string
          p_cancelled_by: string
        }
        Returns: string
      }
      notify_new_review: { Args: { p_review_id: string }; Returns: string }
      process_completed_order: {
        Args: { order_id: string }
        Returns: undefined
      }
      remove_specialty_from_therapist: {
        Args: {
          p_reason?: string
          p_removed_by?: string
          p_specialty_id: number
          p_therapist_id: string
        }
        Returns: Json
      }
      request_withdrawal: {
        Args: { p_amount: number; p_bank_data: Json; p_user_id: string }
        Returns: Json
      }
      reschedule_appointment: {
        Args: {
          p_appointment_id: string
          p_new_clinic_id?: string
          p_new_date: string
          p_new_modalidad?: string
          p_new_time: string
          p_reason?: string
          p_user_id: string
        }
        Returns: Json
      }
      reschedule_recurring_appointments: {
        Args: {
          p_new_day_of_week?: number
          p_new_time?: string
          p_recurring_group_id: string
        }
        Returns: number
      }
      save_therapist_basic_schedule: {
        Args: {
          p_consultation_type?: string
          p_day_number: number
          p_end_time: string
          p_start_time: string
          p_therapist_id: string
        }
        Returns: Json
      }
      save_therapist_services: {
        Args: { p_services: Json; p_therapist_id: string }
        Returns: Json
      }
      schedule_appointment: {
        Args: {
          p_clinic_id: string
          p_end: string
          p_notes?: string
          p_patient_email: string
          p_patient_full_name: string
          p_patient_phone: string
          p_service_id: string
          p_start: string
          p_therapist_id: string
        }
        Returns: {
          appointment_id: string
          clinic_id: string
          end_time: string
          patient_id: string
          patient_name: string
          service_id: string
          start_time: string
        }[]
      }
      schedule_appointment_and_patient: {
        Args: {
          p_clinic_id: string
          p_date: string
          p_end_time: string
          p_notes: string
          p_patient_email: string
          p_patient_full_name: string
          p_patient_phone: string
          p_patient_rut: string
          p_send_email_reminder: boolean
          p_service_id: string
          p_start_time: string
          p_therapist_id: string
        }
        Returns: string
      }
      search_courses: {
        Args: {
          p_education_level?: string
          p_limit?: number
          p_modality?: string
          p_offset?: number
          p_specialty_slug?: string
        }
        Returns: Json
      }
      search_patients_basic: {
        Args: { p_search_term?: string; p_therapist_id: string }
        Returns: {
          email: string
          full_name: string
          patient_id: string
          profile_id: string
        }[]
      }
      search_patients_quick: {
        Args: { p_search_term?: string; p_therapist_id: string }
        Returns: {
          email: string
          full_name: string
          id: string
          profile_id: string
        }[]
      }
      search_similar_clinics: {
        Args: { p_city_id?: number; p_name?: string; p_rut_empresa?: string }
        Returns: Json
      }
      search_therapists_by_specialty: {
        Args: {
          p_city_id?: number
          p_include_availability?: boolean
          p_limit?: number
          p_modalidad?: string
          p_offset?: number
          p_specialty_id: number
        }
        Returns: Json
      }
      search_therapists_nearby_v2: {
        Args: {
          p_latitude: number
          p_limit?: number
          p_longitude: number
          p_radius_km?: number
        }
        Returns: {
          avatar_url: string
          city_name: string
          clinics: Json
          distance_km: number
          full_name: string
          has_clinics: boolean
          rating: number
          specialties: string[]
          therapist_id: string
        }[]
      }
      search_therapists_public: {
        Args: {
          p_city_id?: number
          p_modality?: string
          p_region_id?: number
          p_search_term?: string
          p_specialty_id?: string
        }
        Returns: {
          about_me: string
          avatar_url: string
          avg_rating: number
          city_id: number
          city_name: string
          clinics: Json
          fonolevel_badge: string
          fonolevel_color: string
          fonolevel_emoji: string
          fonolevel_score: number
          full_name: string
          graduation_year: number
          headline_statement: string
          id: string
          insurances: Json
          languages: string[]
          min_price: number
          offers_online: boolean
          offers_presential: boolean
          phone: string
          professional_title: string
          public_email: string
          public_slug: string
          region_id: number
          region_name: string
          registration_secreduc: string
          registration_supersalud: string
          specialization_areas: string[]
          specialties: string[]
          therapist_id: string
          total_reviews: number
          university: string
          years_experience: number
        }[]
      }
      search_therapists_with_details: {
        Args: {
          p_city_id?: number
          p_days?: number
          p_limit?: number
          p_modalidad?: string
          p_offset?: number
          p_order?: string
          p_region_id?: number
          p_search_term?: string
          p_slot_duration?: number
          p_specialty_id?: string
        }
        Returns: {
          availability_days_count: number
          availability_hours: number
          availability_slots: number
          available_days: Json
          avatar_url: string
          avg_rating: number
          city_name: string
          clinics: Json
          fonolevel_badge: string
          fonolevel_color: string
          fonolevel_emoji: string
          fonolevel_score: number
          full_name: string
          has_availability: boolean
          headline_statement: string
          insurances: Json
          modalidades: string[]
          region_name: string
          review_count: number
          slug: string
          specialties: string[]
          therapist_id: string
        }[]
      }
      search_therapists_with_reputation: {
        Args: {
          p_badge_level?: string
          p_limit?: number
          p_min_score?: number
          p_offset?: number
          p_specialty_slug?: string
        }
        Returns: Json
      }
      set_therapist_specialties: {
        Args: { p_specialty_ids: string[]; p_therapist_id: string }
        Returns: undefined
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      slugify: { Args: { value: string }; Returns: string }
      suggest_missing_specialties: {
        Args: { p_therapist_id: string }
        Returns: {
          out_matching_education: string[]
          out_reason: string
          out_specialty: string
          out_specialty_id: string
          out_suggested_score: number
        }[]
      }
      sync_therapist_location: {
        Args: { p_therapist: string }
        Returns: undefined
      }
      test_notification_system: {
        Args: never
        Returns: {
          details: string
          result: boolean
          test_name: string
        }[]
      }
      unaccent: { Args: { "": string }; Returns: string }
      update_clinic: {
        Args: { p_clinic_id: string; p_therapist_id: string; p_updates: Json }
        Returns: Json
      }
      update_review: {
        Args: { p_comment: string; p_review_id: string }
        Returns: boolean
      }
      update_therapist_specialties: {
        Args: {
          p_specialty_ids: number[]
          p_therapist_id: string
          p_update_mode?: string
          p_updated_by?: string
        }
        Returns: Json
      }
      update_therapist_specialties_safe: {
        Args: { p_specialty_ids: string[]; p_therapist_id: string }
        Returns: undefined
      }
      upsert_clinical_history_from_appointment: {
        Args: {
          p_appointment_id: string
          p_details: Json
          p_entry_date: string
          p_entry_type: string
          p_patient_id: string
          p_status: string
          p_summary: string
          p_therapist_id: string
        }
        Returns: undefined
      }
      upsert_patient_and_create_appointment: {
        Args: {
          p_clinic_id: string
          p_date: string
          p_end_time: string
          p_notes: string
          p_patient_email: string
          p_patient_full_name: string
          p_patient_phone: string
          p_patient_rut: string
          p_send_email_reminder: boolean
          p_service_id: string
          p_start_time: string
          p_therapist_id: string
        }
        Returns: string
      }
      upsert_therapist_profile_and_details: {
        Args: {
          p_bio: string
          p_birthdate: string
          p_city_id: number
          p_display_name: string
          p_full_name: string
          p_gender: string
          p_headline_statement: string
          p_is_public: boolean
          p_professional_title: string
          p_region_id: number
          p_street: string
          p_user_id: string
        }
        Returns: undefined
      }
      upsert_user_profile: {
        Args: {
          p_bio?: string
          p_birthdate?: string
          p_city_id?: number
          p_display_name?: string
          p_email?: string
          p_full_name?: string
          p_gender?: string
          p_headline_statement?: string
          p_is_public?: boolean
          p_professional_title?: string
          p_region_id?: number
          p_street?: string
          p_user_id: string
        }
        Returns: Json
      }
      user_has_purchased: {
        Args: { p_marketplace_item_id: string; p_user_id: string }
        Returns: boolean
      }
      wallet_purchase: {
        Args: {
          p_amount: number
          p_buyer_id: string
          p_commission_rate?: number
          p_item_id: string
          p_item_title: string
          p_seller_id?: string
        }
        Returns: Json
      }
    }
    Enums: {
      appointment_status:
        | "pendiente"
        | "confirmada"
        | "en_progreso"
        | "completada"
        | "cancelada"
        | "no_asistio"
      clinic_attendance_modality: "presencial" | "online" | "ambas"
      clinic_attention_modality: "presencial" | "online"
      consultation_type: "Presencial" | "Online" | "presencial" | "online"
      consultation_type_enum:
        | "evaluacion_inicial"
        | "tratamiento"
        | "control"
        | "seguimiento"
        | "alta"
      day_of_week:
        | "Lunes"
        | "Martes"
        | "Miércoles"
        | "Jueves"
        | "Viernes"
        | "Sábado"
        | "Domingo"
      difficulty_enum:
        | "muy_facil"
        | "facil"
        | "adecuado"
        | "dificil"
        | "muy_dificil"
      discount_type_enum: "porcentaje" | "monto_fijo"
      goal_type_enum: "general" | "especifico"
      invoice_status_enum:
        | "borrador"
        | "emitida"
        | "pagada"
        | "vencida"
        | "cancelada"
      marketplace_item_type:
        | "plan"
        | "activity"
        | "material"
        | "bundle"
        | "evaluation"
        | "resource"
      modalidad_enum: "presencial" | "online" | "mixta"
      modality_enum: "presencial" | "online" | "ambas" | "Mixto"
      notification_status: "pending" | "sent" | "failed" | "read"
      notification_type:
        | "appointment_reminder"
        | "appointment_cancelled"
        | "appointment_confirmed"
        | "new_review"
        | "review_response"
      payment_status: "paid" | "pending"
      product_type_enum:
        | "insumo"
        | "plantilla_informe"
        | "plantilla_planificacion"
        | "curso_online"
        | "fisico"
        | "digital"
      report_delivery_status:
        | "not_delivered"
        | "delivered_to_patient"
        | "delivered_to_family"
        | "delivered_to_institution"
      report_status:
        | "draft"
        | "in_review"
        | "validated"
        | "signed"
        | "locked"
        | "archived"
      role_enum: "paciente" | "terapeuta" | "clinica" | "admin"
      sender_type_enum: "user" | "ai"
      session_type_enum: "evaluacion" | "tratamiento" | "control"
      user_role: "patient" | "therapist" | "admin" | "superadmin" | "clinic"
      user_role_enum: "patient" | "therapist" | "admin" | "superadmin"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      appointment_status: [
        "pendiente",
        "confirmada",
        "en_progreso",
        "completada",
        "cancelada",
        "no_asistio",
      ],
      clinic_attendance_modality: ["presencial", "online", "ambas"],
      clinic_attention_modality: ["presencial", "online"],
      consultation_type: ["Presencial", "Online", "presencial", "online"],
      consultation_type_enum: [
        "evaluacion_inicial",
        "tratamiento",
        "control",
        "seguimiento",
        "alta",
      ],
      day_of_week: [
        "Lunes",
        "Martes",
        "Miércoles",
        "Jueves",
        "Viernes",
        "Sábado",
        "Domingo",
      ],
      difficulty_enum: [
        "muy_facil",
        "facil",
        "adecuado",
        "dificil",
        "muy_dificil",
      ],
      discount_type_enum: ["porcentaje", "monto_fijo"],
      goal_type_enum: ["general", "especifico"],
      invoice_status_enum: [
        "borrador",
        "emitida",
        "pagada",
        "vencida",
        "cancelada",
      ],
      marketplace_item_type: [
        "plan",
        "activity",
        "material",
        "bundle",
        "evaluation",
        "resource",
      ],
      modalidad_enum: ["presencial", "online", "mixta"],
      modality_enum: ["presencial", "online", "ambas", "Mixto"],
      notification_status: ["pending", "sent", "failed", "read"],
      notification_type: [
        "appointment_reminder",
        "appointment_cancelled",
        "appointment_confirmed",
        "new_review",
        "review_response",
      ],
      payment_status: ["paid", "pending"],
      product_type_enum: [
        "insumo",
        "plantilla_informe",
        "plantilla_planificacion",
        "curso_online",
        "fisico",
        "digital",
      ],
      report_delivery_status: [
        "not_delivered",
        "delivered_to_patient",
        "delivered_to_family",
        "delivered_to_institution",
      ],
      report_status: [
        "draft",
        "in_review",
        "validated",
        "signed",
        "locked",
        "archived",
      ],
      role_enum: ["paciente", "terapeuta", "clinica", "admin"],
      sender_type_enum: ["user", "ai"],
      session_type_enum: ["evaluacion", "tratamiento", "control"],
      user_role: ["patient", "therapist", "admin", "superadmin", "clinic"],
      user_role_enum: ["patient", "therapist", "admin", "superadmin"],
    },
  },
} as const
A new version of Supabase CLI is available: v2.84.2 (currently installed v2.75.0)
We recommend updating regularly for new features and bug fixes: https://supabase.com/docs/guides/cli/getting-started#updating-the-supabase-cli
