import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-medium tracking-tight border',
  {
    variants: {
      variant: {
        default:
          'border-slate-200 bg-slate-100 text-slate-800',
        secondary:
          'border-slate-200 bg-white text-slate-700',
        outline:
          'border-slate-200 text-slate-600 bg-transparent',
        success:
          'border-emerald-200 bg-emerald-50 text-emerald-800',
        warning:
          'border-amber-200 bg-amber-50 text-amber-800',
        danger:
          'border-red-200 bg-red-50 text-red-800',
        indigo:
          'border-indigo-200 bg-indigo-50 text-indigo-800',
        teal:
          'border-teal-200 bg-teal-50 text-teal-800',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

function Badge({ className, variant, dot, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span
          className={cn(
            'inline-block h-1.5 w-1.5 rounded-full shrink-0',
            variant === 'success' && 'bg-emerald-600',
            variant === 'warning' && 'bg-amber-600',
            variant === 'danger' && 'bg-red-600',
            variant === 'indigo' && 'bg-indigo-600',
            variant === 'teal' && 'bg-teal-700',
            (!variant || variant === 'default' || variant === 'secondary' || variant === 'outline') && 'bg-slate-500'
          )}
        />
      )}
      {children}
    </div>
  );
}

export { Badge, badgeVariants };
