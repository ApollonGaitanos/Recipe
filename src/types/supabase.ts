export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    public: {
        Tables: {
            ai_usage_logs: {
                Row: {
                    created_at: string
                    id: string
                    request_count: number
                    usage_date: string
                    user_id: string
                }
                Insert: {
                    created_at?: string
                    id?: string
                    request_count?: number
                    usage_date?: string
                    user_id: string
                }
                Update: {
                    created_at?: string
                    id?: string
                    request_count?: number
                    usage_date?: string
                    user_id?: string
                }
                Relationships: []
            }
            likes: {
                Row: {
                    created_at: string | null
                    recipe_id: string
                    user_id: string
                }
                Insert: {
                    created_at?: string | null
                    recipe_id: string
                    user_id: string
                }
                Update: {
                    created_at?: string | null
                    recipe_id?: string
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "likes_recipe_id_fkey"
                        columns: ["recipe_id"]
                        isOneToOne: false
                        referencedRelation: "recipes"
                        referencedColumns: ["id"]
                    },
                ]
            }
            profiles: {
                Row: {
                    avatar_url: string | null
                    bio: string | null
                    id: string
                    updated_at: string | null
                    username: string | null
                    website: string | null
                }
                Insert: {
                    avatar_url?: string | null
                    bio?: string | null
                    id: string
                    updated_at?: string | null
                    username?: string | null
                    website?: string | null
                }
                Update: {
                    avatar_url?: string | null
                    bio?: string | null
                    id?: string
                    updated_at?: string | null
                    username?: string | null
                    website?: string | null
                }
                Relationships: []
            }
            recipe_signals: {
                Row: {
                    is_public: boolean | null
                    recipe_id: string
                    updated_at: string | null
                }
                Insert: {
                    is_public?: boolean | null
                    recipe_id: string
                    updated_at?: string | null
                }
                Update: {
                    is_public?: boolean | null
                    recipe_id?: string
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "recipe_signals_recipe_id_fkey"
                        columns: ["recipe_id"]
                        isOneToOne: true
                        referencedRelation: "recipes"
                        referencedColumns: ["id"]
                    },
                ]
            }
            recipe_translations: {
                Row: {
                    created_at: string
                    id: string
                    language: string
                    recipe_id: string
                    translated_content: Json
                    updated_at: string
                }
                Insert: {
                    created_at?: string
                    id?: string
                    language: string
                    recipe_id: string
                    translated_content: Json
                    updated_at?: string
                }
                Update: {
                    created_at?: string
                    id?: string
                    language?: string
                    recipe_id?: string
                    translated_content?: Json
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "recipe_translations_recipe_id_fkey"
                        columns: ["recipe_id"]
                        isOneToOne: false
                        referencedRelation: "recipes"
                        referencedColumns: ["id"]
                    },
                ]
            }
            recipes: {
                Row: {
                    ai_generated: boolean | null
                    content: Json
                    created_at: string
                    embedding: string | null
                    id: string
                    image_url: string | null
                    is_public: boolean | null
                    likes_count: number | null
                    origin_id: string | null
                    original_content: Json | null
                    tags: string[] | null
                    title: string
                    updated_at: string
                    user_id: string
                }
                Insert: {
                    ai_generated?: boolean | null
                    content: Json
                    created_at?: string
                    embedding?: string | null
                    id?: string
                    image_url?: string | null
                    is_public?: boolean | null
                    likes_count?: number | null
                    origin_id?: string | null
                    original_content?: Json | null
                    tags?: string[] | null
                    title: string
                    updated_at?: string
                    user_id: string
                }
                Update: {
                    ai_generated?: boolean | null
                    content?: Json
                    created_at?: string
                    embedding?: string | null
                    id?: string
                    image_url?: string | null
                    is_public?: boolean | null
                    likes_count?: number | null
                    origin_id?: string | null
                    original_content?: Json | null
                    tags?: string[] | null
                    title?: string
                    updated_at?: string
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "recipes_origin_id_fkey"
                        columns: ["origin_id"]
                        isOneToOne: false
                        referencedRelation: "recipes"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "recipes_profiles_fk"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            saved_recipes: {
                Row: {
                    created_at: string | null
                    recipe_id: string
                    user_id: string
                }
                Insert: {
                    created_at?: string | null
                    recipe_id: string
                    user_id: string
                }
                Update: {
                    created_at?: string | null
                    recipe_id?: string
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "saved_recipes_recipe_id_fkey"
                        columns: ["recipe_id"]
                        isOneToOne: false
                        referencedRelation: "recipes"
                        referencedColumns: ["id"]
                    },
                ]
            }
        }
        Views: {
            public_recipe_signals: {
                Row: {
                    recipe_id: string | null
                    updated_at: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "recipe_signals_recipe_id_fkey"
                        columns: ["recipe_id"]
                        isOneToOne: true
                        referencedRelation: "recipes"
                        referencedColumns: ["id"]
                    },
                ]
            }
        }
        Functions: {
            binary_quantize:
            | {
                Args: {
                    "": string
                }
                Returns: string
            }
            | {
                Args: {
                    "": unknown
                }
                Returns: unknown
            }
            halfvec_avg: {
                Args: {
                    "": number[]
                }
                Returns: unknown
            }
            halfvec_out: {
                Args: {
                    "": unknown
                }
                Returns: unknown
            }
            halfvec_send: {
                Args: {
                    "": unknown
                }
                Returns: string
            }
            halfvec_typmod_in: {
                Args: {
                    "": unknown[]
                }
                Returns: number
            }
            hnsw_bit_support: {
                Args: {
                    "": unknown
                }
                Returns: unknown
            }
            hnsw_halfvec_support: {
                Args: {
                    "": unknown
                }
                Returns: unknown
            }
            hnsw_sparsevec_support: {
                Args: {
                    "": unknown
                }
                Returns: unknown
            }
            hnswhandler: {
                Args: {
                    "": unknown
                }
                Returns: unknown
            }
            ivfflat_bit_support: {
                Args: {
                    "": unknown
                }
                Returns: unknown
            }
            ivfflat_halfvec_support: {
                Args: {
                    "": unknown
                }
                Returns: unknown
            }
            ivfflathandler: {
                Args: {
                    "": unknown
                }
                Returns: unknown
            }
            l2_norm:
            | {
                Args: {
                    "": unknown
                }
                Returns: number
            }
            | {
                Args: {
                    "": unknown
                }
                Returns: number
            }
            l2_normalize:
            | {
                Args: {
                    "": string
                }
                Returns: string
            }
            | {
                Args: {
                    "": unknown
                }
                Returns: unknown
            }
            | {
                Args: {
                    "": unknown
                }
                Returns: unknown
            }
            search_profiles_public: {
                Args: {
                    search_term: string
                }
                Returns: {
                    id: string
                    username: string
                    avatar_url: string
                }[]
            }
            search_recipes_public: {
                Args: {
                    search_term: string
                }
                Returns: {
                    id: string
                    title: string
                    is_public: boolean
                    user_id: string
                    username: string
                    likes_count: number
                }[]
            }
            sparsevec_out: {
                Args: {
                    "": unknown
                }
                Returns: unknown
            }
            sparsevec_send: {
                Args: {
                    "": unknown
                }
                Returns: string
            }
            sparsevec_typmod_in: {
                Args: {
                    "": unknown[]
                }
                Returns: number
            }
            vector_avg: {
                Args: {
                    "": number[]
                }
                Returns: string
            }
            vector_dims:
            | {
                Args: {
                    "": string
                }
                Returns: number
            }
            | {
                Args: {
                    "": unknown
                }
                Returns: number
            }
            vector_norm: {
                Args: {
                    "": string
                }
                Returns: number
            }
            vector_out: {
                Args: {
                    "": string
                }
                Returns: unknown
            }
            vector_send: {
                Args: {
                    "": string
                }
                Returns: string
            }
            vector_typmod_in: {
                Args: {
                    "": unknown[]
                }
                Returns: number
            }
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}

export type Tables<
    PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
            Row: infer R
        }
    ? R
    : never
    : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
        Database["public"]["Views"])
    ? (Database["public"]["Tables"] &
        Database["public"]["Views"])[PublicTableNameOrOptions] extends {
            Row: infer R
        }
    ? R
    : never
    : never

export type TablesInsert<
    PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Insert: infer I
    }
    ? I
    : never
    : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
    }
    ? I
    : never
    : never

export type TablesUpdate<
    PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Update: infer U
    }
    ? U
    : never
    : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
    }
    ? U
    : never
    : never

export type Enums<
    DefaultSchemaEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
    EnumName extends DefaultSchemaEnumNameOrOptions extends {
        schema: keyof Database
    }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
    ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
    : DefaultSchemaEnumNameOrOptions extends keyof Database["public"]["Enums"]
    ? Database["public"]["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
    PublicCompositeTypeNameOrOptions extends
    | keyof Database["public"]["CompositeTypes"]
    | { schema: keyof Database },
    CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
        schema: keyof Database
    }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
    ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
    : PublicCompositeTypeNameOrOptions extends keyof Database["public"]["CompositeTypes"]
    ? Database["public"]["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
