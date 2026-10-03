import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  KeyRound,
  CreditCard,
  Activity,
  Bell,
  Settings,
  ArrowRight,
} from 'lucide-react';
import { Dialog, DialogContent } from '../ui/dialog';
import { apiServicesService } from '../../services/api-services';
import { subscriptionsService } from '../../services/subscriptions';
import type { ApiService, Subscription } from '../../types';

interface CommandSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CommandSearch: React.FC<CommandSearchProps> = ({
  open,
  onOpenChange,
}) => {
  const [query, setQuery] = useState('');
  const [apis, setApis] = useState<ApiService[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) {
      setQuery('');
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const [apiData, subData] = await Promise.all([
          apiServicesService.getAll(),
          subscriptionsService.getAll(),
        ]);
        setApis(apiData);
        setSubscriptions(subData);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [open]);

  const filteredApis = apis.filter(
    (a) =>
      a.name.toLowerCase().includes(query.toLowerCase()) ||
      a.provider.toLowerCase().includes(query.toLowerCase()) ||
      a.category.toLowerCase().includes(query.toLowerCase())
  );

  const filteredSubscriptions = subscriptions.filter(
    (s) =>
      s.plan_name.toLowerCase().includes(query.toLowerCase()) ||
      s.api_service?.provider.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (path: string) => {
    onOpenChange(false);
    navigate(path);
  };

  const navShortcuts = [
    { label: 'Overview Dashboard', path: '/dashboard', icon: Activity },
    { label: 'API Inventory', path: '/apis', icon: KeyRound },
    { label: 'Subscriptions & Renewals', path: '/subscriptions', icon: CreditCard },
    { label: 'Usage Tracking', path: '/usage', icon: Activity },
    { label: 'Notifications', path: '/notifications', icon: Bell },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 overflow-hidden max-w-xl border-slate-200 shadow-2xl">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 border-b border-slate-200">
          <Search className="h-4 w-4 text-slate-400 shrink-0" />
          <input
            autoFocus
            type="text"
            placeholder="Search APIs, subscriptions, providers, or pages... (Esc to close)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent px-3 py-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          <kbd className="hidden sm:inline-block rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono text-slate-500">
            ESC
          </kbd>
        </div>

        {/* Search Results List */}
        <div className="max-h-[360px] overflow-y-auto p-2 space-y-4">
          {/* Quick Navigation Shortcuts */}
          {query.trim() === '' && (
            <div>
              <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Quick Navigation
              </div>
              <div className="mt-1 space-y-0.5">
                {navShortcuts.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.path}
                      onClick={() => handleSelect(item.path)}
                      className="flex w-full items-center justify-between rounded-md px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="h-4 w-4 text-slate-400" />
                        <span>{item.label}</span>
                      </div>
                      <ArrowRight className="h-3 w-3 text-slate-400" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* APIs Results */}
          {filteredApis.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                APIs ({filteredApis.length})
              </div>
              <div className="mt-1 space-y-0.5">
                {filteredApis.slice(0, 5).map((api) => (
                  <button
                    key={api.id}
                    onClick={() => handleSelect(`/apis/${api.id}`)}
                    className="flex w-full items-center justify-between rounded-md px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-900 cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <KeyRound className="h-3.5 w-3.5 text-indigo-500" />
                      <span className="font-semibold text-slate-900">
                        {api.provider}
                      </span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-500">
                        {api.name}
                      </span>
                    </div>
                    <span className="text-[10px] rounded bg-slate-100 px-1.5 py-0.5 text-slate-600">
                      {api.environment}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Subscriptions Results */}
          {filteredSubscriptions.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Subscriptions ({filteredSubscriptions.length})
              </div>
              <div className="mt-1 space-y-0.5">
                {filteredSubscriptions.slice(0, 5).map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => handleSelect('/subscriptions')}
                    className="flex w-full items-center justify-between rounded-md px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-teal-50 hover:text-teal-900 cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <CreditCard className="h-3.5 w-3.5 text-teal-500" />
                      <span className="font-semibold text-slate-900">
                        {sub.api_service?.provider || 'Custom Service'}
                      </span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-500">
                        {sub.plan_name}
                      </span>
                    </div>
                    <span className="text-xs font-mono font-medium text-slate-900">
                      ${sub.price}/{sub.billing_cycle === 'monthly' ? 'mo' : 'yr'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {query.trim() !== '' &&
            filteredApis.length === 0 &&
            filteredSubscriptions.length === 0 && (
              <div className="py-8 text-center text-xs text-slate-500">
                No matching APIs or subscriptions found for "{query}".
              </div>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
