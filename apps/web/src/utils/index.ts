import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = 'INR'): string {
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}

export function formatNumber(num: number): string {
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toLocaleString('en-IN');
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function maskApiKey(key: string | null): string {
  if (!key) return '••••••••••••••••';
  const prefix = key.substring(0, 7);
  return `${prefix}${'•'.repeat(20)}`;
}

export function getUsageLevel(percentage: number, warningThreshold = 70, criticalThreshold = 90): 'normal' | 'warning' | 'critical' {
  if (percentage >= criticalThreshold) return 'critical';
  if (percentage >= warningThreshold) return 'warning';
  return 'normal';
}

export function getUsageLevelColor(level: 'normal' | 'warning' | 'critical'): string {
  switch (level) {
    case 'critical': return 'text-red-600';
    case 'warning': return 'text-amber-600';
    default: return 'text-emerald-600';
  }
}

export function getUsageBarColor(level: 'normal' | 'warning' | 'critical'): string {
  switch (level) {
    case 'critical': return 'bg-gradient-to-r from-red-500 to-rose-600';
    case 'warning': return 'bg-gradient-to-r from-amber-500 to-orange-500';
    default: return 'bg-gradient-to-r from-indigo-500 to-indigo-600';
  }
}

export function getDaysUntil(dateString: string | null): number | null {
  if (!dateString) return null;
  const target = new Date(dateString);
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function getInitials(name: string | null): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
