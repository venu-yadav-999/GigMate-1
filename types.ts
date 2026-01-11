
export type PlatformName = 'Swiggy' | 'Zomato' | 'Uber' | 'Rapido' | 'Zepto' | 'Blinkit' | string;

export type Language = 'en' | 'hi' | 'ta' | 'te' | 'bn' | 'mr' | 'gu' | 'kn' | 'ml' | 'pa';

export type Theme = 'light' | 'dark';

export type VehicleType = 'bike' | 'scooter' | 'car' | 'cycle' | 'walk' | 'other';

export type VerificationStatus = 'pending' | 'verified' | 'rejected' | 'under_review';

export type AccountStatus = 'active' | 'suspended' | 'deactivated' | 'pending_kyc';

export interface DBUser {
  id: number;
  uid: string;
  phone_number: string;
  country_code: string;
  email?: string;
  full_name?: string;
  profile_picture_url?: string;
  date_of_birth?: string;
  gender: 'male' | 'female' | 'other';
  preferred_language: Language;
  vehicle_type: VehicleType;
  vehicle_number?: string;
  vehicle_brand?: string;
  vehicle_model?: string;
  vehicle_year?: number;
  driving_license_number?: string;
  aadhaar_number?: string;
  pan_number?: string;
  city?: string;
  state?: string;
  pincode?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  is_verified: boolean;
  verification_status: VerificationStatus;
  account_status: AccountStatus;
  referral_code?: string;
  referred_by?: number;
  total_referrals: number;
  gig_score: number;
  total_earnings: number;
  total_expenses: number;
  net_savings: number;
  average_daily_earnings: number;
  average_weekly_hours: number;
  premium_member: boolean;
  premium_expiry_date?: string;
  created_at: string;
  updated_at: string;
  last_active_at?: string;
}

export interface GigPlatform {
  id: number;
  platform_name: PlatformName;
  platform_type: 'food_delivery' | 'ride_hailing' | 'courier' | 'freelance' | 'home_services' | 'retail' | 'other';
  logo_url?: string;
  website_url?: string;
  api_documentation_url?: string;
  auth_type: 'oauth' | 'api_key' | 'screen_scraping' | 'manual';
  is_active: boolean;
  commission_rate?: number;
  min_payout_amount?: number;
  payout_frequency?: 'daily' | 'weekly' | 'bi_weekly' | 'monthly';
  created_at: string;
}

export interface UserPlatformProfile {
  id: number;
  user_id: number;
  platform_id: number;
  platform_user_id?: string;
  platform_username?: string;
  platform_email?: string;
  platform_phone?: string;
  is_connected: boolean;
  connection_method: 'api' | 'screen_scrape' | 'manual' | 'sms_parsing';
  last_sync_at?: string;
  sync_status: 'success' | 'failed' | 'pending' | 'in_progress';
  sync_error_message?: string;
  total_earnings_from_platform: number;
  total_trips_completed: number;
  platform_rating: number;
  is_primary_platform: boolean;
  working_hours_per_week: number;
  average_daily_trips: number;
  preferred_working_hours?: {
    morning: boolean;
    afternoon: boolean;
    evening: boolean;
    night: boolean;
  };
  preferred_zones?: string[];
}

export type Platform = PlatformName;
export type Vehicle = VehicleType;

export interface EarningEntry {
  id: string;
  user_id?: number;
  platform_profile_id?: number;
  earning_category_id?: number;
  transaction_id?: string;
  trip_id?: string;
  amount: number;
  currency?: string;
  base_fare?: number;
  distance_fare?: number;
  time_fare?: number;
  incentive?: number;
  tip?: number;
  promotion_bonus?: number;
  platform_commission?: number;
  tax_deducted?: number;
  net_amount?: number;
  distance_km?: number;
  duration_minutes?: number;
  durationHours?: number; // UI legacy
  orders?: number; // UI legacy
  date?: string; // UI legacy
  platform: Platform; // UI legacy
  start_location?: string;
  end_location?: string;
  customer_rating?: number;
  payment_method?: 'cash' | 'online' | 'wallet' | 'card' | 'upi';
  payment_status?: 'pending' | 'completed' | 'failed' | 'cancelled';
  transaction_date?: string;
  sync_method?: 'api' | 'screen_scrape' | 'manual' | 'sms' | 'email';
  importMethod?: string; // UI legacy
  is_verified?: boolean;
  created_at?: string;
}

export interface ExpenseEntry {
  id: string;
  user_id?: number;
  expense_category_id?: number;
  amount: number;
  currency?: string;
  description?: string;
  vendor_name?: string;
  category: 'Fuel' | 'Maintenance' | 'Internet' | 'Other' | string; // UI legacy
  date: string; // UI legacy
  payment_method?: 'cash' | 'upi' | 'card' | 'wallet' | 'credit';
  recurring?: boolean;
  recurring_frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  next_due_date?: string;
  receipt_image_url?: string;
  is_verified?: boolean;
  expense_date?: string;
  created_at?: string;
}

export interface LoanProduct {
  id: number;
  partner_id: number;
  product_name: string;
  product_type: 'emergency' | 'vehicle' | 'education' | 'medical' | 'personal';
  min_amount: number;
  max_amount: number;
  min_tenure_months: number;
  max_tenure_months: number;
  interest_rate_min: number;
  interest_rate_max: number;
  min_gig_score: number;
  is_active: boolean;
}

export interface UserLoan {
  id: number;
  user_id: number;
  loan_product_id: number;
  loan_amount: number;
  approved_amount?: number;
  interest_rate?: number;
  tenure_months: number;
  emi_amount?: number;
  status: 'draft' | 'applied' | 'under_review' | 'approved' | 'rejected' | 'disbursed' | 'active' | 'closed' | 'defaulted';
  next_emi_date?: string;
  amount_paid: number;
  amount_due: number;
}

export interface SavingsGoal {
  id: number;
  user_id: number;
  goal_name: string;
  goal_type: 'emergency' | 'vehicle' | 'education' | 'home' | 'vacation' | 'other';
  target_amount: number;
  current_amount: number;
  target_date?: string;
  auto_save_enabled: boolean;
  auto_save_percent?: number;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  completion_percent: number;
}

export interface Hotspot {
  area: string;
  intensity: number;
  demandReason: string;
  expectedIncentive: string;
  distance: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export interface Course {
  id: number;
  course_title: string;
  course_subtitle?: string;
  category: 'language' | 'driving' | 'digital_literacy' | 'financial_literacy' | 'customer_service' | 'safety' | 'entrepreneurship';
  level: 'beginner' | 'intermediate' | 'advanced';
  duration_hours?: number;
  video_url?: string;
  thumbnail_url?: string;
  price: number;
  discount_percent: number;
  final_price: number;
  language: string;
  average_rating: number;
  total_enrollments: number;
}

export enum AppTab {
  DASHBOARD = 'dashboard',
  EARNINGS = 'earnings',
  MAP = 'map',
  FINANCE = 'finance',
  CAREER = 'career'
}

export type AppView = 'AUTH' | 'ONBOARDING' | 'MAIN' | 'PROFILE_DETAILS' | 'PROFILE_EDIT';

export interface AnalyticsEvent {
  eventName: string;
  params?: Record<string, any>;
  timestamp: string;
}

// Preserve some legacy UI types for compatibility
export interface UserProfile {
  phoneNumber: string;
  name?: string;
  email?: string;
  city?: string;
  language: Language;
  platforms: PlatformName[];
  vehicle: VehicleType;
  dailyGoal: number;
  hoursPreference: string;
  theme: Theme;
}
