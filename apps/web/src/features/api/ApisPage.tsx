import React, { useState, useEffect, useMemo } from 'react';
import { NavLink, useSearchParams } from 'react-router-dom';
import {
  KeyRound,
  Plus,
  Search,
  Filter,
  Eye,
  Copy,
  MoreVertical,
  ExternalLink,
  Trash2,
  Edit,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../../components/common/PageHeader';
import { EmptyState } from '../../components/common/EmptyState';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { AddApiModal } from './AddApiModal';
import { RevealKeyModal } from './RevealKeyModal';
import { apiServicesService } from '../../services/api-services';
import type { ApiService } from '../../types';
import { maskApiKey, getUsageLevel, getUsageBarColor } from '../../utils';
import { CATEGORIES, ENVIRONMENTS } from '../../constants';

export const ApisPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [apis, setApis] = useState<ApiService[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedEnvironment, setSelectedEnvironment] = useState<string>('all');

  // Modals state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingApi, setEditingApi] = useState<ApiService | null>(null);
  const [revealingApi, setRevealingApi] = useState<ApiService | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Check URL query param for quick action
  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setAddModalOpen(true);
    }
  }, [searchParams]);

  const loadApis = async () => {
    setLoading(true);
    try {
      const data = await apiServicesService.getAll();
      setApis(data);
    } catch (err: any) {
      toast.error('Failed to load API services');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApis();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}" from your vault?`)) {
      return;
    }

    try {
      await apiServicesService.delete(id);
      setApis((prev) => prev.filter((a) => a.id !== id));
      toast.success(`API "${name}" deleted`);
    } catch (err: any) {
      toast.error('Failed to delete API');
    }
  };

  const handleCopyKey = (api: ApiService) => {
    if (!api.api_key_encrypted) {
      toast.info('No API key stored for this service');
      return;
    }
    navigator.clipboard.writeText(api.api_key_encrypted);
    setCopiedId(api.id);
    toast.success(`${api.provider} API key copied to clipboard`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtered APIs
  const filteredApis = useMemo(() => {
    return apis.filter((api) => {
      const matchesSearch =
        api.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
        api.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        api.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === 'all' || api.category === selectedCategory;
      const matchesEnv =
        selectedEnvironment === 'all' || api.environment === selectedEnvironment;
      return matchesSearch && matchesCategory && matchesEnv;
    });
  }, [apis, searchQuery, selectedCategory, selectedEnvironment]);

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      <PageHeader
        title="API Services"
        description="Manage your third-party providers, credential vault, and consumption limits."
      >
        <Button
          onClick={() => {
            setEditingApi(null);
            setAddModalOpen(true);
          }}
          size="sm"
          className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          <span>Add API</span>
        </Button>
      </PageHeader>

      {/* ── Filters & Search Bar ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Filter by name, provider, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 focus:outline-none"
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Environment Filter */}
          <select
            value={selectedEnvironment}
            onChange={(e) => setSelectedEnvironment(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 focus:outline-none"
          >
            <option value="all">All Environments</option>
            {ENVIRONMENTS.map((env) => (
              <option key={env} value={env}>
                {env.charAt(0).toUpperCase() + env.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── API Table ───────────────────────────────────────────────────── */}
      {filteredApis.length === 0 && !loading ? (
        <EmptyState
          icon={KeyRound}
          title="No API services found"
          description={
            searchQuery || selectedCategory !== 'all' || selectedEnvironment !== 'all'
              ? 'No APIs match your filter criteria. Try resetting filters.'
              : 'Start by registering your first API service to track usage and credentials.'
          }
          actionLabel="Add API Service"
          onAction={() => {
            setEditingApi(null);
            setAddModalOpen(true);
          }}
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3.5">Provider & Service</th>
                <th className="px-4 py-3.5">Category</th>
                <th className="px-4 py-3.5">Environment</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Masked Key</th>
                <th className="px-4 py-3.5">Usage</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredApis.map((api) => {
                const usagePct =
                  api.token_limit > 0
                    ? Math.min(100, Math.round((api.tokens_used / api.token_limit) * 100))
                    : 0;
                const usageLevel = getUsageLevel(usagePct);
                const barColor = getUsageBarColor(usageLevel);

                return (
                  <tr
                    key={api.id}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    {/* Provider & Service Name */}
                    <td className="px-4 py-3.5">
                      <NavLink
                        to={`/apis/${api.id}`}
                        className="group flex items-center gap-3"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 font-semibold text-xs text-indigo-600">
                          {api.provider[0]}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {api.provider}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {api.name}
                          </div>
                        </div>
                      </NavLink>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3.5">
                      <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                        {api.category}
                      </span>
                    </td>

                    {/* Environment */}
                    <td className="px-4 py-3.5">
                      <span
                        className={`text-[11px] font-medium uppercase font-mono ${
                          api.environment === 'production'
                            ? 'text-red-600 font-semibold'
                            : api.environment === 'staging'
                            ? 'text-amber-600'
                            : 'text-slate-500'
                        }`}
                      >
                        {api.environment}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5">
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
                    </td>

                    {/* Masked Key & Quick Copy */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-500">
                        <span>{maskApiKey(api.api_key_encrypted)}</span>
                        {api.api_key_encrypted && (
                          <button
                            onClick={() => handleCopyKey(api)}
                            title="Quick copy key"
                            className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                          >
                            {copiedId === api.id ? (
                              <Check className="h-3 w-3 text-emerald-500" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Usage Progress */}
                    <td className="px-4 py-3.5">
                      {api.token_limit > 0 ? (
                        <div className="w-28 space-y-1">
                          <div className="flex justify-between text-[10px] text-slate-500">
                            <span>{usagePct}%</span>
                            <span>Limit set</span>
                          </div>
                          <Progress value={usagePct} indicatorColor={barColor} className="h-1.5" />
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400">Unlimited</span>
                      )}
                    </td>

                    {/* Row Actions */}
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-slate-500 hover:text-indigo-600"
                          title="Reveal key"
                          onClick={() => setRevealingApi(api)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-slate-500"
                            >
                              <MoreVertical className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem asChild>
                              <NavLink to={`/apis/${api.id}`} className="flex items-center gap-2">
                                <ExternalLink className="h-3.5 w-3.5" />
                                <span>View Details</span>
                              </NavLink>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setEditingApi(api);
                                setAddModalOpen(true);
                              }}
                              className="flex items-center gap-2"
                            >
                              <Edit className="h-3.5 w-3.5" />
                              <span>Edit Service</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              destructive
                              onClick={() => handleDelete(api.id, api.name)}
                              className="flex items-center gap-2"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>Delete</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Modal */}
      <AddApiModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        initialData={editingApi}
        onSuccess={(saved) => {
          setApis((prev) => {
            const exists = prev.some((a) => a.id === saved.id);
            if (exists) {
              return prev.map((a) => (a.id === saved.id ? saved : a));
            }
            return [saved, ...prev];
          });
        }}
      />

      {/* Reveal Key Modal */}
      <RevealKeyModal
        open={!!revealingApi}
        onOpenChange={(open) => !open && setRevealingApi(null)}
        api={revealingApi}
        onRotate={(apiId) => {
          const apiToRotate = apis.find((a) => a.id === apiId);
          if (apiToRotate) {
            setEditingApi(apiToRotate);
            setAddModalOpen(true);
          }
        }}
      />
    </div>
  );
};
