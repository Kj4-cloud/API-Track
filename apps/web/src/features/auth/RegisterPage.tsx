import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { toast } from 'sonner';

export const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name) {
      toast.error('Please fill in all fields');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const { error } = await signUp(email, password, name);
    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
      toast.error(error.message);
    } else {
      toast.success('Account created! Welcome to API Tracker.');
      navigate('/dashboard');
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      {/* Left Column — Value Proposition */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-slate-900 p-12 text-white relative overflow-hidden">
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
            Stop losing track of <br />
            API credits and <br />
            <span className="text-indigo-400">surprise charges.</span>
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Create your account to organize tokens, monitor monthly costs, and receive renewal alerts before credit cards get charged.
          </p>

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
              <ShieldCheck className="h-4 w-4" />
              <span>Free Developer Tier Included</span>
            </div>
            <p className="text-xs text-slate-400">
              Includes unlimited API keys, credential masking, threshold alerts, and usage analytics.
            </p>
          </div>
        </div>

        <div className="relative z-10 text-xs text-slate-500">
          Encrypted with Supabase PostgreSQL Row Level Security.
        </div>
      </div>

      {/* Right Column — Registration Form */}
      <div className="flex flex-1 flex-col justify-center px-6 py-12 sm:px-12 lg:px-16 bg-white">
        <div className="mx-auto w-full max-w-sm">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold tracking-tight text-slate-900">
              Create an account
            </h2>
            <p className="text-xs text-slate-500">
              Get started with API Tracker in seconds.
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
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Alex Developer"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Work Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="alex@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password (min. 6 characters)</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 shadow-xs"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500">
            Already have an account?{' '}
            <NavLink
              to="/auth/login"
              className="font-medium text-indigo-600 hover:underline inline-flex items-center gap-1"
            >
              Sign In <ArrowRight className="h-3 w-3" />
            </NavLink>
          </div>
        </div>
      </div>
    </div>
  );
};
