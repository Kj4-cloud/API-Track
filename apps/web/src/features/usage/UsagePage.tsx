import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity,
  Plus,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../../components/common/PageHeader';
import { EmptyState } from '../../components/common/EmptyState';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { AddUsageModal } from './AddUsageModal';
import { usageService } from '../../services/usage';
import { apiServicesService } from '../../services/api-services';
import type { UsageLog, ApiService } from '../../types';
import {
  formatNumber,
  formatCurrency,
  getUsageLevel,
  getUsageBarColor,
} from '../../utils';

export const UsagePage: React.FC = () => {
  const [apis, setApis] = useState<ApiService[]>([]);
  const [logs, setLogs] = useState<UsageLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedProvider, setSelectedProvider] = useState<string>('all');

  // Modal
  const [modalOpen, setModalOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [apisData, logsData] = await Promise.all([
        apiServicesService.getAll(),
        usageService.getAll(),
      ]);
      setApis(apisData);
      setLogs(logsData);
    } catch {
      toast.error('Failed to load usage data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeleteLog = async (id: string) => {
    try {
      await usageService.delete(id);
      setLogs((prev) => prev.filter((l) => l.id !== id));
      toast.success('Log entry deleted');
    } catch {
      toast.error('Failed to delete log entry');
    }
  };

  const providers = useMemo(() => {
    const set = new Set(apis.map((a) => a.provider));
    return Array.from(set);
  }, [apis]);

  const filteredApis = useMemo(() => {
    if (selectedProvider === 'all') return apis;
    return apis.filter((a) => a.provider === selectedProvider);
  }, [apis, selectedProvider]);

  const aggregateStats = useMemo(() => {
    const totalRequests = logs.reduce((acc, l) => acc + (l.requests || 0), 0);
    const totalTokens = logs.reduce((acc, l) => acc + Number(l.tokens_used || 0), 0);
    const totalCost = logs.reduce((acc, l) => acc + Number(l.cost || 0), 0);
    const totalCredits = logs.reduce((acc, l) => acc + Number(l.credits_used || 0), 0);

    return {
      totalRequests,
      totalTokens,
      totalCost,
      totalCredits,
    };
  }, [logs]);

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      <PageHeader
        title="API Usage & Quota Telemetry"
        description="Monitor token throughput, request volume, and metered cost in Rupees (₹)."
      >
        <Button
          onClick={() => setModalOpen(true)}
          size="sm"
          className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_1px_3px_rgba(99,102,241,0.3)]"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          <span>Record Usage</span>
        </Button>
      </PageHeader>

      {/* ── Metric Summary Strip in Rupees (₹) ──────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="craft-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase text-slate-400">Total Tokens Logged</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 font-mono">
              {formatNumber(aggregateStats.totalTokens)}
            </div>
            <p className="mt-0.5 text-xs text-slate-500">Cumulative token volume</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase text-slate-400">API Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 font-mono">
              {formatNumber(aggregateStats.totalRequests)}
            </div>
            <p className="mt-0.5 text-xs text-slate-500">HTTP requests processed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase text-slate-400">Total Usage Cost (₹)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 font-mono">
              {formatCurrency(aggregateStats.totalCost)}
            </div>
            <p className="mt-0.5 text-xs text-slate-500">Incurred metered billing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase text-slate-400">Credits Consumed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 font-mono">
              {aggregateStats.totalCredits.toFixed(2)}
            </div>
            <p className="mt-0.5 text-xs text-slate-500">Prepaid balance deductions</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Filter Controls (PRD Section 18) ────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500">Provider:</span>
          <select
            value={selectedProvider}
            onChange={(e) => setSelectedProvider(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700 focus:outline-none"
          >
            <option value="all">All Providers</option>
            {providers.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        {/* Legend for thresholds */}
        <div className="flex items-center gap-3 text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-indigo-500" />
            <span>0–70% Normal</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            <span>70–90% Warning</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            <span>90%+ Critical</span>
          </div>
        </div>
      </div>

      {/* ── Per-API Usage Details Cards (PRD Section 19) ────────────────── */}
      <div>
        <h2 className="text-sm font-semibold tracking-tight text-slate-900 mb-3">
          Service Quotas & Consumption Limits
        </h2>

        {filteredApis.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="No API services configured"
            description="Add your first API service with a token limit to visualize consumption progress."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredApis.map((api) => {
              const limit = api.token_limit || 0;
              const used = api.tokens_used || 0;
              const remaining = Math.max(0, limit - used);
              const percentage = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
              const level = getUsageLevel(percentage);
              const barColor = getUsageBarColor(level);

              const serviceRequests = logs
                .filter((l) => l.api_id === api.id)
                .reduce((acc, l) => acc + (l.requests || 0), 0);

              return (
                <Card key={api.id} className="transition-all">
                  <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 font-bold text-xs text-indigo-600">
                        {api.provider[0]}
                      </div>
                      <div>
                        <div className="font-semibold text-xs text-slate-900">
                          {api.provider}
                        </div>
                        <div className="text-[11px] text-slate-500">{api.name}</div>
                      </div>
                    </div>
                    <Badge variant={level === 'critical' ? 'danger' : level === 'warning' ? 'warning' : 'secondary'}>
                      {level.toUpperCase()}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-0">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-lg bg-slate-50 p-2">
                        <span className="text-[10px] text-slate-400 uppercase">Requests</span>
                        <div className="font-mono font-semibold text-slate-900">
                          {formatNumber(serviceRequests)}
                        </div>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-2">
                        <span className="text-[10px] text-slate-400 uppercase">Tokens Used</span>
                        <div className="font-mono font-semibold text-slate-900">
                          {formatNumber(used)}
                        </div>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-2">
                        <span className="text-[10px] text-slate-400 uppercase">Token Limit</span>
                        <div className="font-mono font-semibold text-slate-900">
                          {limit > 0 ? formatNumber(limit) : 'Unlimited'}
                        </div>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-2">
                        <span className="text-[10px] text-slate-400 uppercase">Remaining</span>
                        <div className="font-mono font-semibold text-slate-900">
                          {limit > 0 ? formatNumber(remaining) : '∞'}
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar & Percentage */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500 font-medium">Usage Level</span>
                        <span className="font-mono font-bold text-slate-900">
                          {percentage}%
                        </span>
                      </div>
                      <Progress value={percentage} indicatorColor={barColor} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Daily Activity History Table in Rupees (₹) ─────────────────── */}
      <div className="space-y-3 pt-4">
        <h2 className="text-sm font-semibold tracking-tight text-slate-900">
          Daily Consumption Log History
        </h2>

        {logs.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-xs text-slate-500">
              No usage logs recorded yet. Click "Record Usage" above to add daily data.
            </CardContent>
          </Card>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Service</th>
                  <th className="px-4 py-3">Requests</th>
                  <th className="px-4 py-3">Tokens Used</th>
                  <th className="px-4 py-3">Credits</th>
                  <th className="px-4 py-3">Cost (₹)</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-[11px]">{log.date}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {log.api_service?.provider} — {log.api_service?.name}
                    </td>
                    <td className="px-4 py-3 font-mono">{formatNumber(log.requests)}</td>
                    <td className="px-4 py-3 font-mono">{formatNumber(log.tokens_used)}</td>
                    <td className="px-4 py-3">{Number(log.credits_used).toFixed(2)}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900 font-mono">
                      ₹{Number(log.cost).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDeleteLog(log.id)}
                        className="text-xs text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Usage Modal */}
      <AddUsageModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSuccess={(newLog) => {
          setLogs((prev) => [newLog, ...prev]);
          loadData();
        }}
      />
    </div>
  );
};
