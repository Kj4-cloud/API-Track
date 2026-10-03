import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Menu,
  Search,
  Bell,
  Sun,
  Moon,
  Plus,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  KeyRound,
} from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { notificationsService } from '../../services/notifications';
import type { Notification } from '../../types';

interface TopBarProps {
  onOpenMobile: () => void;
  onOpenSearch: () => void;
  onQuickAddApi?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  onOpenMobile,
  onOpenSearch,
}) => {
  const { resolvedTheme, setTheme } = useTheme();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const data = await notificationsService.getAll();
      setNotifications(data.slice(0, 5));
      const unread = data.filter((n) => !n.is_read).length;
      setUnreadCount(unread);
    } catch {
      // Ignored for non-logged-in
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await notificationsService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
      {/* Left section: Hamburger for Mobile + Search Trigger */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobile}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 lg:hidden cursor-pointer"
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Global Search Shortcut Button */}
        <button
          onClick={onOpenSearch}
          className="flex h-9 items-center gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 text-xs text-slate-500 hover:border-slate-300 hover:bg-slate-100/80 cursor-pointer sm:w-64"
        >
          <Search className="h-3.5 w-3.5 text-slate-400" />
          <span className="hidden sm:inline">Search anything...</span>
          <span className="sm:hidden">Search...</span>
          <kbd className="ml-auto hidden rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-mono text-slate-500 sm:inline-block">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right section: Quick actions, notifications, theme toggle */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Add Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-xs">
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Add New</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-white border border-slate-200">
            <DropdownMenuItem asChild>
              <NavLink to="/apis?action=new" className="flex items-center gap-2 text-slate-700 hover:bg-slate-50">
                <KeyRound className="h-3.5 w-3.5 text-indigo-600" />
                <span>Add API Service</span>
              </NavLink>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <NavLink to="/subscriptions?action=new" className="flex items-center gap-2 text-slate-700 hover:bg-slate-50">
                <CreditCard className="h-3.5 w-3.5 text-teal-700" />
                <span>Add Subscription</span>
              </NavLink>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notifications Popover Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="relative flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
              aria-label="View notifications"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-bold text-white shadow-xs">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-0 shadow-lg bg-white border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-900">
                  Notifications
                </span>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-indigo-50 px-1.5 py-0.5 text-[10px] font-medium text-indigo-700">
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-[11px] text-slate-500 hover:text-indigo-600 cursor-pointer"
                >
                  Mark all as read
                </button>
              )}
            </div>

            <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  No notifications yet.
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`flex items-start gap-3 p-3 transition-colors ${
                      !n.is_read
                        ? 'bg-indigo-50/50'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {n.type === 'renewal' && (
                        <CreditCard className="h-4 w-4 text-amber-600" />
                      )}
                      {n.type === 'usage_warning' && (
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                      )}
                      {n.type === 'system' && (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      )}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-xs font-medium text-slate-900 leading-snug">
                        {n.title}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-500 line-clamp-2">
                        {n.message}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <DropdownMenuSeparator className="m-0 border-slate-100" />
            <div className="p-2 text-center">
              <NavLink
                to="/notifications"
                className="text-xs font-medium text-indigo-600 hover:underline"
              >
                View all notifications
              </NavLink>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Theme Toggle Button */}
        <button
          onClick={() =>
            setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
          }
          className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
          aria-label="Toggle theme"
          title={`Switch to ${resolvedTheme === 'dark' ? 'White' : 'Dark'} mode`}
        >
          {resolvedTheme === 'dark' ? (
            <Sun className="h-4 w-4 text-amber-500" />
          ) : (
            <Moon className="h-4 w-4 text-slate-600" />
          )}
        </button>
      </div>
    </header>
  );
};
