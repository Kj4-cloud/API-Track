import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, ArrowRight, ShieldCheck, KeyRound, BarChart3, AlertCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { toast } from 'sonner';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const { error } = await signIn(email, password);
    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
      toast.error(error.message);
    } else {
      toast.success('Signed in successfully');
      navigate(from, { replace: true });
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      {/* Left Column — Value Proposition & Developer Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-slate-900 p-12 text-white relative overflow-hidden">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#6366F1_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold tracking-tight">API Tracker</h2>
            <p className="text-xs text-slate-400">Enterprise Control Panel</p>
          </div>
        </div>

        <div className="relative z-10 my-auto max-w-md space-y-6">
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl leading-tight">
            Manage APIs. <br />
            Track usage. <br />
            <span className="text-indigo-400">Control subscriptions.</span>
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Consolidate OpenAI, Anthropic, AWS, Supabase, and Stripe credentials into one secure, unified developer control center.
          </p>

          <div className="space-y-3 pt-4 border-t border-slate-800">
            <div className="flex items-center gap-3 text-xs text-slate-300">
              <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Masked credentials with Row Level Security</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-300">
              <KeyRound className="h-4 w-4 text-indigo-400 shrink-0" />
              <span>Threshold alarms and expiration warnings</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-300">
              <BarChart3 className="h-4 w-4 text-teal-400 shrink-0" />
              <span>Real-time spending and token usage analytics</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-slate-500">
          Built for modern engineering teams & independent developers.
        </div>
      </div>

      {/* Right Column — Professional Sign-in Form */}
      <div className="flex flex-1 flex-col justify-center px-6 py-12 sm:px-12 lg:px-16 bg-white">
        <div className="mx-auto w-full max-w-sm">
          {/* Mobile brand header */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="font-semibold text-slate-900">API Tracker</span>
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-semibold tracking-tight text-slate-900">
              Welcome back
            </h2>
            <p className="text-xs text-slate-500">
              Enter your credentials to access your API dashboard.
            </p>
          </div>

          {errorMsg && (
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="developer@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <a
                  href="#forgot"
                  onClick={(e) => {
                    e.preventDefault();
                    toast.info('Password reset is sent via your configured Supabase Auth email.');
                  }}
                  className="text-[11px] text-indigo-600 hover:underline"
                >
                  Forgot password?
                </a>
              </div>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-2.5 shadow-xs"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          {/* Quick Demo Access Credentials Helper */}
          <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs">
            <p className="font-medium text-slate-700">College Demo Tip:</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Don't have an account? Click below to create one instantly, or use any test email with a 6+ char password.
            </p>
          </div>

          <div className="mt-6 text-center text-xs text-slate-500">
            Don't have an account?{' '}
            <NavLink
              to="/auth/register"
              className="font-medium text-indigo-600 hover:underline inline-flex items-center gap-1"
            >
              Create account <ArrowRight className="h-3 w-3" />
            </NavLink>
          </div>
        </div>
      </div>
    </div>
  );
};
