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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      checkins: {
        Row: {
          checked_in_at: string
          gym_id: string
          id: string
          is_active: boolean
          is_open_to_join: boolean
          training_type: Database["public"]["Enums"]["training_type"]
          user_id: string
        }
        Insert: {
          checked_in_at?: string
          gym_id: string
          id?: string
          is_active?: boolean
          is_open_to_join?: boolean
          training_type: Database["public"]["Enums"]["training_type"]
          user_id: string
        }
        Update: {
          checked_in_at?: string
          gym_id?: string
          id?: string
          is_active?: boolean
          is_open_to_join?: boolean
          training_type?: Database["public"]["Enums"]["training_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkins_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          event_date: string
          gym_id: string
          id: string
          max_attendees: number | null
          title: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          event_date: string
          gym_id: string
          id?: string
          max_attendees?: number | null
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          event_date?: string
          gym_id?: string
          id?: string
          max_attendees?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
      gym_challenge_entries: {
        Row: {
          challenge_id: string
          id: string
          result: number
          submitted_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          challenge_id: string
          id?: string
          result: number
          submitted_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          challenge_id?: string
          id?: string
          result?: number
          submitted_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gym_challenge_entries_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "gym_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      gym_challenges: {
        Row: {
          challenge_type: Database["public"]["Enums"]["gym_challenge_type"]
          created_at: string
          created_by: string
          end_date: string
          gym_id: string
          id: string
          start_date: string
          title: string
        }
        Insert: {
          challenge_type: Database["public"]["Enums"]["gym_challenge_type"]
          created_at?: string
          created_by: string
          end_date: string
          gym_id: string
          id?: string
          start_date: string
          title: string
        }
        Update: {
          challenge_type?: Database["public"]["Enums"]["gym_challenge_type"]
          created_at?: string
          created_by?: string
          end_date?: string
          gym_id?: string
          id?: string
          start_date?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "gym_challenges_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
      gyms: {
        Row: {
          chain: string
          created_at: string
          id: string
          name: string
          suburb: string
        }
        Insert: {
          chain: string
          created_at?: string
          id?: string
          name: string
          suburb: string
        }
        Update: {
          chain?: string
          created_at?: string
          id?: string
          name?: string
          suburb?: string
        }
        Relationships: []
      }
      inter_competition_entries: {
        Row: {
          competition_id: string
          gym_id: string
          id: string
          result: number
          submitted_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          competition_id: string
          gym_id: string
          id?: string
          result: number
          submitted_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          competition_id?: string
          gym_id?: string
          id?: string
          result?: number
          submitted_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inter_competition_entries_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "inter_competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inter_competition_entries_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
      inter_competition_gyms: {
        Row: {
          competition_id: string
          gym_id: string
        }
        Insert: {
          competition_id: string
          gym_id: string
        }
        Update: {
          competition_id?: string
          gym_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inter_competition_gyms_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "inter_competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inter_competition_gyms_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
      inter_competitions: {
        Row: {
          competition_type: Database["public"]["Enums"]["inter_competition_type"]
          created_at: string
          description: string | null
          end_date: string
          id: string
          start_date: string
          title: string
        }
        Insert: {
          competition_type: Database["public"]["Enums"]["inter_competition_type"]
          created_at?: string
          description?: string | null
          end_date: string
          id?: string
          start_date: string
          title: string
        }
        Update: {
          competition_type?: Database["public"]["Enums"]["inter_competition_type"]
          created_at?: string
          description?: string | null
          end_date?: string
          id?: string
          start_date?: string
          title?: string
        }
        Relationships: []
      }
      join_requests: {
        Row: {
          checkin_id: string
          created_at: string
          id: string
          requester_id: string
          status: Database["public"]["Enums"]["join_request_status"]
        }
        Insert: {
          checkin_id: string
          created_at?: string
          id?: string
          requester_id: string
          status?: Database["public"]["Enums"]["join_request_status"]
        }
        Update: {
          checkin_id?: string
          created_at?: string
          id?: string
          requester_id?: string
          status?: Database["public"]["Enums"]["join_request_status"]
        }
        Relationships: [
          {
            foreignKeyName: "join_requests_checkin_id_fkey"
            columns: ["checkin_id"]
            isOneToOne: false
            referencedRelation: "checkins"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          join_request_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          join_request_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          join_request_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          first_name: string | null
          gym_id: string | null
          id: string
          is_admin: boolean
          is_verified: boolean
          last_name: string | null
          membership_id: string | null
          training_style: Database["public"]["Enums"]["training_style"] | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          gym_id?: string | null
          id: string
          is_admin?: boolean
          is_verified?: boolean
          last_name?: string | null
          membership_id?: string | null
          training_style?: Database["public"]["Enums"]["training_style"] | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          gym_id?: string | null
          id?: string
          is_admin?: boolean
          is_verified?: boolean
          last_name?: string | null
          membership_id?: string | null
          training_style?: Database["public"]["Enums"]["training_style"] | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
      rsvps: {
        Row: {
          created_at: string
          event_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rsvps_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_chat: { Args: { _jr_id: string }; Returns: boolean }
      current_user_gym: { Args: never; Returns: string }
      is_admin: { Args: never; Returns: boolean }
      is_verified_at_gym: { Args: { _gym_id: string }; Returns: boolean }
    }
    Enums: {
      gym_challenge_type:
        | "highest_bench_press"
        | "highest_squat"
        | "highest_deadlift"
        | "most_pullups"
        | "most_pushups"
        | "fastest_5km"
        | "longest_plank"
      inter_competition_type:
        | "total_bench_press"
        | "total_deadlift"
        | "total_checkins"
        | "most_pbs"
        | "total_pullups"
        | "highest_avg_bench"
      join_request_status: "pending" | "accepted" | "declined"
      training_style:
        | "Powerlifting"
        | "Bodybuilding"
        | "Cardio"
        | "CrossFit"
        | "General Fitness"
      training_type:
        | "Chest Day"
        | "Leg Day"
        | "Back & Biceps"
        | "Shoulders"
        | "Arms"
        | "Cardio"
        | "Full Body"
        | "Other"
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
      gym_challenge_type: [
        "highest_bench_press",
        "highest_squat",
        "highest_deadlift",
        "most_pullups",
        "most_pushups",
        "fastest_5km",
        "longest_plank",
      ],
      inter_competition_type: [
        "total_bench_press",
        "total_deadlift",
        "total_checkins",
        "most_pbs",
        "total_pullups",
        "highest_avg_bench",
      ],
      join_request_status: ["pending", "accepted", "declined"],
      training_style: [
        "Powerlifting",
        "Bodybuilding",
        "Cardio",
        "CrossFit",
        "General Fitness",
      ],
      training_type: [
        "Chest Day",
        "Leg Day",
        "Back & Biceps",
        "Shoulders",
        "Arms",
        "Cardio",
        "Full Body",
        "Other",
      ],
    },
  },
} as const
