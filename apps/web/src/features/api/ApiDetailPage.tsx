import React, { useState, useEffect } from 'react';
import { useParams, NavLink, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  KeyRound,
  ExternalLink,
  Edit,
  Trash2,
  Eye,
  Copy,
  Check,
  AlertTriangle,
  Calendar,
  CreditCard,
  Activity,
  Layers,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { apiServicesService } from '../../services/api-services';
import { usageService } from '../../services/usage';
import { subscriptionsService } from '../../services/subscriptions';
import type { ApiService, UsageLog, Subscription } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { Skeleton } from '../../components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { AddApiModal } from './AddApiModal';
import { RevealKeyModal } from './RevealKeyModal';
import {
  maskApiKey,
  formatNumber,
  formatCurrency,
  getUsageLevel,
  getUsageBarColor,
} from '../../utils';

export const ApiDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [api, setApi] = useState<ApiService | null>(null);
  const [usageLogs, setUsageLogs] = useState<UsageLog[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [revealModalOpen, setRevealModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const [apiData, logsData, allSubs] = await Promise.all([
          apiServicesService.getById(id),
          usageService.getByApiId(id),
          subscriptionsService.getAll(),
        ]);
        setApi(apiData);
        setUsageLogs(logsData);
        // Linked subscription
        const linked = allSubs.filter((s) => s.api_id === id);
        setSubscriptions(linked);
      } catch (err: any) {
        toast.error('Failed to load API service details');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  const handleDelete = async () => {
    if (!api) return;
    if (!window.confirm(`Delete ${api.name} permanently?`)) return;
    try {
      await apiServicesService.delete(api.id);
      toast.success('API service deleted');
      navigate('/apis');
    } catch {
      toast.error('Failed to delete service');
    }
  };

  const handleCopy = () => {
    if (!api?.api_key_encrypted) return;
    navigator.clipboard.writeText(api.api_key_encrypted);
    setCopied(true);
    toast.success('Key copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!api) {
    return (
      <div className="py-12 text-center">
        <h2 className="text-base font-semibold text-slate-900">
          API Service Not Found
        </h2>
        <Button asChild className="mt-4" size="sm">
          <NavLink to="/apis">Back to APIs</NavLink>
        </Button>
      </div>
    );
  }

  const usagePct =
    api.token_limit > 0
      ? Math.min(100, Math.round((api.tokens_used / api.token_limit) * 100))
      : 0;
  const usageLevel = getUsageLevel(usagePct);
  const barColor = getUsageBarColor(usageLevel);

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      {/* ── Top Navigation Link ─────────────────────────────────────────── */}
      <NavLink
        to="/apis"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>Back to APIs</span>
      </NavLink>

      {/* ── Header Banner ──────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-50 font-bold text-lg text-indigo-600 shadow-xs">
            {api.provider[0]}
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                {api.provider}
              </h1>
              <span className="text-slate-400">•</span>
              <span className="text-base font-medium text-slate-600">
                {api.name}
              </span>
              <Badge
                variant={
                  api.status === 'active'
                    ? 'success'
                    : api.status === 'revoked'
                    ? 'danger'
                    : 'secondary'
                }
                dot
              >
                {api.status}
              </Badge>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span className="font-mono uppercase font-semibold text-slate-700">
                {api.environment}
              </span>
              <span>•</span>
              <span>{api.category}</span>
              {api.website && (
                <>
                  <span>•</span>
                  <a
                    href={api.website}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-indigo-600 hover:underline"
                  >
                    Documentation <ExternalLink className="h-3 w-3" />
                  </a>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditModalOpen(true)}
            className="border-slate-200"
          >
            <Edit className="h-3.5 w-3.5 mr-1.5" />
            <span>Edit</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
            <span>Delete</span>
          </Button>
        </div>
      </div>

      {/* ── Tabbed Detail Sections (PRD Section 13) ─────────────────────── */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full sm:w-auto justify-start border-b border-slate-200 rounded-none bg-transparent p-0 h-auto gap-4">
          <TabsTrigger
            value="overview"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 pb-2.5 pt-1 px-1 font-medium text-xs"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="credentials"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 pb-2.5 pt-1 px-1 font-medium text-xs"
          >
            Credentials
          </TabsTrigger>
          <TabsTrigger
            value="usage"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 pb-2.5 pt-1 px-1 font-medium text-xs"
          >
            Usage & Limits
          </TabsTrigger>
          <TabsTrigger
            value="subscription"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 pb-2.5 pt-1 px-1 font-medium text-xs"
          >
            Subscription ({subscriptions.length})
          </TabsTrigger>
          <TabsTrigger
            value="activity"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 pb-2.5 pt-1 px-1 font-medium text-xs"
          >
            Activity Logs ({usageLogs.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Overview */}
        <TabsContent value="overview" className="pt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Service Specifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Provider</span>
                  <span className="font-semibold text-slate-900">{api.provider}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Service Identifier</span>
                  <span className="font-semibold text-slate-900">{api.name}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Category</span>
                  <span className="font-semibold text-slate-900">{api.category}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Environment</span>
                  <span className="font-mono uppercase font-semibold text-slate-900">{api.environment}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500">Created At</span>
                  <span className="text-slate-700">
                    {new Date(api.created_at).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Developer Notes & Guidelines</CardTitle>
              </CardHeader>
              <CardContent>
                {api.notes ? (
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                    {api.notes}
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    No notes entered for this service. You can edit the service to add team rules or rotation policies.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 2: Credentials */}
        <TabsContent value="credentials" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">API Key & Credential Vault</CardTitle>
              <p className="text-xs text-slate-500">
                Credentials are encrypted and masked to prevent unintentional exposure in logs or streams.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50/60 p-4">
                <div className="space-y-1">
                  <div className="text-[11px] font-semibold uppercase text-slate-400">
                    Masked API Token
                  </div>
                  <div className="font-mono text-sm text-slate-800">
                    {maskApiKey(api.api_key_encrypted)}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRevealModalOpen(true)}
                    className="gap-1.5 text-xs border-slate-200"
                  >
                    <Eye className="h-3.5 w-3.5 text-indigo-500" />
                    <span>Reveal</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                    className="gap-1.5 text-xs border-slate-200"
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    <span>Copy</span>
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setEditModalOpen(true)}
                    className="gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white"
                  >
                    <span>Rotate Key</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Usage & Limits */}
        <TabsContent value="usage" className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase text-slate-400">Tokens Used</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">
                  {formatNumber(api.tokens_used)}
                </div>
                <div className="mt-1 text-xs text-slate-500">Total consumption logged</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase text-slate-400">Monthly Limit</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">
                  {api.token_limit > 0 ? formatNumber(api.token_limit) : 'Unlimited'}
                </div>
                <div className="mt-1 text-xs text-slate-500">Configured safety cap</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase text-slate-400">Remaining</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">
                  {api.token_limit > 0
                    ? formatNumber(Math.max(0, api.token_limit - api.tokens_used))
                    : '∞'}
                </div>
                <div className="mt-1 text-xs text-slate-500">Available tokens before quota alert</div>
              </CardContent>
            </Card>
          </div>

          {api.token_limit > 0 && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-sm">Consumption Threshold</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-700">
                    {usagePct}% consumed
                  </span>
                  <Badge variant={usageLevel === 'critical' ? 'danger' : usageLevel === 'warning' ? 'warning' : 'success'}>
                    {usageLevel.toUpperCase()}
                  </Badge>
                </div>
                <Progress value={usagePct} indicatorColor={barColor} className="h-2.5" />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab 4: Subscription */}
        <TabsContent value="subscription" className="pt-4">
          {subscriptions.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-xs text-slate-500">
                No active subscription linked directly to this API service.
                <div className="mt-3">
                  <Button asChild size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white">
                    <NavLink to={`/subscriptions?action=new&api_id=${api.id}`}>
                      Create Linked Subscription
                    </NavLink>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {subscriptions.map((sub) => (
                <Card key={sub.id}>
                  <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
                        <CreditCard className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-slate-900">
                          {sub.plan_name}
                        </div>
                        <div className="text-xs text-slate-500">
                          {formatCurrency(sub.price, sub.currency)} / {sub.billing_cycle}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs">
                      <div>
                        <span className="text-slate-400">Renewal: </span>
                        <span className="font-medium text-slate-800">
                          {sub.renewal_date || 'N/A'}
                        </span>
                      </div>
                      <Badge variant="success" dot>
                        {sub.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab 5: Activity Logs */}
        <TabsContent value="activity" className="pt-4">
          {usageLogs.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-xs text-slate-500">
                No historical usage entries recorded yet for this API.
              </CardContent>
            </Card>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-semibold uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Requests</th>
                    <th className="px-4 py-3">Tokens Used</th>
                    <th className="px-4 py-3">Credits</th>
                    <th className="px-4 py-3">Cost (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {usageLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono">{log.date}</td>
                      <td className="px-4 py-3">{formatNumber(log.requests)}</td>
                      <td className="px-4 py-3 font-mono">{formatNumber(log.tokens_used)}</td>
                      <td className="px-4 py-3">{Number(log.credits_used).toFixed(2)}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900 font-mono">
                        {formatCurrency(log.cost, 'INR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Modal */}
      <AddApiModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        initialData={api}
        onSuccess={(updated) => setApi(updated)}
      />

      {/* Reveal Key Modal */}
      <RevealKeyModal
        open={revealModalOpen}
        onOpenChange={setRevealModalOpen}
        api={api}
      />
    </div>
  );
};
