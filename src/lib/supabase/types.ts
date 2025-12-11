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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      cached_cities: {
        Row: {
          city_name: string
          city_name_en: string | null
          country_id: string | null
          country_name: string | null
          id: string
          last_seen_at: string
          offer_count: number | null
        }
        Insert: {
          city_name: string
          city_name_en?: string | null
          country_id?: string | null
          country_name?: string | null
          id?: string
          last_seen_at?: string
          offer_count?: number | null
        }
        Update: {
          city_name?: string
          city_name_en?: string | null
          country_id?: string | null
          country_name?: string | null
          id?: string
          last_seen_at?: string
          offer_count?: number | null
        }
        Relationships: []
      }
      cached_offers: {
        Row: {
          activity_sector_id: string | null
          city_name: string | null
          city_name_en: string | null
          company_size: string | null
          country_id: string | null
          country_name: string | null
          country_name_en: string | null
          created_at: string
          geographic_zone: string | null
          id: number
          indemnite: number | null
          mission_duration: number | null
          mission_start_date: string | null
          mission_title: string
          mission_type: string | null
          organization_name: string | null
          raw_data: Json
          study_level_id: string | null
          teleworking_available: boolean | null
          updated_at: string
        }
        Insert: {
          activity_sector_id?: string | null
          city_name?: string | null
          city_name_en?: string | null
          company_size?: string | null
          country_id?: string | null
          country_name?: string | null
          country_name_en?: string | null
          created_at?: string
          geographic_zone?: string | null
          id: number
          indemnite?: number | null
          mission_duration?: number | null
          mission_start_date?: string | null
          mission_title: string
          mission_type?: string | null
          organization_name?: string | null
          raw_data: Json
          study_level_id?: string | null
          teleworking_available?: boolean | null
          updated_at?: string
        }
        Update: {
          activity_sector_id?: string | null
          city_name?: string | null
          city_name_en?: string | null
          company_size?: string | null
          country_id?: string | null
          country_name?: string | null
          country_name_en?: string | null
          created_at?: string
          geographic_zone?: string | null
          id?: number
          indemnite?: number | null
          mission_duration?: number | null
          mission_start_date?: string | null
          mission_title?: string
          mission_type?: string | null
          organization_name?: string | null
          raw_data?: Json
          study_level_id?: string | null
          teleworking_available?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      job_runs: {
        Row: {
          errors: number
          finished_at: string | null
          id: string
          log: Json
          new_offers: number
          processed: number
          started_at: string
          status: string
        }
        Insert: {
          errors?: number
          finished_at?: string | null
          id?: string
          log?: Json
          new_offers?: number
          processed?: number
          started_at?: string
          status: string
        }
        Update: {
          errors?: number
          finished_at?: string | null
          id?: string
          log?: Json
          new_offers?: number
          processed?: number
          started_at?: string
          status?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          channel: string
          created_at: string
          filters: Json
          id: string
          is_active: boolean
          label: string
          seen_offer_ids: Json
          target: string
          updated_at: string
          user_id: string
        }
        Insert: {
          channel: string
          created_at?: string
          filters?: Json
          id?: string
          is_active?: boolean
          label: string
          seen_offer_ids?: Json
          target: string
          updated_at?: string
          user_id: string
        }
        Update: {
          channel?: string
          created_at?: string
          filters?: Json
          id?: string
          is_active?: boolean
          label?: string
          seen_offer_ids?: Json
          target?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string
          id: string
          smtp_from: string | null
          smtp_host: string | null
          smtp_pass: string | null
          smtp_port: number | null
          smtp_user: string | null
          telegram_bot_token: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          smtp_from?: string | null
          smtp_host?: string | null
          smtp_pass?: string | null
          smtp_port?: number | null
          smtp_user?: string | null
          telegram_bot_token?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          smtp_from?: string | null
          smtp_host?: string | null
          smtp_pass?: string | null
          smtp_port?: number | null
          smtp_user?: string | null
          telegram_bot_token?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
