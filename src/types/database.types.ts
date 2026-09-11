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
      addresses: {
        Row: {
          citizen_id: string
          city: string
          created_at: string
          id: string
          is_default: boolean
          label: string
          lat: number | null
          line1: string
          line2: string | null
          lng: number | null
          pincode: string
          state: string
        }
        Insert: {
          citizen_id: string
          city: string
          created_at?: string
          id?: string
          is_default?: boolean
          label?: string
          lat?: number | null
          line1: string
          line2?: string | null
          lng?: number | null
          pincode: string
          state: string
        }
        Update: {
          citizen_id?: string
          city?: string
          created_at?: string
          id?: string
          is_default?: boolean
          label?: string
          lat?: number | null
          line1?: string
          line2?: string | null
          lng?: number | null
          pincode?: string
          state?: string
        }
        Relationships: [
          {
            foreignKeyName: "addresses_citizen_id_fkey"
            columns: ["citizen_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          actor_role: Database["public"]["Enums"]["app_role"] | null
          after_data: Json | null
          before_data: Json | null
          client_operation_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          organization_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_role?: Database["public"]["Enums"]["app_role"] | null
          after_data?: Json | null
          before_data?: Json | null
          client_operation_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          organization_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_role?: Database["public"]["Enums"]["app_role"] | null
          after_data?: Json | null
          before_data?: Json | null
          client_operation_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          organization_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_campaigns: {
        Row: {
          bonus_amount: number
          brand_org_id: string
          budget: number | null
          created_at: string
          end_date: string | null
          id: string
          is_active: boolean
          name: string
          region: string | null
          start_date: string | null
        }
        Insert: {
          bonus_amount?: number
          brand_org_id: string
          budget?: number | null
          created_at?: string
          end_date?: string | null
          id?: string
          is_active?: boolean
          name: string
          region?: string | null
          start_date?: string | null
        }
        Update: {
          bonus_amount?: number
          brand_org_id?: string
          budget?: number | null
          created_at?: string
          end_date?: string | null
          id?: string
          is_active?: boolean
          name?: string
          region?: string | null
          start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brand_campaigns_brand_org_id_fkey"
            columns: ["brand_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_evidence: {
        Row: {
          collection_record_id: string
          created_at: string
          created_by: string
          file_hash: string
          file_size: number | null
          id: string
          kind: Database["public"]["Enums"]["evidence_kind"]
          mime_type: string | null
          storage_path: string
        }
        Insert: {
          collection_record_id: string
          created_at?: string
          created_by: string
          file_hash: string
          file_size?: number | null
          id?: string
          kind?: Database["public"]["Enums"]["evidence_kind"]
          mime_type?: string | null
          storage_path: string
        }
        Update: {
          collection_record_id?: string
          created_at?: string
          created_by?: string
          file_hash?: string
          file_size?: number | null
          id?: string
          kind?: Database["public"]["Enums"]["evidence_kind"]
          mime_type?: string | null
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_evidence_collection_record_id_fkey"
            columns: ["collection_record_id"]
            isOneToOne: false
            referencedRelation: "collection_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_evidence_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_records: {
        Row: {
          actual_weight_kg: number | null
          client_operation_id: string | null
          collector_id: string
          completed_at: string | null
          created_at: string
          gps_accuracy: number | null
          gps_lat: number | null
          gps_lng: number | null
          id: string
          notes: string | null
          otp_code: string | null
          otp_verified_at: string | null
          pickup_request_id: string
          updated_at: string
          voice_note_path: string | null
        }
        Insert: {
          actual_weight_kg?: number | null
          client_operation_id?: string | null
          collector_id: string
          completed_at?: string | null
          created_at?: string
          gps_accuracy?: number | null
          gps_lat?: number | null
          gps_lng?: number | null
          id?: string
          notes?: string | null
          otp_code?: string | null
          otp_verified_at?: string | null
          pickup_request_id: string
          updated_at?: string
          voice_note_path?: string | null
        }
        Update: {
          actual_weight_kg?: number | null
          client_operation_id?: string | null
          collector_id?: string
          completed_at?: string | null
          created_at?: string
          gps_accuracy?: number | null
          gps_lat?: number | null
          gps_lng?: number | null
          id?: string
          notes?: string | null
          otp_code?: string | null
          otp_verified_at?: string | null
          pickup_request_id?: string
          updated_at?: string
          voice_note_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collection_records_collector_id_fkey"
            columns: ["collector_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_records_pickup_request_id_fkey"
            columns: ["pickup_request_id"]
            isOneToOne: true
            referencedRelation: "pickup_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      collector_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          collector_id: string
          id: string
          otp_code: string | null
          pickup_request_id: string
          responded_at: string | null
          status: Database["public"]["Enums"]["assignment_status"]
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          collector_id: string
          id?: string
          otp_code?: string | null
          pickup_request_id: string
          responded_at?: string | null
          status?: Database["public"]["Enums"]["assignment_status"]
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          collector_id?: string
          id?: string
          otp_code?: string | null
          pickup_request_id?: string
          responded_at?: string | null
          status?: Database["public"]["Enums"]["assignment_status"]
        }
        Relationships: [
          {
            foreignKeyName: "collector_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collector_assignments_collector_id_fkey"
            columns: ["collector_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collector_assignments_pickup_request_id_fkey"
            columns: ["pickup_request_id"]
            isOneToOne: false
            referencedRelation: "pickup_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      collector_profiles: {
        Row: {
          acceptance_rate: number
          aggregator_org_id: string | null
          created_at: string
          id: string
          is_online: boolean
          rating: number
          service_zone: string | null
          total_collections: number
          vehicle_type: string | null
        }
        Insert: {
          acceptance_rate?: number
          aggregator_org_id?: string | null
          created_at?: string
          id: string
          is_online?: boolean
          rating?: number
          service_zone?: string | null
          total_collections?: number
          vehicle_type?: string | null
        }
        Update: {
          acceptance_rate?: number
          aggregator_org_id?: string | null
          created_at?: string
          id?: string
          is_online?: boolean
          rating?: number
          service_zone?: string | null
          total_collections?: number
          vehicle_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collector_profiles_aggregator_org_id_fkey"
            columns: ["aggregator_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collector_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      evidence_hashes: {
        Row: {
          computed_at: string
          computed_from: Json
          hash: string
          id: string
          pickup_request_id: string
        }
        Insert: {
          computed_at?: string
          computed_from: Json
          hash: string
          id?: string
          pickup_request_id: string
        }
        Update: {
          computed_at?: string
          computed_from?: Json
          hash?: string
          id?: string
          pickup_request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "evidence_hashes_pickup_request_id_fkey"
            columns: ["pickup_request_id"]
            isOneToOne: false
            referencedRelation: "pickup_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      material_recovery: {
        Row: {
          created_at: string
          id: string
          material_type: string
          processing_record_id: string
          recovered_weight_kg: number
        }
        Insert: {
          created_at?: string
          id?: string
          material_type: string
          processing_record_id: string
          recovered_weight_kg?: number
        }
        Update: {
          created_at?: string
          id?: string
          material_type?: string
          processing_record_id?: string
          recovered_weight_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "material_recovery_processing_record_id_fkey"
            columns: ["processing_record_id"]
            isOneToOne: false
            referencedRelation: "processing_records"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          is_read: boolean
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean
          title?: string
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
        ]
      }
      organizations: {
        Row: {
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          id: string
          name: string
          service_zone: string | null
          type: Database["public"]["Enums"]["org_type"]
        }
        Insert: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          name: string
          service_zone?: string | null
          type: Database["public"]["Enums"]["org_type"]
        }
        Update: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          name?: string
          service_zone?: string | null
          type?: Database["public"]["Enums"]["org_type"]
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          citizen_id: string
          created_at: string
          id: string
          is_demo: boolean
          pickup_request_id: string
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
        }
        Insert: {
          amount: number
          citizen_id: string
          created_at?: string
          id?: string
          is_demo?: boolean
          pickup_request_id: string
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          citizen_id?: string
          created_at?: string
          id?: string
          is_demo?: boolean
          pickup_request_id?: string
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_citizen_id_fkey"
            columns: ["citizen_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_pickup_request_id_fkey"
            columns: ["pickup_request_id"]
            isOneToOne: false
            referencedRelation: "pickup_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      pickup_items: {
        Row: {
          brand: string | null
          category_id: string
          condition: string
          created_at: string
          description: string | null
          estimated_weight_kg: number
          id: string
          model: string | null
          pickup_request_id: string
          quantity: number
        }
        Insert: {
          brand?: string | null
          category_id: string
          condition?: string
          created_at?: string
          description?: string | null
          estimated_weight_kg?: number
          id?: string
          model?: string | null
          pickup_request_id: string
          quantity?: number
        }
        Update: {
          brand?: string | null
          category_id?: string
          condition?: string
          created_at?: string
          description?: string | null
          estimated_weight_kg?: number
          id?: string
          model?: string | null
          pickup_request_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "pickup_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "waste_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pickup_items_pickup_request_id_fkey"
            columns: ["pickup_request_id"]
            isOneToOne: false
            referencedRelation: "pickup_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      pickup_requests: {
        Row: {
          address_id: string
          aggregator_org_id: string | null
          citizen_id: string
          collection_code: string
          created_at: string
          created_by: string
          estimated_value_max: number
          estimated_value_min: number
          estimated_weight_kg: number
          id: string
          locked_at: string | null
          notes: string | null
          payment_preference: string
          scheduled_date: string
          scheduled_slot: string
          status: Database["public"]["Enums"]["pickup_status"]
          updated_at: string
        }
        Insert: {
          address_id: string
          aggregator_org_id?: string | null
          citizen_id: string
          collection_code?: string
          created_at?: string
          created_by: string
          estimated_value_max?: number
          estimated_value_min?: number
          estimated_weight_kg?: number
          id?: string
          locked_at?: string | null
          notes?: string | null
          payment_preference?: string
          scheduled_date: string
          scheduled_slot: string
          status?: Database["public"]["Enums"]["pickup_status"]
          updated_at?: string
        }
        Update: {
          address_id?: string
          aggregator_org_id?: string | null
          citizen_id?: string
          collection_code?: string
          created_at?: string
          created_by?: string
          estimated_value_max?: number
          estimated_value_min?: number
          estimated_weight_kg?: number
          id?: string
          locked_at?: string | null
          notes?: string | null
          payment_preference?: string
          scheduled_date?: string
          scheduled_slot?: string
          status?: Database["public"]["Enums"]["pickup_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pickup_requests_address_id_fkey"
            columns: ["address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pickup_requests_aggregator_org_id_fkey"
            columns: ["aggregator_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pickup_requests_citizen_id_fkey"
            columns: ["citizen_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pickup_requests_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      processing_records: {
        Row: {
          id: string
          pickup_request_id: string
          shipment_id: string | null
          stage: Database["public"]["Enums"]["processing_stage"]
          updated_at: string
          updated_by: string
        }
        Insert: {
          id?: string
          pickup_request_id: string
          shipment_id?: string | null
          stage?: Database["public"]["Enums"]["processing_stage"]
          updated_at?: string
          updated_by: string
        }
        Update: {
          id?: string
          pickup_request_id?: string
          shipment_id?: string | null
          stage?: Database["public"]["Enums"]["processing_stage"]
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "processing_records_pickup_request_id_fkey"
            columns: ["pickup_request_id"]
            isOneToOne: false
            referencedRelation: "pickup_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processing_records_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "recycler_shipments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processing_records_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          is_active: boolean
          organization_id: string | null
          phone: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name: string
          id: string
          is_active?: boolean
          organization_id?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          organization_id?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ratings: {
        Row: {
          collector_id: string
          comment: string | null
          created_at: string
          id: string
          pickup_request_id: string
          rated_by: string
          stars: number
        }
        Insert: {
          collector_id: string
          comment?: string | null
          created_at?: string
          id?: string
          pickup_request_id: string
          rated_by: string
          stars: number
        }
        Update: {
          collector_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          pickup_request_id?: string
          rated_by?: string
          stars?: number
        }
        Relationships: [
          {
            foreignKeyName: "ratings_collector_id_fkey"
            columns: ["collector_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_pickup_request_id_fkey"
            columns: ["pickup_request_id"]
            isOneToOne: false
            referencedRelation: "pickup_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_rated_by_fkey"
            columns: ["rated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      recycler_receipts: {
        Row: {
          discrepancy_notes: string | null
          id: string
          received_at: string
          received_by: string
          received_weight_kg: number
          shipment_id: string
        }
        Insert: {
          discrepancy_notes?: string | null
          id?: string
          received_at?: string
          received_by: string
          received_weight_kg: number
          shipment_id: string
        }
        Update: {
          discrepancy_notes?: string | null
          id?: string
          received_at?: string
          received_by?: string
          received_weight_kg?: number
          shipment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recycler_receipts_received_by_fkey"
            columns: ["received_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recycler_receipts_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: true
            referencedRelation: "recycler_shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      recycler_shipments: {
        Row: {
          aggregator_org_id: string
          created_at: string
          created_by: string
          expected_weight_kg: number
          id: string
          recycler_org_id: string
          shipment_code: string
          status: string
        }
        Insert: {
          aggregator_org_id: string
          created_at?: string
          created_by: string
          expected_weight_kg?: number
          id?: string
          recycler_org_id: string
          shipment_code: string
          status?: string
        }
        Update: {
          aggregator_org_id?: string
          created_at?: string
          created_by?: string
          expected_weight_kg?: number
          id?: string
          recycler_org_id?: string
          shipment_code?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "recycler_shipments_aggregator_org_id_fkey"
            columns: ["aggregator_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recycler_shipments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recycler_shipments_recycler_org_id_fkey"
            columns: ["recycler_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      shipment_items: {
        Row: {
          id: string
          pickup_request_id: string
          shipment_id: string
        }
        Insert: {
          id?: string
          pickup_request_id: string
          shipment_id: string
        }
        Update: {
          id?: string
          pickup_request_id?: string
          shipment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipment_items_pickup_request_id_fkey"
            columns: ["pickup_request_id"]
            isOneToOne: false
            referencedRelation: "pickup_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipment_items_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "recycler_shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      verification_records: {
        Row: {
          aggregator_org_id: string
          created_at: string
          fraud_score: number
          id: string
          notes: string | null
          pickup_request_id: string
          status: Database["public"]["Enums"]["verification_status"]
          verified_by: string
          verified_weight_kg: number
        }
        Insert: {
          aggregator_org_id: string
          created_at?: string
          fraud_score?: number
          id?: string
          notes?: string | null
          pickup_request_id: string
          status?: Database["public"]["Enums"]["verification_status"]
          verified_by: string
          verified_weight_kg: number
        }
        Update: {
          aggregator_org_id?: string
          created_at?: string
          fraud_score?: number
          id?: string
          notes?: string | null
          pickup_request_id?: string
          status?: Database["public"]["Enums"]["verification_status"]
          verified_by?: string
          verified_weight_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "verification_records_aggregator_org_id_fkey"
            columns: ["aggregator_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verification_records_pickup_request_id_fkey"
            columns: ["pickup_request_id"]
            isOneToOne: true
            referencedRelation: "pickup_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verification_records_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          kind: string
          pickup_request_id: string | null
          wallet_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          kind: string
          pickup_request_id?: string | null
          wallet_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          kind?: string
          pickup_request_id?: string | null
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_pickup_request_id_fkey"
            columns: ["pickup_request_id"]
            isOneToOne: false
            referencedRelation: "pickup_requests"
            referencedColumns: ["id"]
          },
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
          eco_points: number
          id: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          balance?: number
          eco_points?: number
          id?: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          balance?: number
          eco_points?: number
          id?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallets_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      waste_categories: {
        Row: {
          base_price_per_kg: number
          description: string | null
          icon: string | null
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          base_price_per_kg?: number
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          base_price_per_kg?: number
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_create_staff_user: {
        Args: {
          p_email: string
          p_password: string
          p_full_name: string
          p_role: Database["public"]["Enums"]["app_role"]
          p_organization_id: string | null
          p_phone: string | null
        }
        Returns: string
      }
      compute_fraud_score: {
        Args: { p_pickup_id: string }
        Returns: number
      }
      create_pickup_request: {
        Args: {
          p_address_id: string
          p_scheduled_date: string
          p_scheduled_slot: string
          p_payment_preference: string
          p_notes: string | null
          p_items: Json
        }
        Returns: string
      }
      current_org_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      current_profile_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["app_role"]
      }
      current_role_is: {
        Args: { r: Database["public"]["Enums"]["app_role"] }
        Returns: boolean
      }
      get_integrity_record: {
        Args: { p_collection_code: string }
        Returns: Json
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      register_citizen: {
        Args: {
          p_email: string
          p_password: string
          p_full_name: string
          p_phone: string | null
        }
        Returns: string
      }
    }
    Enums: {
      app_role:
        | "CITIZEN"
        | "COLLECTOR"
        | "AGGREGATOR"
        | "RECYCLER"
        | "BRAND"
        | "ADMIN"
      assignment_status: "OFFERED" | "ACCEPTED" | "REJECTED" | "EXPIRED"
      evidence_kind: "PHOTO" | "VOICE"
      org_type: "AGGREGATOR" | "RECYCLER" | "BRAND"
      payment_status:
        | "CREATED"
        | "PROCESSING"
        | "SUCCESS"
        | "FAILED"
        | "REFUNDED"
        | "CANCELLED"
      pickup_status:
        | "REQUESTED"
        | "ASSIGNED"
        | "COLLECTOR_ACCEPTED"
        | "EN_ROUTE"
        | "ARRIVED"
        | "COLLECTED"
        | "AGGREGATOR_VERIFIED"
        | "IN_TRANSIT_TO_RECYCLER"
        | "RECYCLER_RECEIVED"
        | "PROCESSING"
        | "COMPLETED"
        | "REJECTED"
        | "CANCELLED"
      processing_stage:
        | "RECEIVED"
        | "INSPECTED"
        | "DISMANTLED"
        | "MATERIAL_SEPARATED"
        | "PROCESSED"
        | "COMPLETED"
      verification_status: "VERIFIED" | "REJECTED" | "NEEDS_REVIEW"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: [
        "CITIZEN",
        "COLLECTOR",
        "AGGREGATOR",
        "RECYCLER",
        "BRAND",
        "ADMIN",
      ],
      assignment_status: ["OFFERED", "ACCEPTED", "REJECTED", "EXPIRED"],
      evidence_kind: ["PHOTO", "VOICE"],
      org_type: ["AGGREGATOR", "RECYCLER", "BRAND"],
      payment_status: [
        "CREATED",
        "PROCESSING",
        "SUCCESS",
        "FAILED",
        "REFUNDED",
        "CANCELLED",
      ],
      pickup_status: [
        "REQUESTED",
        "ASSIGNED",
        "COLLECTOR_ACCEPTED",
        "EN_ROUTE",
        "ARRIVED",
        "COLLECTED",
        "AGGREGATOR_VERIFIED",
        "IN_TRANSIT_TO_RECYCLER",
        "RECYCLER_RECEIVED",
        "PROCESSING",
        "COMPLETED",
        "REJECTED",
        "CANCELLED",
      ],
      processing_stage: [
        "RECEIVED",
        "INSPECTED",
        "DISMANTLED",
        "MATERIAL_SEPARATED",
        "PROCESSED",
        "COMPLETED",
      ],
      verification_status: ["VERIFIED", "REJECTED", "NEEDS_REVIEW"],
    },
  },
} as const
