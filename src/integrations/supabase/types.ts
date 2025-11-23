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
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      cron_job_logs: {
        Row: {
          completed_at: string | null
          created_at: string
          details: Json | null
          duration_seconds: number | null
          error_message: string | null
          id: string
          job_name: string
          started_at: string
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          details?: Json | null
          duration_seconds?: number | null
          error_message?: string | null
          id?: string
          job_name: string
          started_at?: string
          status: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          details?: Json | null
          duration_seconds?: number | null
          error_message?: string | null
          id?: string
          job_name?: string
          started_at?: string
          status?: string
        }
        Relationships: []
      }
      equipment: {
        Row: {
          barcode: string | null
          category_id: string | null
          created_at: string
          id: string
          inventory_number: string | null
          last_check_date: string | null
          location_id: string | null
          manufacturer: string | null
          model: string | null
          name: string
          next_check_date: string | null
          notes: string | null
          purchase_date: string | null
          replacement_date: string | null
          responsible_person_id: string | null
          serial_number: string | null
          status: Database["public"]["Enums"]["equipment_status"]
          updated_at: string
        }
        Insert: {
          barcode?: string | null
          category_id?: string | null
          created_at?: string
          id?: string
          inventory_number?: string | null
          last_check_date?: string | null
          location_id?: string | null
          manufacturer?: string | null
          model?: string | null
          name: string
          next_check_date?: string | null
          notes?: string | null
          purchase_date?: string | null
          replacement_date?: string | null
          responsible_person_id?: string | null
          serial_number?: string | null
          status?: Database["public"]["Enums"]["equipment_status"]
          updated_at?: string
        }
        Update: {
          barcode?: string | null
          category_id?: string | null
          created_at?: string
          id?: string
          inventory_number?: string | null
          last_check_date?: string | null
          location_id?: string | null
          manufacturer?: string | null
          model?: string | null
          name?: string
          next_check_date?: string | null
          notes?: string | null
          purchase_date?: string | null
          replacement_date?: string | null
          responsible_person_id?: string | null
          serial_number?: string | null
          status?: Database["public"]["Enums"]["equipment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_responsible_person_id_fkey"
            columns: ["responsible_person_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_comments: {
        Row: {
          comment: string
          created_at: string
          equipment_id: string
          id: string
          person_id: string
          updated_at: string
        }
        Insert: {
          comment: string
          created_at?: string
          equipment_id: string
          id?: string
          person_id: string
          updated_at?: string
        }
        Update: {
          comment?: string
          created_at?: string
          equipment_id?: string
          id?: string
          person_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_comments_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_comments_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      maintenance_records: {
        Row: {
          created_at: string
          documentation_image_url: string | null
          due_date: string
          equipment_id: string
          id: string
          minutes_spent: number | null
          notes: string | null
          performed_by: string | null
          performed_date: string | null
          status: Database["public"]["Enums"]["maintenance_status"]
          template_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          documentation_image_url?: string | null
          due_date: string
          equipment_id: string
          id?: string
          minutes_spent?: number | null
          notes?: string | null
          performed_by?: string | null
          performed_date?: string | null
          status?: Database["public"]["Enums"]["maintenance_status"]
          template_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          documentation_image_url?: string | null
          due_date?: string
          equipment_id?: string
          id?: string
          minutes_spent?: number | null
          notes?: string | null
          performed_by?: string | null
          performed_date?: string | null
          status?: Database["public"]["Enums"]["maintenance_status"]
          template_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_records_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_records_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_records_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "maintenance_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_templates: {
        Row: {
          category_id: string | null
          checklist_url: string | null
          checks: string | null
          created_at: string
          description: string | null
          estimated_minutes: number | null
          id: string
          interval_months: number
          name: string
          responsible_person_id: string | null
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          checklist_url?: string | null
          checks?: string | null
          created_at?: string
          description?: string | null
          estimated_minutes?: number | null
          id?: string
          interval_months: number
          name: string
          responsible_person_id?: string | null
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          checklist_url?: string | null
          checks?: string | null
          created_at?: string
          description?: string | null
          estimated_minutes?: number | null
          id?: string
          interval_months?: number
          name?: string
          responsible_person_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_templates_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_templates_responsible_person_id_fkey"
            columns: ["responsible_person_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
        ]
      }
      mission_equipment: {
        Row: {
          added_at: string
          added_by: string | null
          equipment_id: string
          id: string
          mission_id: string
          notes: string | null
        }
        Insert: {
          added_at?: string
          added_by?: string | null
          equipment_id: string
          id?: string
          mission_id: string
          notes?: string | null
        }
        Update: {
          added_at?: string
          added_by?: string | null
          equipment_id?: string
          id?: string
          mission_id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mission_equipment_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_equipment_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_equipment_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
      mission_equipment_templates: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
          vehicle_reference: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          vehicle_reference?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          vehicle_reference?: string | null
        }
        Relationships: []
      }
      missions: {
        Row: {
          created_at: string
          description: string | null
          end_time: string | null
          id: string
          location: string | null
          mission_date: string
          mission_type: Database["public"]["Enums"]["mission_type"]
          responsible_persons: string | null
          start_time: string | null
          title: string
          updated_at: string
          vehicles: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_time?: string | null
          id?: string
          location?: string | null
          mission_date: string
          mission_type: Database["public"]["Enums"]["mission_type"]
          responsible_persons?: string | null
          start_time?: string | null
          title: string
          updated_at?: string
          vehicles?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          end_time?: string | null
          id?: string
          location?: string | null
          mission_date?: string
          mission_type?: Database["public"]["Enums"]["mission_type"]
          responsible_persons?: string | null
          start_time?: string | null
          title?: string
          updated_at?: string
          vehicles?: string | null
        }
        Relationships: []
      }
      persons: {
        Row: {
          created_at: string
          email: string | null
          first_name: string
          id: string
          last_name: string
          phone: string | null
          role: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          first_name: string
          id?: string
          last_name: string
          phone?: string | null
          role?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string
          phone?: string | null
          role?: string | null
        }
        Relationships: []
      }
      settings: {
        Row: {
          created_at: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          created_at?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      template_equipment_items: {
        Row: {
          created_at: string
          equipment_id: string
          id: string
          notes: string | null
          template_id: string
        }
        Insert: {
          created_at?: string
          equipment_id: string
          id?: string
          notes?: string | null
          template_id: string
        }
        Update: {
          created_at?: string
          equipment_id?: string
          id?: string
          notes?: string | null
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_equipment_items_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_equipment_items_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "mission_equipment_templates"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_equipment_comment: {
        Args: {
          comment_param: string
          equipment_id_param: string
          person_id_param: string
        }
        Returns: undefined
      }
      get_equipment_comments: {
        Args: { equipment_id_param: string }
        Returns: Json[]
      }
      truncate_table: { Args: { table_name: string }; Returns: undefined }
    }
    Enums: {
      equipment_status:
        | "einsatzbereit"
        | "defekt"
        | "prüfung fällig"
        | "wartung"
      maintenance_status:
        | "geplant"
        | "ausstehend"
        | "in_bearbeitung"
        | "abgeschlossen"
      mission_type: "einsatz" | "übung"
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
      equipment_status: [
        "einsatzbereit",
        "defekt",
        "prüfung fällig",
        "wartung",
      ],
      maintenance_status: [
        "geplant",
        "ausstehend",
        "in_bearbeitung",
        "abgeschlossen",
      ],
      mission_type: ["einsatz", "übung"],
    },
  },
} as const
