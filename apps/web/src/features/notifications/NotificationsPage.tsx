import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Bell,
  CreditCard,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Trash2,
  Check,
  ExternalLink,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../../components/common/PageHeader';
import { EmptyState } from '../../components/common/EmptyState';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { notificationsService } from '../../services/notifications';
import { useAuth } from '../../hooks/useAuth';
import type { Notification } from '../../types';

export const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const data = await notificationsService.getAll();
      setNotifications(data);
    } catch {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      toast.success('Marked as read');
    } catch {
      toast.error('Failed to update notification');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to update notifications');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await notificationsService.delete(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      toast.success('Notification removed');
    } catch {
      toast.error('Failed to delete notification');
    }
  };

  // Helper to generate a mock notification for testing/demonstration
  const handleGenerateTestAlert = async () => {
    if (!user) return;
    try {
      const created = await notificationsService.create(user.id, {
        type: 'renewal',
        title: 'OpenAI Pro renewal approaching',
        message: 'Your OpenAI Pro subscription renews in 3 days. Estimated cost: ₹1,650.00.',
        link: '/subscriptions',
      });
      setNotifications((prev) => [created, ...prev]);
      toast.success('Test renewal alert generated');
    } catch (e: any) {
      toast.error('Failed to generate alert');
    }
  };

  const filtered = notifications.filter(
    (n) => filterType === 'all' || n.type === filterType
  );

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      <PageHeader
        title="Notification Center"
        description="Threshold warnings, subscription renewal reminders, and security alerts."
      >
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              onClick={handleMarkAllRead}
              variant="outline"
              size="sm"
              className="text-xs border-slate-200"
            >
              <Check className="h-3.5 w-3.5 mr-1 text-emerald-500" />
              <span>Mark all read</span>
            </Button>
          )}

          <Button
            onClick={handleGenerateTestAlert}
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            <span>Generate Test Alert</span>
          </Button>
        </div>
      </PageHeader>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 text-xs">
        <button
          onClick={() => setFilterType('all')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
            filterType === 'all'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilterType('renewal')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
            filterType === 'renewal'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Renewals
        </button>
        <button
          onClick={() => setFilterType('usage_warning')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
            filterType === 'usage_warning'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Usage Warnings
        </button>
        <button
          onClick={() => setFilterType('security')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
            filterType === 'security'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Security
        </button>
      </div>

      {/* Notifications List */}
      {filtered.length === 0 && !loading ? (
        <EmptyState
          icon={Bell}
          title="No notifications in stream"
          description="You're all caught up! Automated warnings appear when quotas approach 70% or subscriptions renew."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const isUnread = !item.is_read;
            return (
              <Card
                key={item.id}
                className={`transition-all ${
                  isUnread
                    ? 'border-indigo-200 bg-indigo-50/20'
                    : 'opacity-85'
                }`}
              >
                <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white shadow-xs border border-slate-200">
                      {item.type === 'renewal' && (
                        <CreditCard className="h-4 w-4 text-amber-500" />
                      )}
                      {item.type === 'usage_warning' && (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      )}
                      {item.type === 'token_limit' && (
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                      )}
                      {item.type === 'security' && (
                        <ShieldAlert className="h-4 w-4 text-purple-500" />
                      )}
                      {item.type === 'system' && (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-xs text-slate-900">
                          {item.title}
                        </h3>
                        {isUnread && (
                          <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
                        )}
                        <span className="text-[10px] text-slate-400">
                          {new Date(item.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-600 leading-relaxed">
                        {item.message}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {item.link && (
                      <Button asChild variant="outline" size="sm" className="h-7 text-xs">
                        <NavLink to={item.link}>
                          <ExternalLink className="h-3 w-3 mr-1" />
                          <span>View</span>
                        </NavLink>
                      </Button>
                    )}

                    {isUnread && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-slate-600 hover:text-indigo-600"
                        onClick={() => handleMarkAsRead(item.id)}
                      >
                        <Check className="h-3 w-3 mr-1" />
                        <span>Mark read</span>
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-slate-400 hover:text-red-600"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
