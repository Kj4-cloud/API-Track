import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { KeyRound, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { useAuth } from '../../hooks/useAuth';
import { apiServicesService } from '../../services/api-services';
import type { ApiService, ApiServiceFormData } from '../../types';
import { CATEGORIES, ENVIRONMENTS } from '../../constants';

const apiSchema = z.object({
  provider: z.string().min(1, 'Provider name is required'),
  name: z.string().min(1, 'Service name is required'),
  category: z.string().min(1, 'Category is required'),
  website: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  environment: z.enum(['development', 'staging', 'production']),
  api_key: z.string().optional(),
  token_limit: z.coerce.number().min(0).optional(),
  notes: z.string().optional(),
});

type ApiFormValues = z.infer<typeof apiSchema>;

interface AddApiModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (api: ApiService) => void;
  initialData?: ApiService | null;
}

export const AddApiModal: React.FC<AddApiModalProps> = ({
  open,
  onOpenChange,
  onSuccess,
  initialData,
}) => {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ApiFormValues>({
    resolver: zodResolver(apiSchema) as any,
    defaultValues: {
      provider: initialData?.provider || '',
      name: initialData?.name || '',
      category: initialData?.category || 'AI',
      website: initialData?.website || '',
      environment: initialData?.environment || 'development',
      api_key: initialData?.api_key_encrypted || '',
      token_limit: initialData?.token_limit || 0,
      notes: initialData?.notes || '',
    },
  });

  const onSubmit = async (values: ApiFormValues) => {
    if (!user) return;
    setSubmitting(true);
    try {
      if (initialData) {
        const updated = await apiServicesService.update(initialData.id, values as ApiServiceFormData);
        toast.success('API service updated successfully');
        onSuccess(updated);
      } else {
        const created = await apiServicesService.create(user.id, values as ApiServiceFormData);
        toast.success('API service added to vault');
        onSuccess(created);
      }
      reset();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save API service');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <KeyRound className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle>
                {initialData ? 'Edit API Service' : 'Add API Service'}
              </DialogTitle>
              <p className="mt-0.5 text-xs text-slate-500">
                Register credentials and environment limits into your vault.
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          {/* Provider & Service Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="provider">Provider *</Label>
              <Input
                id="provider"
                placeholder="e.g. OpenAI, AWS, Stripe"
                {...register('provider')}
                error={!!errors.provider}
              />
              {errors.provider && (
                <p className="text-[11px] text-red-500">{errors.provider.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="name">Service Name *</Label>
              <Input
                id="name"
                placeholder="e.g. GPT-4o API, SES, S3"
                {...register('name')}
                error={!!errors.name}
              />
              {errors.name && (
                <p className="text-[11px] text-red-500">{errors.name.message}</p>
              )}
            </div>
          </div>

          {/* Category & Environment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="category">Category *</Label>
              <select
                id="category"
                {...register('category')}
                className="flex h-9 w-full rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs text-slate-900 shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="environment">Environment *</Label>
              <select
                id="environment"
                {...register('environment')}
                className="flex h-9 w-full rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs text-slate-900 shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                {ENVIRONMENTS.map((env) => (
                  <option key={env} value={env}>
                    {env.charAt(0).toUpperCase() + env.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Website / Documentation URL */}
          <div className="space-y-1.5">
            <Label htmlFor="website">Website / Console URL (optional)</Label>
            <Input
              id="website"
              placeholder="https://platform.openai.com/api-keys"
              {...register('website')}
              error={!!errors.website}
            />
            {errors.website && (
              <p className="text-[11px] text-red-500">{errors.website.message}</p>
            )}
          </div>

          {/* API Key credential */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="api_key">API Key / Secret Token</Label>
              <span className="text-[10px] text-slate-400">Masked & Protected</span>
            </div>
            <Input
              id="api_key"
              type="password"
              placeholder="sk-proj-••••••••••••••••••••••••"
              {...register('api_key')}
            />
            <p className="text-[11px] text-slate-500 flex items-center gap-1">
              <ShieldAlert className="h-3 w-3 text-emerald-500" />
              Credentials are protected by PostgreSQL Row Level Security.
            </p>
          </div>

          {/* Token Limit */}
          <div className="space-y-1.5">
            <Label htmlFor="token_limit">Monthly Token Limit (0 for unlimited)</Label>
            <Input
              id="token_limit"
              type="number"
              placeholder="1000000"
              {...register('token_limit')}
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes / Usage Rules (optional)</Label>
            <textarea
              id="notes"
              rows={2}
              placeholder="Primary key used by staging pipeline. Do not revoke before migration."
              {...register('notes')}
              className="flex w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-900 shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={submitting}
              className="bg-indigo-600 hover:bg-indigo-500 text-white"
            >
              {submitting ? 'Saving...' : initialData ? 'Update Service' : 'Add API to Vault'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
