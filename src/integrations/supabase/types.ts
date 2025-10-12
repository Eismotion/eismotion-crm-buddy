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
      custom_texts: {
        Row: {
          category: string
          created_at: string | null
          created_by: string | null
          id: string
          is_favorite: boolean | null
          is_public: boolean | null
          occasion: string | null
          season: string | null
          tags: string[] | null
          text_content: string
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          category: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_favorite?: boolean | null
          is_public?: boolean | null
          occasion?: string | null
          season?: string | null
          tags?: string[] | null
          text_content: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          category?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_favorite?: boolean | null
          is_public?: boolean | null
          occasion?: string | null
          season?: string | null
          tags?: string[] | null
          text_content?: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          city: string | null
          created_at: string | null
          customer_number: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          parent_customer_id: string | null
          phone: string | null
          postal_code: string | null
          total_orders: number | null
          total_spent: number | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          customer_number?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          parent_customer_id?: string | null
          phone?: string | null
          postal_code?: string | null
          total_orders?: number | null
          total_spent?: number | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          customer_number?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          parent_customer_id?: string | null
          phone?: string | null
          postal_code?: string | null
          total_orders?: number | null
          total_spent?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_parent_customer_id_fkey"
            columns: ["parent_customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      design_analytics: {
        Row: {
          created_at: string | null
          customer_id: string | null
          event_data: Json | null
          event_type: string
          id: string
          invoice_id: string | null
          template_id: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          invoice_id?: string | null
          template_id?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          invoice_id?: string | null
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "design_analytics_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "design_analytics_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "design_analytics_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "invoice_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "design_analytics_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "template_performance"
            referencedColumns: ["id"]
          },
        ]
      }
      design_assets: {
        Row: {
          asset_type: string
          category: string | null
          created_at: string | null
          description: string | null
          file_name: string | null
          file_size: number | null
          file_url: string
          height: number | null
          id: string
          is_public: boolean | null
          mime_type: string | null
          name: string
          tags: string[] | null
          uploaded_by: string | null
          usage_count: number | null
          width: number | null
        }
        Insert: {
          asset_type: string
          category?: string | null
          created_at?: string | null
          description?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url: string
          height?: number | null
          id?: string
          is_public?: boolean | null
          mime_type?: string | null
          name: string
          tags?: string[] | null
          uploaded_by?: string | null
          usage_count?: number | null
          width?: number | null
        }
        Update: {
          asset_type?: string
          category?: string | null
          created_at?: string | null
          description?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string
          height?: number | null
          id?: string
          is_public?: boolean | null
          mime_type?: string | null
          name?: string
          tags?: string[] | null
          uploaded_by?: string | null
          usage_count?: number | null
          width?: number | null
        }
        Relationships: []
      }
      import_logs: {
        Row: {
          created_at: string | null
          error_details: Json | null
          filename: string | null
          id: string
          import_type: string | null
          records_failed: number | null
          records_processed: number | null
          records_successful: number | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          error_details?: Json | null
          filename?: string | null
          id?: string
          import_type?: string | null
          records_failed?: number | null
          records_processed?: number | null
          records_successful?: number | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          error_details?: Json | null
          filename?: string | null
          id?: string
          import_type?: string | null
          records_failed?: number | null
          records_processed?: number | null
          records_successful?: number | null
          status?: string | null
        }
        Relationships: []
      }
      incoming_invoices: {
        Row: {
          amount: number | null
          created_at: string | null
          currency: string | null
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          invoice_date: string | null
          invoice_number: string | null
          invoice_type: string
          notes: string | null
          supplier_name: string | null
          updated_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          currency?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          invoice_type: string
          notes?: string | null
          supplier_name?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          currency?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          invoice_type?: string
          notes?: string | null
          supplier_name?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: []
      }
      invoice_items: {
        Row: {
          created_at: string | null
          description: string
          id: string
          invoice_id: string | null
          product_id: string | null
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          invoice_id?: string | null
          product_id?: string | null
          quantity?: number
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          invoice_id?: string | null
          product_id?: string | null
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "top_products"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_templates: {
        Row: {
          active: boolean | null
          category: string | null
          colors: Json | null
          created_at: string | null
          created_by: string | null
          css_styles: string | null
          fonts: Json | null
          html_template: string
          id: string
          is_default: boolean | null
          is_public: boolean | null
          layout_config: Json | null
          name: string
          occasion: string | null
          season: string | null
          theme: string | null
          thumbnail_url: string | null
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          active?: boolean | null
          category?: string | null
          colors?: Json | null
          created_at?: string | null
          created_by?: string | null
          css_styles?: string | null
          fonts?: Json | null
          html_template: string
          id?: string
          is_default?: boolean | null
          is_public?: boolean | null
          layout_config?: Json | null
          name: string
          occasion?: string | null
          season?: string | null
          theme?: string | null
          thumbnail_url?: string | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          active?: boolean | null
          category?: string | null
          colors?: Json | null
          created_at?: string | null
          created_by?: string | null
          css_styles?: string | null
          fonts?: Json | null
          html_template?: string
          id?: string
          is_default?: boolean | null
          is_public?: boolean | null
          layout_config?: Json | null
          name?: string
          occasion?: string | null
          season?: string | null
          theme?: string | null
          thumbnail_url?: string | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: []
      }
      invoices: {
        Row: {
          created_at: string | null
          custom_design: Json | null
          custom_message: string | null
          customer_feedback_rating: number | null
          customer_feedback_text: string | null
          customer_id: string | null
          due_date: string | null
          generated_leads: number | null
          id: string
          invoice_date: string
          invoice_number: string
          notes: string | null
          status: string | null
          subtotal: number
          tax_amount: number | null
          tax_rate: number | null
          template_id: string | null
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          custom_design?: Json | null
          custom_message?: string | null
          customer_feedback_rating?: number | null
          customer_feedback_text?: string | null
          customer_id?: string | null
          due_date?: string | null
          generated_leads?: number | null
          id?: string
          invoice_date?: string
          invoice_number: string
          notes?: string | null
          status?: string | null
          subtotal?: number
          tax_amount?: number | null
          tax_rate?: number | null
          template_id?: string | null
          total_amount?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          custom_design?: Json | null
          custom_message?: string | null
          customer_feedback_rating?: number | null
          customer_feedback_text?: string | null
          customer_id?: string | null
          due_date?: string | null
          generated_leads?: number | null
          id?: string
          invoice_date?: string
          invoice_number?: string
          notes?: string | null
          status?: string | null
          subtotal?: number
          tax_amount?: number | null
          tax_rate?: number | null
          template_id?: string | null
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "invoice_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "template_performance"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean | null
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          price: number
          season: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          price: number
          season?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          price?: number
          season?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          customer_id: string | null
          email: string
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          email: string
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      template_elements: {
        Row: {
          content: string | null
          created_at: string | null
          element_type: string
          height: number | null
          id: string
          is_editable: boolean | null
          is_required: boolean | null
          position_x: number | null
          position_y: number | null
          styles: Json | null
          template_id: string | null
          width: number | null
          z_index: number | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          element_type: string
          height?: number | null
          id?: string
          is_editable?: boolean | null
          is_required?: boolean | null
          position_x?: number | null
          position_y?: number | null
          styles?: Json | null
          template_id?: string | null
          width?: number | null
          z_index?: number | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          element_type?: string
          height?: number | null
          id?: string
          is_editable?: boolean | null
          is_required?: boolean | null
          position_x?: number | null
          position_y?: number | null
          styles?: Json | null
          template_id?: string | null
          width?: number | null
          z_index?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "template_elements_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "invoice_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_elements_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "template_performance"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      dashboard_stats: {
        Row: {
          avg_invoice_value: number | null
          overdue_invoices: number | null
          total_customers: number | null
          total_invoices: number | null
          total_revenue: number | null
        }
        Relationships: []
      }
      design_impact: {
        Row: {
          avg_design_rating: number | null
          month: string | null
          total_invoices: number | null
          total_leads_generated: number | null
          unique_customers: number | null
        }
        Relationships: []
      }
      monthly_revenue: {
        Row: {
          invoice_count: number | null
          month: string | null
          revenue: number | null
        }
        Relationships: []
      }
      popular_assets: {
        Row: {
          asset_type: string | null
          category: string | null
          file_url: string | null
          id: string | null
          name: string | null
          usage_count: number | null
        }
        Relationships: []
      }
      template_performance: {
        Row: {
          avg_rating: number | null
          category: string | null
          id: string | null
          name: string | null
          season: string | null
          theme: string | null
          total_invoices: number | null
          total_leads: number | null
          usage_count: number | null
        }
        Relationships: []
      }
      top_products: {
        Row: {
          category: string | null
          id: string | null
          name: string | null
          season: string | null
          total_revenue: number | null
          total_sold: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      create_customer_login: {
        Args: {
          customer_email: string
          customer_name: string
          customer_password: string
          customer_uuid: string
        }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "customer"
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
      app_role: ["admin", "customer"],
    },
  },
} as const
