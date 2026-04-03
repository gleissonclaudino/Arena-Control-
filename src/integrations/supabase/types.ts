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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      arena_funcionamento: {
        Row: {
          arena_id: string
          ativo: boolean
          dia_semana: string
          id: string
        }
        Insert: {
          arena_id: string
          ativo?: boolean
          dia_semana: string
          id?: string
        }
        Update: {
          arena_id?: string
          ativo?: boolean
          dia_semana?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "arena_funcionamento_arena_id_fkey"
            columns: ["arena_id"]
            isOneToOne: false
            referencedRelation: "arenas"
            referencedColumns: ["id"]
          },
        ]
      }
      arenas: {
        Row: {
          cidade: string | null
          created_at: string
          email: string | null
          endereco: string | null
          estado: string | null
          id: string
          nome: string
          slug: string
          telefone: string | null
        }
        Insert: {
          cidade?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          nome: string
          slug: string
          telefone?: string | null
        }
        Update: {
          cidade?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          nome?: string
          slug?: string
          telefone?: string | null
        }
        Relationships: []
      }
      avaliacoes: {
        Row: {
          arena_id: string
          cliente_nome: string
          comentario: string | null
          created_at: string
          id: string
          nota: number
          quadra_id: string | null
          reserva_id: string | null
        }
        Insert: {
          arena_id: string
          cliente_nome: string
          comentario?: string | null
          created_at?: string
          id?: string
          nota: number
          quadra_id?: string | null
          reserva_id?: string | null
        }
        Update: {
          arena_id?: string
          cliente_nome?: string
          comentario?: string | null
          created_at?: string
          id?: string
          nota?: number
          quadra_id?: string | null
          reserva_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "avaliacoes_arena_id_fkey"
            columns: ["arena_id"]
            isOneToOne: false
            referencedRelation: "arenas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avaliacoes_quadra_id_fkey"
            columns: ["quadra_id"]
            isOneToOne: false
            referencedRelation: "quadras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avaliacoes_reserva_id_fkey"
            columns: ["reserva_id"]
            isOneToOne: false
            referencedRelation: "reservas"
            referencedColumns: ["id"]
          },
        ]
      }
      bloqueios_agenda: {
        Row: {
          arena_id: string
          created_at: string
          data: string
          hora_fim: string
          hora_inicio: string
          id: string
          motivo: string | null
          quadra_id: string
        }
        Insert: {
          arena_id: string
          created_at?: string
          data: string
          hora_fim: string
          hora_inicio: string
          id?: string
          motivo?: string | null
          quadra_id: string
        }
        Update: {
          arena_id?: string
          created_at?: string
          data?: string
          hora_fim?: string
          hora_inicio?: string
          id?: string
          motivo?: string | null
          quadra_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bloqueios_agenda_arena_id_fkey"
            columns: ["arena_id"]
            isOneToOne: false
            referencedRelation: "arenas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bloqueios_agenda_quadra_id_fkey"
            columns: ["quadra_id"]
            isOneToOne: false
            referencedRelation: "quadras"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          arena_id: string
          created_at: string
          email: string | null
          id: string
          nome: string
          observacoes: string | null
          telefone: string
        }
        Insert: {
          arena_id: string
          created_at?: string
          email?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          telefone: string
        }
        Update: {
          arena_id?: string
          created_at?: string
          email?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          telefone?: string
        }
        Relationships: [
          {
            foreignKeyName: "clientes_arena_id_fkey"
            columns: ["arena_id"]
            isOneToOne: false
            referencedRelation: "arenas"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracoes_arena: {
        Row: {
          arena_id: string
          horario_abertura: string
          horario_fechamento: string
          id: string
          intervalo_reserva: number
          link_publico_ativo: boolean
          mensagem_confirmacao: string | null
          permitir_reserva_online: boolean
          tempo_minimo_reserva: number
        }
        Insert: {
          arena_id: string
          horario_abertura?: string
          horario_fechamento?: string
          id?: string
          intervalo_reserva?: number
          link_publico_ativo?: boolean
          mensagem_confirmacao?: string | null
          permitir_reserva_online?: boolean
          tempo_minimo_reserva?: number
        }
        Update: {
          arena_id?: string
          horario_abertura?: string
          horario_fechamento?: string
          id?: string
          intervalo_reserva?: number
          link_publico_ativo?: boolean
          mensagem_confirmacao?: string | null
          permitir_reserva_online?: boolean
          tempo_minimo_reserva?: number
        }
        Relationships: [
          {
            foreignKeyName: "configuracoes_arena_arena_id_fkey"
            columns: ["arena_id"]
            isOneToOne: true
            referencedRelation: "arenas"
            referencedColumns: ["id"]
          },
        ]
      }
      despesas: {
        Row: {
          arena_id: string
          categoria: string
          created_at: string
          data: string
          descricao: string
          id: string
          valor: number
        }
        Insert: {
          arena_id: string
          categoria?: string
          created_at?: string
          data?: string
          descricao: string
          id?: string
          valor?: number
        }
        Update: {
          arena_id?: string
          categoria?: string
          created_at?: string
          data?: string
          descricao?: string
          id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "despesas_arena_id_fkey"
            columns: ["arena_id"]
            isOneToOne: false
            referencedRelation: "arenas"
            referencedColumns: ["id"]
          },
        ]
      }
      opcionais: {
        Row: {
          arena_id: string
          ativo: boolean
          created_at: string
          descricao: string | null
          id: string
          nome: string
          preco: number
        }
        Insert: {
          arena_id: string
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          preco?: number
        }
        Update: {
          arena_id?: string
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          preco?: number
        }
        Relationships: [
          {
            foreignKeyName: "opcionais_arena_id_fkey"
            columns: ["arena_id"]
            isOneToOne: false
            referencedRelation: "arenas"
            referencedColumns: ["id"]
          },
        ]
      }
      pagamentos: {
        Row: {
          arena_id: string
          created_at: string
          id: string
          metodo: string
          reserva_id: string
          status: string
          transaction_id: string | null
          valor: number
        }
        Insert: {
          arena_id: string
          created_at?: string
          id?: string
          metodo: string
          reserva_id: string
          status?: string
          transaction_id?: string | null
          valor: number
        }
        Update: {
          arena_id?: string
          created_at?: string
          id?: string
          metodo?: string
          reserva_id?: string
          status?: string
          transaction_id?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "pagamentos_arena_id_fkey"
            columns: ["arena_id"]
            isOneToOne: false
            referencedRelation: "arenas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagamentos_reserva_id_fkey"
            columns: ["reserva_id"]
            isOneToOne: false
            referencedRelation: "reservas"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          arena_id: string
          created_at: string
          id: string
          name: string | null
          user_id: string
        }
        Insert: {
          arena_id: string
          created_at?: string
          id?: string
          name?: string | null
          user_id: string
        }
        Update: {
          arena_id?: string
          created_at?: string
          id?: string
          name?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_arena_id_fkey"
            columns: ["arena_id"]
            isOneToOne: false
            referencedRelation: "arenas"
            referencedColumns: ["id"]
          },
        ]
      }
      quadra_fotos: {
        Row: {
          created_at: string
          id: string
          quadra_id: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          quadra_id: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          quadra_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "quadra_fotos_quadra_id_fkey"
            columns: ["quadra_id"]
            isOneToOne: false
            referencedRelation: "quadras"
            referencedColumns: ["id"]
          },
        ]
      }
      quadra_recursos: {
        Row: {
          created_at: string
          id: string
          nome: string
          quadra_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          quadra_id: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          quadra_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quadra_recursos_quadra_id_fkey"
            columns: ["quadra_id"]
            isOneToOne: false
            referencedRelation: "quadras"
            referencedColumns: ["id"]
          },
        ]
      }
      quadras: {
        Row: {
          arena_id: string
          ativa: boolean
          created_at: string
          descricao: string | null
          id: string
          nome: string
          preco_hora: number
          tipo_esporte: string
        }
        Insert: {
          arena_id: string
          ativa?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          preco_hora?: number
          tipo_esporte?: string
        }
        Update: {
          arena_id?: string
          ativa?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          preco_hora?: number
          tipo_esporte?: string
        }
        Relationships: [
          {
            foreignKeyName: "quadras_arena_id_fkey"
            columns: ["arena_id"]
            isOneToOne: false
            referencedRelation: "arenas"
            referencedColumns: ["id"]
          },
        ]
      }
      reserva_opcionais: {
        Row: {
          id: string
          opcional_id: string
          preco: number
          reserva_id: string
        }
        Insert: {
          id?: string
          opcional_id: string
          preco?: number
          reserva_id: string
        }
        Update: {
          id?: string
          opcional_id?: string
          preco?: number
          reserva_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reserva_opcionais_opcional_id_fkey"
            columns: ["opcional_id"]
            isOneToOne: false
            referencedRelation: "opcionais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reserva_opcionais_reserva_id_fkey"
            columns: ["reserva_id"]
            isOneToOne: false
            referencedRelation: "reservas"
            referencedColumns: ["id"]
          },
        ]
      }
      reservas: {
        Row: {
          arena_id: string
          cliente_id: string | null
          created_at: string
          data: string
          hora_fim: string
          hora_inicio: string
          id: string
          metodo_pagamento: string | null
          observacoes: string | null
          origem: string
          quadra_id: string
          status: string
          valor: number
        }
        Insert: {
          arena_id: string
          cliente_id?: string | null
          created_at?: string
          data: string
          hora_fim: string
          hora_inicio: string
          id?: string
          metodo_pagamento?: string | null
          observacoes?: string | null
          origem?: string
          quadra_id: string
          status?: string
          valor?: number
        }
        Update: {
          arena_id?: string
          cliente_id?: string | null
          created_at?: string
          data?: string
          hora_fim?: string
          hora_inicio?: string
          id?: string
          metodo_pagamento?: string | null
          observacoes?: string | null
          origem?: string
          quadra_id?: string
          status?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "reservas_arena_id_fkey"
            columns: ["arena_id"]
            isOneToOne: false
            referencedRelation: "arenas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservas_quadra_id_fkey"
            columns: ["quadra_id"]
            isOneToOne: false
            referencedRelation: "quadras"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios: {
        Row: {
          created_at: string
          data_expiracao: string
          data_inicio: string
          email: string | null
          id: string
          plano: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data_expiracao?: string
          data_inicio?: string
          email?: string | null
          id?: string
          plano?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data_expiracao?: string
          data_inicio?: string
          email?: string | null
          id?: string
          plano?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_arena_id: { Args: { _user_id: string }; Returns: string }
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
