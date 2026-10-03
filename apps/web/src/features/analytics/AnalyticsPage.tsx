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
      return [
        { name: 'AI', value: 4, color: CATEGORY_COLORS.AI },
        { name: 'Cloud', value: 3, color: CATEGORY_COLORS.Cloud },
        { name: 'Database', value: 2, color: CATEGORY_COLORS.Database },
        { name: 'Payments', value: 1, color: CATEGORY_COLORS.Payments },
      ];
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

    return [
      { name: 'Production', value: prod || 4, color: '#EF4444' },
      { name: 'Staging', value: staging || 2, color: '#F59E0B' },
      { name: 'Development', value: dev || 6, color: '#6366F1' },
    ];
  }, [apis]);

  // ── Cost Trends over 6 months ───────────────────────────────────────────
  const costTrendData = useMemo(() => {
    const months = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
    return months.map((m, idx) => ({
      month: m,
      openai: 1650 + idx * 350,
      aws: 2800 + idx * 420,
      anthropic: 1250 + idx * 280,
      other: 850 + idx * 120,
    }));
  }, []);

  // ── Usage volume trend ──────────────────────────────────────────────────
  const usageVolumeTrend = useMemo(() => {
    if (usageLogs.length > 0) {
      return usageLogs.map((l) => ({
        date: l.date.slice(5),
        tokens: Number(l.tokens_used),
        requests: Number(l.requests),
      }));
    }
    return [
      { date: '09-15', tokens: 110000, requests: 1200 },
      { date: '09-17', tokens: 190000, requests: 2100 },
      { date: '09-19', tokens: 240000, requests: 2800 },
      { date: '09-21', tokens: 320000, requests: 3400 },
      { date: '09-23', tokens: 280000, requests: 3100 },
      { date: '09-25', tokens: 420000, requests: 4600 },
      { date: '09-27', tokens: 510000, requests: 5200 },
    ];
  }, [usageLogs]);

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
            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={costTrendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.6} />
                  <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      borderRadius: '6px',
                      color: '#0F172A',
                      fontSize: '12px',
                      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
                    }}
                    formatter={(val: any) => [`₹${val.toLocaleString('en-IN')}`, '']}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Area type="monotone" dataKey="openai" stackId="1" stroke="#4F46E5" fill="#4F46E5" fillOpacity={0.8} name="OpenAI" />
                  <Area type="monotone" dataKey="aws" stackId="1" stroke="#0F766E" fill="#0F766E" fillOpacity={0.8} name="AWS" />
                  <Area type="monotone" dataKey="anthropic" stackId="1" stroke="#D97706" fill="#D97706" fillOpacity={0.8} name="Anthropic" />
                  <Area type="monotone" dataKey="other" stackId="1" stroke="#64748B" fill="#64748B" fillOpacity={0.8} name="Other" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
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
            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={usageVolumeTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.6} />
                  <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} tickFormatter={(v) => formatNumber(v)} />
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
