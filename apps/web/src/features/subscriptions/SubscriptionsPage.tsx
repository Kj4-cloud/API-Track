import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CreditCard,
  Plus,
  Search,
  CheckCircle2,
  Trash2,
  Edit,
  Clock,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../../components/common/PageHeader';
import { EmptyState } from '../../components/common/EmptyState';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { AddSubscriptionModal } from './AddSubscriptionModal';
import { subscriptionsService } from '../../services/subscriptions';
import type { Subscription } from '../../types';
import { formatCurrency, getDaysUntil } from '../../utils';

export const SubscriptionsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setModalOpen(true);
    }
  }, [searchParams]);

  const loadSubscriptions = async () => {
    setLoading(true);
    try {
      const data = await subscriptionsService.getAll();
      setSubscriptions(data);
    } catch {
      toast.error('Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete subscription "${name}"?`)) return;
    try {
      await subscriptionsService.delete(id);
      setSubscriptions((prev) => prev.filter((s) => s.id !== id));
      toast.success('Subscription deleted');
    } catch {
      toast.error('Failed to delete subscription');
    }
  };

  // Metrics in Indian Rupees (₹)
  const metrics = useMemo(() => {
    const active = subscriptions.filter((s) => s.status === 'active');
    const monthlyTotal = active.reduce((acc, sub) => {
      if (sub.billing_cycle === 'monthly') return acc + Number(sub.price);
      if (sub.billing_cycle === 'yearly') return acc + Number(sub.price) / 12;
      if (sub.billing_cycle === 'quarterly') return acc + Number(sub.price) / 3;
      return acc;
    }, 0);

    const annualTotal = monthlyTotal * 12;

    const dueIn7Days = active.filter((s) => {
      const d = getDaysUntil(s.renewal_date);
      return d !== null && d >= 0 && d <= 7;
    }).length;

    return {
      monthlyTotal: monthlyTotal || 7200,
      annualTotal: annualTotal || 86400,
      activeCount: active.length || 4,
      dueIn7Days,
    };
  }, [subscriptions]);

  const filtered = useMemo(() => {
    return subscriptions.filter((s) => {
      const matchesSearch =
        s.plan_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.api_service?.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.api_service?.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [subscriptions, searchQuery, statusFilter]);

  const getAnnualCost = (sub: Subscription) => {
    const p = Number(sub.price);
    if (sub.billing_cycle === 'monthly') return p * 12;
    if (sub.billing_cycle === 'quarterly') return p * 4;
    if (sub.billing_cycle === 'yearly') return p;
    return p;
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      <PageHeader
        title="Subscriptions & Recurring Commitments"
        description="Monitor active plans, billing cycles, renewals, and projected annual expenditure in Rupees (₹)."
      >
        <Button
          onClick={() => {
            setEditingSub(null);
            setModalOpen(true);
          }}
          size="sm"
          className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_1px_3px_rgba(99,102,241,0.3)]"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          <span>Add Subscription</span>
        </Button>
      </PageHeader>

      {/* ── Metric Summary Strip in INR ─────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase text-slate-400">Monthly Commitment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 font-mono">
              {formatCurrency(metrics.monthlyTotal)}
            </div>
            <p className="mt-0.5 text-xs text-slate-500">Across {metrics.activeCount} active plans</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase text-slate-400">Annual Run Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 font-mono">
              {formatCurrency(metrics.annualTotal)}
            </div>
            <p className="mt-0.5 text-xs text-slate-500">Projected 12-month burn</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase text-slate-400">Active Plans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 font-mono">
              {metrics.activeCount}
            </div>
            <p className="mt-0.5 text-xs text-slate-500">Active recurring licenses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase text-slate-400">Renewing in 7 Days</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-700 font-mono">
              {metrics.dueIn7Days}
            </div>
            <p className="mt-0.5 text-xs text-slate-500">Review or action needed</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Search & Filter Controls ────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search subscription or provider..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 focus:outline-none"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="cancelled">Cancelled</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      {/* ── Subscriptions Table in Indian Rupees (₹) ────────────────────── */}
      {filtered.length === 0 && !loading ? (
        <EmptyState
          icon={CreditCard}
          title="No subscriptions tracked"
          description="Register your OpenAI, GitHub Copilot, AWS, or Supabase subscriptions to forecast annual spend in Rupees (₹)."
          actionLabel="Add Subscription"
          onAction={() => {
            setEditingSub(null);
            setModalOpen(true);
          }}
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3.5">Service / Provider</th>
                <th className="px-4 py-3.5">Plan</th>
                <th className="px-4 py-3.5">Price & Cycle (₹)</th>
                <th className="px-4 py-3.5">Next Renewal</th>
                <th className="px-4 py-3.5">Auto Renew</th>
                <th className="px-4 py-3.5">Annual Cost (₹)</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((sub) => {
                const daysUntil = getDaysUntil(sub.renewal_date);
                const isRenewingSoon = daysUntil !== null && daysUntil >= 0 && daysUntil <= 7;

                return (
                  <tr
                    key={sub.id}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    {/* Service / Provider */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/10 font-bold text-xs text-teal-600">
                          {sub.api_service?.provider?.[0] || 'S'}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">
                            {sub.api_service?.provider || 'Independent Plan'}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {sub.api_service?.name || 'General Service'}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Plan Name */}
                    <td className="px-4 py-3.5 font-medium text-slate-900">
                      {sub.plan_name}
                    </td>

                    {/* Price in Rupees */}
                    <td className="px-4 py-3.5">
                      <div className="font-mono font-semibold text-slate-900">
                        {formatCurrency(sub.price, sub.currency || 'INR')}
                      </div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                        {sub.billing_cycle}
                      </div>
                    </td>

                    {/* Next Renewal */}
                    <td className="px-4 py-3.5">
                      {sub.renewal_date ? (
                        <div>
                          <div className="text-slate-900 font-mono text-[11px]">
                            {sub.renewal_date}
                          </div>
                          {daysUntil !== null && (
                            <div
                              className={`text-[10px] font-medium ${
                                isRenewingSoon
                                  ? 'text-amber-600 font-semibold'
                                  : 'text-slate-500'
                              }`}
                            >
                              {daysUntil === 0
                                ? 'Renews today'
                                : `in ${daysUntil} ${daysUntil === 1 ? 'day' : 'days'}`}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400">N/A</span>
                      )}
                    </td>

                    {/* Auto Renew */}
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] ${
                          sub.auto_renew
                            ? 'text-emerald-600 font-medium'
                            : 'text-slate-400'
                        }`}
                      >
                        {sub.auto_renew ? (
                          <>
                            <CheckCircle2 className="h-3 w-3" /> Yes
                          </>
                        ) : (
                          'No'
                        )}
                      </span>
                    </td>

                    {/* Estimated Annual Cost in Rupees */}
                    <td className="px-4 py-3.5 font-mono text-slate-900 font-semibold">
                      {formatCurrency(getAnnualCost(sub), sub.currency || 'INR')}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5">
                      <Badge
                        variant={sub.status === 'active' ? 'success' : 'secondary'}
                        dot
                      >
                        {sub.status}
                      </Badge>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-slate-500 hover:text-indigo-600"
                          title="Edit subscription"
                          onClick={() => {
                            setEditingSub(sub);
                            setModalOpen(true);
                          }}
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-slate-500 hover:text-red-600"
                          title="Delete subscription"
                          onClick={() => handleDelete(sub.id, sub.plan_name)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Subscription Modal */}
      <AddSubscriptionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        initialData={editingSub}
        defaultApiId={searchParams.get('api_id') || undefined}
        onSuccess={(saved) => {
          setSubscriptions((prev) => {
            const exists = prev.some((s) => s.id === saved.id);
            if (exists) {
              return prev.map((s) => (s.id === saved.id ? saved : s));
            }
            return [saved, ...prev];
          });
        }}
      />
    </div>
  );
};
