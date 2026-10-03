export const APP_NAME = 'API Tracker';
export const DEFAULT_CURRENCY = 'INR';

export const CATEGORIES = [
  'AI',
  'Cloud',
  'Database',
  'Payments',
  'Communication',
  'Analytics',
  'Storage',
  'Authentication',
  'Other',
] as const;

export const ENVIRONMENTS = ['development', 'staging', 'production'] as const;

export const BILLING_CYCLES = ['monthly', 'quarterly', 'yearly', 'one-time'] as const;

export const SERVICE_STATUSES = ['active', 'inactive', 'expired', 'revoked'] as const;

export const SUBSCRIPTION_STATUSES = ['active', 'inactive', 'cancelled', 'expired'] as const;

export const NOTIFICATION_TYPES = ['renewal', 'usage_warning', 'token_limit', 'system', 'security'] as const;

export const CATEGORY_COLORS: Record<string, string> = {
  AI: '#6366F1',
  Cloud: '#14B8A6',
  Database: '#F59E0B',
  Payments: '#10B981',
  Communication: '#EF4444',
  Analytics: '#8B5CF6',
  Storage: '#EC4899',
  Authentication: '#06B6D4',
  Other: '#64748B',
};

export const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string; glow: string }> = {
  active: {
    bg: 'bg-emerald-500/10 border-emerald-500/20',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
    glow: 'shadow-[0_0_8px_rgba(16,185,129,0.3)]',
  },
  inactive: {
    bg: 'bg-slate-500/10 border-slate-500/20',
    text: 'text-slate-700',
    dot: 'bg-slate-400',
    glow: '',
  },
  expired: {
    bg: 'bg-red-500/10 border-red-500/20',
    text: 'text-red-700',
    dot: 'bg-red-500',
    glow: 'shadow-[0_0_8px_rgba(239,68,68,0.3)]',
  },
  revoked: {
    bg: 'bg-red-500/10 border-red-500/20',
    text: 'text-red-700',
    dot: 'bg-red-500',
    glow: 'shadow-[0_0_8px_rgba(239,68,68,0.3)]',
  },
  cancelled: {
    bg: 'bg-amber-500/10 border-amber-500/20',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
    glow: 'shadow-[0_0_8px_rgba(245,158,11,0.3)]',
  },
};

export const DEFAULT_USAGE_THRESHOLDS = {
  normal: 70,
  warning: 90,
} as const;

export const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
};
