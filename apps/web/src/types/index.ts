// ── Database row types ──────────────────────────────────────────────────────

export interface Profile {
  id: string;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
  timezone: string;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface ApiService {
  id: string;
  user_id: string;
  provider: string;
  name: string;
  category: string;
  website: string | null;
  api_key_encrypted: string | null;
  environment: 'development' | 'staging' | 'production';
  status: 'active' | 'inactive' | 'expired' | 'revoked';
  token_limit: number;
  tokens_used: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  api_id: string | null;
  plan_name: string;
  price: number;
  currency: string;
  billing_cycle: 'monthly' | 'quarterly' | 'yearly' | 'one-time';
  start_date: string;
  renewal_date: string | null;
  auto_renew: boolean;
  status: 'active' | 'inactive' | 'cancelled' | 'expired';
  payment_method: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  api_service?: ApiService;
}

export interface UsageLog {
  id: string;
  api_id: string;
  user_id: string;
  date: string;
  requests: number;
  tokens_used: number;
  credits_used: number;
  cost: number;
  created_at: string;
  // Joined fields
  api_service?: ApiService;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'renewal' | 'usage_warning' | 'token_limit' | 'system' | 'security';
  title: string;
  message: string;
  is_read: boolean;
  link: string | null;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  usage_warning_threshold: number;
  usage_critical_threshold: number;
  email_notifications: boolean;
  renewal_reminder_days: number;
  theme: 'light' | 'dark' | 'system';
  created_at: string;
  updated_at: string;
}

// ── Form types ──────────────────────────────────────────────────────────────

export interface ApiServiceFormData {
  provider: string;
  name: string;
  category: string;
  website?: string;
  environment: 'development' | 'staging' | 'production';
  api_key?: string;
  token_limit?: number;
  notes?: string;
}

export interface SubscriptionFormData {
  api_id?: string;
  plan_name: string;
  price: number;
  currency: string;
  billing_cycle: 'monthly' | 'quarterly' | 'yearly' | 'one-time';
  start_date: string;
  renewal_date?: string;
  auto_renew: boolean;
  payment_method?: string;
}

export interface UsageLogFormData {
  api_id: string;
  date: string;
  requests?: number;
  tokens_used?: number;
  credits_used?: number;
  cost?: number;
}

// ── Dashboard types ─────────────────────────────────────────────────────────

export interface DashboardStats {
  totalApis: number;
  apisAddedThisMonth: number;
  monthlySpend: number;
  spendChange: number;
  activeSubscriptions: number;
  renewingSoon: number;
  averageUsage: number;
  usageChange: number;
}

export interface SpendingByCategory {
  category: string;
  amount: number;
  color: string;
}

export interface MonthlySpending {
  month: string;
  amount: number;
}

export interface UsageTrend {
  date: string;
  requests: number;
  tokens: number;
  credits: number;
}

// ── API response types ──────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  code?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
