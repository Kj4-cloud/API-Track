import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Activity } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { useAuth } from '../../hooks/useAuth';
import { usageService } from '../../services/usage';
import { apiServicesService } from '../../services/api-services';
import { notificationsService } from '../../services/notifications';
import type { ApiService, UsageLog, UsageLogFormData } from '../../types';

const usageSchema = z.object({
  api_id: z.string().min(1, 'Please select an API service'),
  date: z.string().min(1, 'Date is required'),
  requests: z.coerce.number().min(0).default(0),
  tokens_used: z.coerce.number().min(0).default(0),
  credits_used: z.coerce.number().min(0).default(0),
  cost: z.coerce.number().min(0).default(0),
});

type UsageFormValues = z.infer<typeof usageSchema>;

interface AddUsageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (log: UsageLog) => void;
}

export const AddUsageModal: React.FC<AddUsageModalProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [apis, setApis] = useState<ApiService[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      apiServicesService.getAll().then(setApis).catch(console.error);
    }
  }, [open]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UsageFormValues>({
    resolver: zodResolver(usageSchema) as any,
    defaultValues: {
      api_id: '',
      date: new Date().toISOString().split('T')[0],
      requests: 0,
      tokens_used: 0,
      credits_used: 0,
      cost: 0,
    },
  });

  const onSubmit = async (values: UsageFormValues) => {
    if (!user) return;
    setSubmitting(true);
    try {
      const created = await usageService.create(user.id, values as UsageLogFormData);
      
      const targetApi = apis.find((a) => a.id === values.api_id);
      if (targetApi) {
        const newTotal = (targetApi.tokens_used || 0) + values.tokens_used;
        await apiServicesService.updateUsage(values.api_id, newTotal);

        // Automated threshold notification logic (PRD Section 12)
        if (targetApi.token_limit > 0) {
          const pct = Math.round((newTotal / targetApi.token_limit) * 100);
          if (pct >= 100) {
            await notificationsService.create(user.id, {
              type: 'usage_warning',
              title: `Quota Exceeded: ${targetApi.provider} (${targetApi.name})`,
              message: `Token consumption reached ${newTotal.toLocaleString()} of ${targetApi.token_limit.toLocaleString()} limit (${pct}%). Immediate rotation or plan upgrade required.`,
              link: `/apis/${targetApi.id}`,
            }).catch(console.error);
          } else if (pct >= 85) {
            await notificationsService.create(user.id, {
              type: 'usage_warning',
              title: `Quota Warning: ${targetApi.provider} (${targetApi.name}) at ${pct}%`,
              message: `Token consumption has reached ${newTotal.toLocaleString()} of ${targetApi.token_limit.toLocaleString()} configured capacity.`,
              link: `/apis/${targetApi.id}`,
            }).catch(console.error);
          }
        }
      }

      toast.success('Daily usage recorded successfully');
      onSuccess(created);
      reset();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to record usage');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle>Record API Usage</DialogTitle>
              <p className="mt-0.5 text-xs text-slate-500">
                Log request volume, token throughput, and daily expense in Rupees (₹).
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          {/* API Selection */}
          <div className="space-y-1.5">
            <Label htmlFor="api_id">API Service *</Label>
            <select
              id="api_id"
              {...register('api_id')}
              className="flex h-9 w-full rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs text-slate-900 shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">Select an API service...</option>
              {apis.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.provider} — {a.name} ({a.environment})
                </option>
              ))}
            </select>
            {errors.api_id && (
              <p className="text-[11px] text-red-500">{errors.api_id.message}</p>
            )}
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <Label htmlFor="date">Date *</Label>
            <Input id="date" type="date" {...register('date')} />
          </div>

          {/* Requests & Tokens */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="requests">Requests Count</Label>
              <Input
                id="requests"
                type="number"
                placeholder="12480"
                {...register('requests')}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tokens_used">Tokens Consumed</Label>
              <Input
                id="tokens_used"
                type="number"
                placeholder="240000"
                {...register('tokens_used')}
              />
            </div>
          </div>

          {/* Credits & Cost in INR */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="credits_used">Credits Used</Label>
              <Input
                id="credits_used"
                type="number"
                step="0.01"
                placeholder="14.50"
                {...register('credits_used')}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cost">Calculated Cost (₹)</Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                placeholder="380.00"
                {...register('cost')}
              />
            </div>
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
              {submitting ? 'Recording...' : 'Log Usage'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
