import React, { useEffect, useState, useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import {
  KeyRound,
  CreditCard,
  Activity,
  ArrowUpRight,
  Plus,
  AlertTriangle,
  Clock,
  Sparkles,
  TrendingUp,
  Zap,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useAuth } from '../../hooks/useAuth';
import { apiServicesService } from '../../services/api-services';
import { subscriptionsService } from '../../services/subscriptions';
import { usageService } from '../../services/usage';
import type { ApiService, Subscription, UsageLog } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import {
  formatCurrency,
  formatNumber,
  formatPercentage,
  getGreeting,
  getDaysUntil,
} from '../../utils';
import { CATEGORY_COLORS } from '../../constants';

export const DashboardPage: React.FC = () => {
  const { profile, user } = useAuth();
  const [apis, setApis] = useState<ApiService[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [usageLogs, setUsageLogs] = useState<UsageLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [usageMetric, setUsageMetric] = useState<'tokens' | 'requests' | 'cost'>('tokens');

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        const [apiData, subData, logsData] = await Promise.all([
          apiServicesService.getAll(),
          subscriptionsService.getAll(),
          usageService.getAll(),
        ]);
        setApis(apiData);
        setSubscriptions(subData);
        setUsageLogs(logsData);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  // ── KPI Calculations ──────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const totalApis = apis.length;
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // APIs added this month
    const addedThisMonth = apis.filter((a) => {
      const d = new Date(a.created_at);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).length;

    // Monthly Spend from active subscriptions in INR
    const monthlySpend = subscriptions.reduce((acc, sub) => {
      if (sub.status !== 'active') return acc;
      if (sub.billing_cycle === 'monthly') return acc + Number(sub.price);
      if (sub.billing_cycle === 'yearly') return acc + Number(sub.price) / 12;
      if (sub.billing_cycle === 'quarterly') return acc + Number(sub.price) / 3;
      return acc;
    }, 0);

    // Active subscriptions & Renewals in next 7 days
    const activeSubs = subscriptions.filter((s) => s.status === 'active');
    const renewingSoon = activeSubs.filter((s) => {
      const days = getDaysUntil(s.renewal_date);
      return days !== null && days >= 0 && days <= 7;
    }).length;

    // Average Token Usage across APIs with token limits
    const apisWithLimits = apis.filter((a) => a.token_limit > 0);
    const avgTokenUsagePct =
      apisWithLimits.length > 0
        ? apisWithLimits.reduce(
            (acc, a) => acc + (a.tokens_used / a.token_limit) * 100,
            0
          ) / apisWithLimits.length
        : 0;

    return {
      totalApis,
      addedThisMonth,
      monthlySpend,
      activeSubsCount: activeSubs.length,
      renewingSoon,
      avgTokenUsagePct: Math.min(100, avgTokenUsagePct),
    };
  }, [apis, subscriptions]);

  // ── Spending by Category (Donut Chart in INR) ─────────────────────────────
  const categoryData = useMemo(() => {
    const map = new Map<string, number>();

    subscriptions.forEach((sub) => {
      if (sub.status !== 'active') return;
      const cat = sub.api_service?.category || 'Other';
      const monthlyAmount =
        sub.billing_cycle === 'monthly'
          ? Number(sub.price)
          : sub.billing_cycle === 'yearly'
          ? Number(sub.price) / 12
          : Number(sub.price) / 3;
      map.set(cat, (map.get(cat) || 0) + monthlyAmount);
    });

    if (map.size === 0) {
      return [];
    }

    return Array.from(map.entries()).map(([name, value]) => ({
      name,
      value: Math.round(value * 100) / 100,
      color: CATEGORY_COLORS[name] || '#64748B',
    }));
  }, [subscriptions]);

  // ── Monthly Spending Trend (Bar Chart in INR) ─────────────────────────────
  const monthlySpendData = useMemo(() => {
    const monthMap = new Map<string, number>();
    const now = new Date();

    // Generate last 6 months labels
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleString('en', { month: 'short' });
      monthMap.set(label, 0);
    }

    // Aggregate usage log costs by month
    usageLogs.forEach((log) => {
      const d = new Date(log.date);
      const label = d.toLocaleString('en', { month: 'short' });
      if (monthMap.has(label)) {
        monthMap.set(label, (monthMap.get(label) || 0) + Number(log.cost));
      }
    });

    // If no usage log costs, distribute subscription spend across months
    const hasUsageCosts = Array.from(monthMap.values()).some((v) => v > 0);
    if (!hasUsageCosts && kpis.monthlySpend > 0) {
      for (const [key] of monthMap) {
        monthMap.set(key, Math.round(kpis.monthlySpend * 100) / 100);
      }
    }

    return Array.from(monthMap.entries()).map(([month, spend]) => ({
      month,
      spend: Math.round(spend * 100) / 100,
    }));
  }, [kpis.monthlySpend, usageLogs]);

  // ── Usage Over Time (Line / Area Chart) ───────────────────────────────────
  const usageTrendData = useMemo(() => {
    if (usageLogs.length > 0) {
      return usageLogs.slice(-14).map((log) => ({
        date: log.date.slice(5),
        tokens: Number(log.tokens_used),
        requests: Number(log.requests),
        cost: Number(log.cost),
      }));
    }

    return [];
  }, [usageLogs]);

  // ── Upcoming Renewals List (PRD Section 11 in INR) ─────────────────────────
  const upcomingRenewals = useMemo(() => {
    return subscriptions
      .filter((s) => s.status === 'active' && s.renewal_date)
      .map((s) => ({
        ...s,
        daysUntil: getDaysUntil(s.renewal_date),
      }))
      .filter((s) => s.daysUntil !== null && s.daysUntil >= 0)
      .sort((a, b) => (a.daysUntil ?? 999) - (b.daysUntil ?? 999))
      .slice(0, 5);
  }, [subscriptions]);

  const userName = profile?.name || user?.email?.split('@')[0] || 'Developer';

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-300">
      {/* ── Welcome Header & Action Buttons ─────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-[11px] font-medium text-indigo-700 mb-2">
            <Zap className="h-3 w-3" />
            <span>Developer Control Center</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {getGreeting()}, {userName}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Real-time telemetry for your API credentials, token consumption, and active subscriptions.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button asChild size="sm" variant="outline" className="border-slate-200/90">
            <NavLink to="/usage">
              <Activity className="h-3.5 w-3.5 mr-1.5 text-indigo-500" />
              <span>Record Usage</span>
            </NavLink>
          </Button>

          <Button asChild size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_1px_3px_rgba(99,102,241,0.3)]">
            <NavLink to="/apis?action=new">
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              <span>Add API</span>
            </NavLink>
          </Button>
        </div>
      </div>

      {/* ── KPI Metrics Cards in Indian Rupees (₹) ──────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total APIs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Total APIs
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 text-slate-700">
              <KeyRound className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div>
                <div className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
                  {kpis.totalApis}
                </div>
                <div className="mt-1 flex items-center text-xs text-slate-500">
                  <span className="text-emerald-700 font-medium mr-1 flex items-center">
                    <ArrowUpRight className="h-3 w-3 inline" /> +{kpis.addedThisMonth}
                  </span>
                  this month
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly Spend in Rupees (₹) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Monthly Spend
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-indigo-50 text-indigo-700">
              <CreditCard className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div>
                <div className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
                  {formatCurrency(kpis.monthlySpend)}
                </div>
                <div className="mt-1 flex items-center text-xs text-slate-500">
                  <span className="text-slate-500">
                    from {kpis.activeSubsCount} active plans
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Subscriptions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Active Plans
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-teal-50 text-teal-800">
              <Clock className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div>
                <div className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
                  {kpis.activeSubsCount}
                </div>
                <div className="mt-1 flex items-center text-xs text-slate-500">
                  {kpis.renewingSoon > 0 ? (
                    <span className="text-amber-700 font-medium flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3 inline" /> {kpis.renewingSoon} renewing soon
                    </span>
                  ) : (
                    <span className="text-slate-500">No upcoming renewals</span>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Token Usage */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Token Usage
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 text-slate-700">
              <Activity className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div>
                <div className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
                  {formatPercentage(kpis.avgTokenUsagePct)}
                </div>
                <div className="mt-1 flex items-center text-xs text-slate-500">
                  <span className="text-slate-500">
                    average usage cap
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Main Charts Grid ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* API Usage Line/Area Chart (2 Cols) */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>API Consumption Telemetry</CardTitle>
              <p className="mt-1 text-xs text-slate-500">
                Track token velocity, request throughput, and computed expenses.
              </p>
            </div>
            {/* Metric Switcher buttons */}
            <div className="flex items-center rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs">
              <button
                onClick={() => setUsageMetric('tokens')}
                className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  usageMetric === 'tokens'
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tokens
              </button>
              <button
                onClick={() => setUsageMetric('requests')}
                className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  usageMetric === 'requests'
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Requests
              </button>
              <button
                onClick={() => setUsageMetric('cost')}
                className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  usageMetric === 'cost'
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Cost (₹)
              </button>
            </div>
          </CardHeader>
          <CardContent>
            {usageTrendData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <Activity className="h-8 w-8 text-slate-300 mb-2" />
                <p className="text-xs font-medium text-slate-600">No usage activity logged yet</p>
                <p className="text-[11px] text-slate-400 mt-0.5 max-w-xs">
                  Record requests and token consumption to see real-time throughput velocity and cost graphs.
                </p>
              </div>
            ) : (
              <div className="h-64 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={usageTrendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="usageGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.6} />
                    <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} tickLine={false} />
                    <YAxis
                      stroke="#94A3B8"
                      fontSize={11}
                      tickLine={false}
                      tickFormatter={(val: any) =>
                        usageMetric === 'cost'
                          ? `₹${val}`
                          : formatNumber(val)
                      }
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        borderRadius: '6px',
                        color: '#0F172A',
                        fontSize: '12px',
                        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
                      }}
                      formatter={(val: any) => [
                        usageMetric === 'cost' ? `₹${Number(val).toFixed(2)}` : formatNumber(Number(val)),
                        usageMetric.toUpperCase(),
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey={usageMetric}
                      stroke="#4F46E5"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#usageGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Spending by Category Donut in INR (1 Col) */}
        <Card>
          <CardHeader>
            <CardTitle>Spend by Category</CardTitle>
            <p className="text-xs text-slate-500">
              Monthly subscription expense distribution in Rupees (₹).
            </p>
          </CardHeader>
          <CardContent>
            {categoryData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-56 text-center">
                <CreditCard className="h-8 w-8 text-slate-300 mb-2" />
                <p className="text-xs font-medium text-slate-600">No category spend recorded</p>
                <p className="text-[11px] text-slate-400 mt-0.5 max-w-xs">
                  Active subscriptions linked to API services will populate this distribution.
                </p>
              </div>
            ) : (
              <>
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#FFFFFF',
                          border: '1px solid #E2E8F0',
                          borderRadius: '6px',
                          color: '#0F172A',
                          fontSize: '12px',
                          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
                        }}
                        formatter={(val: any) => [`₹${val}`, 'Monthly Spend']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Category Legend */}
                <div className="mt-2 space-y-1.5">
                  {categoryData.slice(0, 4).map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-slate-600 font-medium">{item.name}</span>
                      </div>
                      <span className="font-mono font-semibold text-slate-900">
                        ₹{item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Lower Section: Monthly Spending Trend + Upcoming Renewals ──── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Monthly Spending History Bar Chart in Rupees (₹) */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Monthly Run Rate (₹)</CardTitle>
                <p className="mt-1 text-xs text-slate-500">
                  Historical subscription expenditure trajectory over time.
                </p>
              </div>
              <span className="text-xs font-mono font-semibold text-slate-900">
                Avg: {formatCurrency(kpis.monthlySpend)}/mo
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-60 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlySpendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.6} />
                  <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="#94A3B8"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(val: any) => `₹${val}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      borderRadius: '6px',
                      color: '#0F172A',
                      fontSize: '12px',
                      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
                    }}
                    formatter={(val: any) => [`₹${Number(val).toFixed(2)}`, 'Spend']}
                  />
                  <Bar dataKey="spend" fill="#0F766E" radius={[3, 3, 0, 0]} maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Renewals List (PRD Section 11 in Rupees) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle>Upcoming Renewals</CardTitle>
              <p className="mt-0.5 text-xs text-slate-500">
                Billing dates due within 30 days.
              </p>
            </div>
            <Button asChild variant="ghost" size="sm" className="h-7 text-xs text-indigo-600">
              <NavLink to="/subscriptions">View all</NavLink>
            </Button>
          </CardHeader>
          <CardContent>
            {upcomingRenewals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Clock className="h-8 w-8 text-slate-300 mb-2" />
                <p className="text-xs font-medium text-slate-600">No renewals due soon</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Subscriptions with renewals in the next 30 days will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingRenewals.map((sub: any) => {
                  const days = sub.daysUntil ?? 0;
                  const isUrgent = days <= 3;
                  return (
                    <div
                      key={sub.id}
                      className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 p-3 transition-all hover:bg-slate-100/70"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10 font-bold text-xs text-indigo-600">
                          {sub.api_service?.provider?.[0] || 'S'}
                        </div>
                        <div>
                          <div className="font-semibold text-xs text-slate-900">
                            {sub.api_service?.provider || 'Subscription'}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            {sub.plan_name} • ₹{sub.price}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <Badge
                          variant={isUrgent ? 'warning' : 'secondary'}
                          dot
                          className="text-[10px]"
                        >
                          {days === 0
                            ? 'Renews today'
                            : `in ${days} ${days === 1 ? 'day' : 'days'}`}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
