import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  PieChart as PieIcon,
  Calendar,
  Layers,
  DollarSign,
  Activity,
  ArrowUpRight,
  CreditCard,
  KeyRound,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { PageHeader } from '../../components/common/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { apiServicesService } from '../../services/api-services';
import { subscriptionsService } from '../../services/subscriptions';
import { usageService } from '../../services/usage';
import type { ApiService, Subscription, UsageLog } from '../../types';
import { formatCurrency, formatNumber } from '../../utils';
import { CATEGORY_COLORS } from '../../constants';

type TimeRange = '7d' | '30d' | '90d' | '1y';

const PROVIDER_COLORS: Record<string, string> = {
  openai: '#10A37F',
  aws: '#FF9900',
  anthropic: '#D97706',
  google: '#4285F4',
  github: '#24292F',
  azure: '#0078D4',
  stripe: '#635BFF',
  cohere: '#39594D',
  other: '#64748B',
};

const COLOR_PALETTE = ['#4F46E5', '#0F766E', '#D97706', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#64748B'];

export const AnalyticsPage: React.FC = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [apis, setApis] = useState<ApiService[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [usageLogs, setUsageLogs] = useState<UsageLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [apisData, subsData, logsData] = await Promise.all([
          apiServicesService.getAll(),
          subscriptionsService.getAll(),
          usageService.getAll(),
        ]);
        setApis(apisData);
        setSubscriptions(subsData);
        setUsageLogs(logsData);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // ── Category Distribution Data ──────────────────────────────────────────
  const categoryDistribution = useMemo(() => {
    const counts = new Map<string, number>();
    apis.forEach((a) => {
      counts.set(a.category, (counts.get(a.category) || 0) + 1);
    });

    if (counts.size === 0) {
      return [];
    }

    return Array.from(counts.entries()).map(([name, value]) => ({
      name,
      value,
      color: CATEGORY_COLORS[name] || '#64748B',
    }));
  }, [apis]);

  // ── Environment Distribution ────────────────────────────────────────────
  const envDistribution = useMemo(() => {
    const dev = apis.filter((a) => a.environment === 'development').length;
    const staging = apis.filter((a) => a.environment === 'staging').length;
    const prod = apis.filter((a) => a.environment === 'production').length;

    if (dev === 0 && staging === 0 && prod === 0) {
      return [];
    }

    return [
      { name: 'Production', value: prod, color: '#EF4444' },
      { name: 'Staging', value: staging, color: '#F59E0B' },
      { name: 'Development', value: dev, color: '#6366F1' },
    ].filter((item) => item.value > 0);
  }, [apis]);

  // ── Cost Trends over 6 months by Provider ──────────────────────────────
  const { costTrendData, activeProviders } = useMemo(() => {
    const now = new Date();
    const months: { key: string; label: string }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        label: d.toLocaleString('en', { month: 'short' }),
      });
    }

    const providerSet = new Set<string>();
    const monthDataMap = new Map<string, Record<string, number>>();

    months.forEach((m) => {
      monthDataMap.set(m.key, { total: 0 });
    });

    // Aggregate usage log costs
    usageLogs.forEach((log) => {
      const d = new Date(log.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (monthDataMap.has(key)) {
        const provider = (log.api_service?.provider || 'other').toLowerCase();
        providerSet.add(provider);
        const record = monthDataMap.get(key)!;
        record[provider] = (record[provider] || 0) + Number(log.cost || 0);
        record.total += Number(log.cost || 0);
      }
    });

    // Distribute subscription recurring spend across months
    subscriptions.forEach((sub) => {
      if (sub.status !== 'active') return;
      const provider = (sub.api_service?.provider || 'other').toLowerCase();
      providerSet.add(provider);
      const monthlyPrice =
        sub.billing_cycle === 'monthly'
          ? Number(sub.price)
          : sub.billing_cycle === 'yearly'
          ? Number(sub.price) / 12
          : Number(sub.price) / 3;

      months.forEach((m) => {
        const record = monthDataMap.get(m.key)!;
        if (!record[provider]) {
          record[provider] = Math.round(monthlyPrice * 100) / 100;
          record.total += record[provider];
        }
      });
    });

    const hasData = Array.from(monthDataMap.values()).some((r) => r.total > 0);
    if (!hasData) {
      return { costTrendData: [], activeProviders: [] };
    }

    const result = months.map((m) => {
      const record = monthDataMap.get(m.key) || { total: 0 };
      const row: Record<string, any> = { month: m.label };
      providerSet.forEach((p) => {
        row[p] = Math.round((record[p] || 0) * 100) / 100;
      });
      return row;
    });

    return { costTrendData: result, activeProviders: Array.from(providerSet) };
  }, [usageLogs, subscriptions]);

  // ── Usage volume trend filtered by TimeRange ────────────────────────────
  const usageVolumeTrend = useMemo(() => {
    if (usageLogs.length === 0) {
      return [];
    }

    const now = Date.now();
    const daysLimit = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
    const cutoff = now - daysLimit * 24 * 60 * 60 * 1000;

    const filtered = usageLogs
      .filter((l) => new Date(l.date).getTime() >= cutoff)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return filtered.map((l) => ({
      date: l.date.slice(5),
      tokens: Number(l.tokens_used),
      requests: Number(l.requests),
      cost: Number(l.cost),
    }));
  }, [usageLogs, timeRange]);

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      <PageHeader
        title="Analytics & Intelligence"
        description="Comprehensive insights into credential distribution, historical costs, and capacity consumption."
      >
        {/* Time Range Filter Buttons (PRD Section 20) */}
        <div className="flex items-center rounded-lg border border-slate-200 bg-white p-0.5 text-xs">
          {(['7d', '30d', '90d', '1y'] as TimeRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                timeRange === r
                  ? 'bg-indigo-50 text-indigo-600 font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {r === '7d' ? '7 Days' : r === '30d' ? '30 Days' : r === '90d' ? '90 Days' : '1 Year'}
            </button>
          ))}
        </div>
      </PageHeader>

      {/* ── Top Analytics Grid: Stacked Cost Trends & Usage Volume ──────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost Trend by Major Provider */}
        <Card>
          <CardHeader>
            <CardTitle>Expenditure Growth by Provider (₹ INR)</CardTitle>
            <p className="text-xs text-slate-500">
              Stacked breakdown of monthly spend trajectory over time.
            </p>
          </CardHeader>
          <CardContent>
            {costTrendData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <CreditCard className="h-8 w-8 text-slate-300 mb-2" />
                <p className="text-xs font-medium text-slate-600">No expenditure history recorded</p>
                <p className="text-[11px] text-slate-400 mt-0.5 max-w-xs">
                  Active subscriptions or usage costs will populate this provider breakdown.
                </p>
              </div>
            ) : (
              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={costTrendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.6} />
                    <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} tickFormatter={(v: any) => `₹${v}`} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        borderRadius: '6px',
                        color: '#0F172A',
                        fontSize: '12px',
                        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
                      }}
                      formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, '']}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    {activeProviders.map((provider, idx) => {
                      const color = PROVIDER_COLORS[provider] || COLOR_PALETTE[idx % COLOR_PALETTE.length];
                      const displayName = provider.charAt(0).toUpperCase() + provider.slice(1);
                      return (
                        <Area
                          key={provider}
                          type="monotone"
                          dataKey={provider}
                          stackId="1"
                          stroke={color}
                          fill={color}
                          fillOpacity={0.8}
                          name={displayName}
                        />
                      );
                    })}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Request Throughput Velocity */}
        <Card>
          <CardHeader>
            <CardTitle>Request Velocity & Throughput</CardTitle>
            <p className="text-xs text-slate-500">
              Daily requests and concurrent workload volume across services.
            </p>
          </CardHeader>
          <CardContent>
            {usageVolumeTrend.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <Activity className="h-8 w-8 text-slate-300 mb-2" />
                <p className="text-xs font-medium text-slate-600">No request telemetry recorded</p>
                <p className="text-[11px] text-slate-400 mt-0.5 max-w-xs">
                  Log your daily requests and token velocity in the Usage tab.
                </p>
              </div>
            ) : (
              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={usageVolumeTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.6} />
                    <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} tickFormatter={(v: any) => formatNumber(v)} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        borderRadius: '6px',
                        color: '#0F172A',
                        fontSize: '12px',
                        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
                      }}
                      formatter={(val: any) => [formatNumber(Number(val)), 'Requests']}
                    />
                    <Line type="monotone" dataKey="requests" stroke="#059669" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Lower Analytics Grid: Distributions ─────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>API Services by Category</CardTitle>
            <p className="text-xs text-slate-500">
              Distribution of credentials categorized across architectural layers.
            </p>
          </CardHeader>
          <CardContent>
            {categoryDistribution.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-52 text-center">
                <KeyRound className="h-8 w-8 text-slate-300 mb-2" />
                <p className="text-xs font-medium text-slate-600">No API services tracked</p>
                <p className="text-[11px] text-slate-400 mt-0.5 max-w-xs">
                  Register APIs to visualize category distribution.
                </p>
              </div>
            ) : (
              <>
                <div className="h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {categoryDistribution.map((entry, index) => (
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
                        formatter={(val: any) => [`${val} APIs`, 'Count']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
                  {categoryDistribution.map((c) => (
                    <div key={c.name} className="flex items-center justify-between p-1.5 rounded-md bg-slate-50">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c.color }} />
                        <span className="font-medium text-slate-700">{c.name}</span>
                      </div>
                      <span className="font-semibold text-slate-900">{c.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Environment Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Deployment Environments</CardTitle>
            <p className="text-xs text-slate-500">
              Breakdown of credentials separated by environment isolation.
            </p>
          </CardHeader>
          <CardContent>
            {envDistribution.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-52 text-center">
                <KeyRound className="h-8 w-8 text-slate-300 mb-2" />
                <p className="text-xs font-medium text-slate-600">No environments assigned</p>
                <p className="text-[11px] text-slate-400 mt-0.5 max-w-xs">
                  Assign environments to your APIs to view deployment isolation.
                </p>
              </div>
            ) : (
              <>
                <div className="h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={envDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {envDistribution.map((entry, index) => (
                          <Cell key={`cell-env-${index}`} fill={entry.color} />
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
                        formatter={(val: any) => [`${val} APIs`, 'Environment']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-1.5 pt-2 text-xs">
                  {envDistribution.map((e) => (
                    <div key={e.name} className="flex items-center justify-between p-1.5 rounded-md bg-slate-50">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: e.color }} />
                        <span className="font-medium text-slate-700">{e.name}</span>
                      </div>
                      <span className="font-mono font-semibold text-slate-900">{e.value} services</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
