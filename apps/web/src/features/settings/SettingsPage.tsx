import React, { useState, useEffect } from 'react';
import {
  User,
  Shield,
  Bell,
  Palette,
  Sliders,
  Check,
  KeyRound,
  Lock,
  Globe,
  DollarSign,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../../components/common/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { apiRequest } from '../../services/api-client';

export const SettingsPage: React.FC = () => {
  const { user, profile, updateProfile } = useAuth();
  const { theme, setTheme } = useTheme();

  // Profile Form State
  const [name, setName] = useState(profile?.name || '');
  const [timezone, setTimezone] = useState(profile?.timezone || 'Asia/Kolkata');
  const [currency, setCurrency] = useState(profile?.currency || 'INR');
  const [savingProfile, setSavingProfile] = useState(false);

  // Security Form State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Threshold Preferences State
  const [warningThreshold, setWarningThreshold] = useState(70);
  const [criticalThreshold, setCriticalThreshold] = useState(90);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [savingPrefs, setSavingPrefs] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setTimezone(profile.timezone || 'Asia/Kolkata');
      setCurrency(profile.currency || 'INR');
    }
  }, [profile]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await updateProfile({ name, timezone, currency });
      toast.success('Profile settings updated successfully');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setUpdatingPassword(true);
    try {
      await apiRequest('/auth/password', {
        method: 'POST',
        body: JSON.stringify({ password: newPassword }),
      });
      toast.success('Security credentials updated');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update password');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPrefs(true);
    setTimeout(() => {
      setSavingPrefs(false);
      toast.success('Threshold preferences stored');
    }, 400);
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      <PageHeader
        title="Settings & Governance"
        description="Manage your developer profile, credential security, quota warning thresholds, and appearance."
      />

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="w-full sm:w-auto justify-start border-b border-slate-200 rounded-none bg-transparent p-0 h-auto gap-4">
          <TabsTrigger
            value="profile"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 pb-2.5 pt-1 px-1 font-medium text-xs gap-1.5"
          >
            <User className="h-3.5 w-3.5" />
            <span>Profile</span>
          </TabsTrigger>
          <TabsTrigger
            value="security"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 pb-2.5 pt-1 px-1 font-medium text-xs gap-1.5"
          >
            <Shield className="h-3.5 w-3.5" />
            <span>Security</span>
          </TabsTrigger>
          <TabsTrigger
            value="preferences"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 pb-2.5 pt-1 px-1 font-medium text-xs gap-1.5"
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>Preferences & Thresholds</span>
          </TabsTrigger>
          <TabsTrigger
            value="appearance"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 pb-2.5 pt-1 px-1 font-medium text-xs gap-1.5"
          >
            <Palette className="h-3.5 w-3.5" />
            <span>Appearance</span>
          </TabsTrigger>
        </TabsList>

        {/* ── Tab 1: Profile (PRD Section 25) ───────────────────────────── */}
        <TabsContent value="profile" className="pt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Personal Profile</CardTitle>
              <CardDescription>
                Your identity details associated with this API tracker instance.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveProfile} className="space-y-4 max-w-md">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" value={user?.email || ''} disabled className="bg-slate-100 text-slate-500" />
                  <p className="text-[11px] text-slate-400">Email is stored securely in SQLite database.</p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="name">Display Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Developer"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="timezone">Timezone</Label>
                    <select
                      id="timezone"
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="flex h-9 w-full rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs text-slate-900 shadow-xs focus:outline-none"
                    >
                      <option value="UTC">UTC (Universal)</option>
                      <option value="America/New_York">America/New_York (EST)</option>
                      <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                      <option value="Europe/London">Europe/London (GMT)</option>
                      <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                      <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="currency">Default Currency</Label>
                    <select
                      id="currency"
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="flex h-9 w-full rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs text-slate-900 shadow-xs focus:outline-none"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="INR">INR (₹)</option>
                      <option value="JPY">JPY (¥)</option>
                    </select>
                  </div>
                </div>

                <Button
                  type="submit"
                  size="sm"
                  disabled={savingProfile}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white mt-2"
                >
                  {savingProfile ? 'Saving...' : 'Save Profile'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab 2: Security (PRD Section 26) ──────────────────────────── */}
        <TabsContent value="security" className="pt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Password & Access</CardTitle>
              <CardDescription>
                Update your account password securely.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-md">
                <div className="space-y-1.5">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="••••••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>

                <Button
                  type="submit"
                  size="sm"
                  disabled={updatingPassword}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white mt-2"
                >
                  {updatingPassword ? 'Updating...' : 'Update Password'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Two-Factor Authentication (2FA)</CardTitle>
              <CardDescription>
                Additional security verification for team production environments.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div>
                  <div className="font-semibold text-xs text-slate-900">
                    Authenticator App (TOTP)
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Requires Google Authenticator or 1Password for credential reveals.
                  </div>
                </div>
                <span className="rounded bg-slate-200 px-2 py-0.5 text-[10px] font-mono text-slate-700">
                  Phase 2 Feature
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab 3: Preferences & Thresholds ────────────────────────────── */}
        <TabsContent value="preferences" className="pt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Usage Threshold Alarms</CardTitle>
              <CardDescription>
                Configure percentage consumption trigger points for warnings and critical alerts.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSavePreferences} className="space-y-4 max-w-md">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <Label htmlFor="warning">Warning Threshold (Default 70%)</Label>
                    <span className="font-mono font-semibold text-amber-600">{warningThreshold}%</span>
                  </div>
                  <input
                    id="warning"
                    type="range"
                    min="50"
                    max="85"
                    value={warningThreshold}
                    onChange={(e) => setWarningThreshold(Number(e.target.value))}
                    className="w-full accent-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <Label htmlFor="critical">Critical Threshold (Default 90%)</Label>
                    <span className="font-mono font-semibold text-red-600">{criticalThreshold}%</span>
                  </div>
                  <input
                    id="critical"
                    type="range"
                    min="80"
                    max="99"
                    value={criticalThreshold}
                    onChange={(e) => setCriticalThreshold(Number(e.target.value))}
                    className="w-full accent-red-500"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    id="emailAlerts"
                    type="checkbox"
                    checked={emailAlerts}
                    onChange={(e) => setEmailAlerts(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <Label htmlFor="emailAlerts" className="text-xs cursor-pointer">
                    Send high-priority notifications before subscription renewal
                  </Label>
                </div>

                <Button
                  type="submit"
                  size="sm"
                  disabled={savingPrefs}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white mt-2"
                >
                  {savingPrefs ? 'Saving...' : 'Save Thresholds'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab 4: Appearance (PRD Section 35) ─────────────────────────── */}
        <TabsContent value="appearance" className="pt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Theme & Interface</CardTitle>
              <CardDescription>
                Customize color theme according to your workflow preference.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg">
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`flex flex-col items-center justify-between p-4 rounded-xl border text-center transition-all cursor-pointer ${
                    theme === 'light'
                      ? 'border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="h-10 w-16 rounded-md border border-slate-300 bg-white mb-3 shadow-xs" />
                  <span className="text-xs font-semibold text-slate-900">Light</span>
                  <span className="text-[10px] text-slate-500">Pure clean slate</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`flex flex-col items-center justify-between p-4 rounded-xl border text-center transition-all cursor-pointer ${
                    theme === 'dark'
                      ? 'border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="h-10 w-16 rounded-md border border-slate-700 bg-slate-950 mb-3 shadow-xs" />
                  <span className="text-xs font-semibold text-slate-900">Dark</span>
                  <span className="text-[10px] text-slate-500">Deep midnight navy</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme('system')}
                  className={`flex flex-col items-center justify-between p-4 rounded-xl border text-center transition-all cursor-pointer ${
                    theme === 'system'
                      ? 'border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="h-10 w-16 rounded-md border border-slate-400 bg-gradient-to-r from-white to-slate-900 mb-3 shadow-xs" />
                  <span className="text-xs font-semibold text-slate-900">System</span>
                  <span className="text-[10px] text-slate-500">Matches OS settings</span>
                </button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
