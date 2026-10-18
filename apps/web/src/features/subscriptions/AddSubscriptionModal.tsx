import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { useAuth } from '../../hooks/useAuth';
import { subscriptionsService } from '../../services/subscriptions';
import { apiServicesService } from '../../services/api-services';
import type { Subscription, SubscriptionFormData, ApiService } from '../../types';
import { BILLING_CYCLES } from '../../constants';

const subscriptionSchema = z.object({
  api_id: z.string().optional(),
  plan_name: z.string().min(1, 'Plan name is required'),
  price: z.coerce.number().min(0, 'Price must be positive'),
  currency: z.string().default('INR'),
  billing_cycle: z.enum(['monthly', 'quarterly', 'yearly', 'one-time']),
  start_date: z.string().min(1, 'Start date is required'),
  renewal_date: z.string().optional(),
  auto_renew: z.boolean().default(true),
  payment_method: z.string().optional(),
});

type SubscriptionFormValues = z.infer<typeof subscriptionSchema>;

interface AddSubscriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (sub: Subscription) => void;
  initialData?: Subscription | null;
  defaultApiId?: string;
}

export const AddSubscriptionModal: React.FC<AddSubscriptionModalProps> = ({
  open,
  onOpenChange,
  onSuccess,
  initialData,
  defaultApiId,
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
  } = useForm<SubscriptionFormValues>({
    resolver: zodResolver(subscriptionSchema) as any,
    defaultValues: {
      api_id: initialData?.api_id || defaultApiId || '',
      plan_name: initialData?.plan_name || '',
      price: initialData?.price ?? 0,
      currency: initialData?.currency || 'INR',
      billing_cycle: initialData?.billing_cycle || 'monthly',
      start_date: initialData?.start_date || new Date().toISOString().split('T')[0],
      renewal_date: initialData?.renewal_date || '',
      auto_renew: initialData?.auto_renew ?? true,
      payment_method: initialData?.payment_method || '',
    },
  });

  const onSubmit = async (values: SubscriptionFormValues) => {
    if (!user) return;
    setSubmitting(true);
    try {
      if (initialData) {
        const updated = await subscriptionsService.update(
          initialData.id,
          values as SubscriptionFormData
        );
        toast.success('Subscription updated successfully');
        onSuccess(updated);
      } else {
        const created = await subscriptionsService.create(
          user.id,
          values as SubscriptionFormData
        );
        toast.success('Subscription added to tracker');
        onSuccess(created);
      }
      reset();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save subscription');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/10 text-teal-600">
              <CreditCard className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle>
                {initialData ? 'Edit Subscription' : 'Add Subscription'}
              </DialogTitle>
              <p className="mt-0.5 text-xs text-slate-500">
                Track recurring charges in Rupees (₹), renewals, and auto-renew status.
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          {/* Linked API Service */}
          <div className="space-y-1.5">
            <Label htmlFor="api_id">Associated API Service (optional)</Label>
            <select
              id="api_id"
              {...register('api_id')}
              className="flex h-9 w-full rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs text-slate-900 shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">None (Independent Subscription)</option>
              {apis.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.provider} — {a.name} ({a.environment})
                </option>
              ))}
            </select>
          </div>

          {/* Plan Name */}
          <div className="space-y-1.5">
            <Label htmlFor="plan_name">Plan / Tier Name *</Label>
            <Input
              id="plan_name"
              placeholder="e.g. Pro, Team, Developer Tier"
              {...register('plan_name')}
              error={!!errors.plan_name}
            />
            {errors.plan_name && (
              <p className="text-[11px] text-red-500">{errors.plan_name.message}</p>
            )}
          </div>

          {/* Price & Billing Cycle */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="price">Price (₹) *</Label>
              <Input
                id="price"
                type="number"
                step="1"
                placeholder="1650"
                {...register('price')}
                error={!!errors.price}
              />
              {errors.price && (
                <p className="text-[11px] text-red-500">{errors.price.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="billing_cycle">Billing Cycle *</Label>
              <select
                id="billing_cycle"
                {...register('billing_cycle')}
                className="flex h-9 w-full rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs text-slate-900 shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                {BILLING_CYCLES.map((cycle) => (
                  <option key={cycle} value={cycle}>
                    {cycle.charAt(0).toUpperCase() + cycle.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Start Date & Renewal Date */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="start_date">Start Date *</Label>
              <Input
                id="start_date"
                type="date"
                {...register('start_date')}
                error={!!errors.start_date}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="renewal_date">Next Renewal Date</Label>
              <Input
                id="renewal_date"
                type="date"
                {...register('renewal_date')}
              />
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-1.5">
            <Label htmlFor="payment_method">Payment Method</Label>
            <Input
              id="payment_method"
              placeholder="e.g. Corporate HDFC / UPI AutoPay"
              {...register('payment_method')}
            />
          </div>

          {/* Auto Renew Checkbox */}
          <div className="flex items-center gap-2 pt-1">
            <input
              id="auto_renew"
              type="checkbox"
              {...register('auto_renew')}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <Label htmlFor="auto_renew" className="cursor-pointer text-xs">
              Auto-renew active for this subscription
            </Label>
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
              {submitting ? 'Saving...' : initialData ? 'Update Plan' : 'Save Subscription'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
