export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string | null
          avatar_color: string | null
          household_id: string | null
          created_at: string | null
        }
        Insert: {
          id: string
          name?: string | null
          avatar_color?: string | null
          household_id?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string | null
          avatar_color?: string | null
          household_id?: string | null
          created_at?: string | null
        }
      }
      households: {
        Row: {
          id: string
          name: string | null
          invite_code: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          name?: string | null
          invite_code?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string | null
          invite_code?: string | null
          created_at?: string | null
        }
      }
      routine_blocks: {
        Row: {
          id: string
          household_id: string | null
          name: string | null
          category: string | null
          person: string | null
          start_time: string | null
          duration_minutes: number | null
          frequency: string | null
          active: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          household_id?: string | null
          name?: string | null
          category?: string | null
          person?: string | null
          start_time?: string | null
          duration_minutes?: number | null
          frequency?: string | null
          active?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          household_id?: string | null
          name?: string | null
          category?: string | null
          person?: string | null
          start_time?: string | null
          duration_minutes?: number | null
          frequency?: string | null
          active?: boolean | null
          created_at?: string | null
        }
      }
      day_blocks: {
        Row: {
          id: string
          household_id: string | null
          profile_id: string | null
          routine_block_id: string | null
          name: string | null
          category: string | null
          date: string | null
          planned_start: string | null
          actual_start: string | null
          planned_duration: number | null
          actual_duration: number | null
          status: string | null
          notes: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          household_id?: string | null
          profile_id?: string | null
          routine_block_id?: string | null
          name?: string | null
          category?: string | null
          date?: string | null
          planned_start?: string | null
          actual_start?: string | null
          planned_duration?: number | null
          actual_duration?: number | null
          status?: string | null
          notes?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          household_id?: string | null
          profile_id?: string | null
          routine_block_id?: string | null
          name?: string | null
          category?: string | null
          date?: string | null
          planned_start?: string | null
          actual_start?: string | null
          planned_duration?: number | null
          actual_duration?: number | null
          status?: string | null
          notes?: string | null
          created_at?: string | null
        }
      }
      sleep_logs: {
        Row: {
          id: string
          profile_id: string | null
          date: string | null
          sleep_time: string | null
          wake_time: string | null
          quality: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          profile_id?: string | null
          date?: string | null
          sleep_time?: string | null
          wake_time?: string | null
          quality?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          profile_id?: string | null
          date?: string | null
          sleep_time?: string | null
          wake_time?: string | null
          quality?: number | null
          created_at?: string | null
        }
      }
      market_items: {
        Row: {
          id: string
          household_id: string | null
          name: string | null
          quantity: string | null
          checked: boolean | null
          added_by: string | null
          checked_by: string | null
          checked_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          household_id?: string | null
          name?: string | null
          quantity?: string | null
          checked?: boolean | null
          added_by?: string | null
          checked_by?: string | null
          checked_at?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          household_id?: string | null
          name?: string | null
          quantity?: string | null
          checked?: boolean | null
          added_by?: string | null
          checked_by?: string | null
          checked_at?: string | null
          created_at?: string | null
        }
      }
    }
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Household = Database['public']['Tables']['households']['Row']
export type RoutineBlock = Database['public']['Tables']['routine_blocks']['Row']
export type DayBlock = Database['public']['Tables']['day_blocks']['Row']
export type SleepLog = Database['public']['Tables']['sleep_logs']['Row']
export type MarketItem = Database['public']['Tables']['market_items']['Row']
