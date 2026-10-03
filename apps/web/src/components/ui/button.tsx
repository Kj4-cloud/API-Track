import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600/40 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer',
  {
    variants: {
      variant: {
        default:
          'bg-indigo-600 text-white hover:bg-indigo-700 shadow-[0_1px_2px_0_rgba(15,23,42,0.08)]',
        primary:
          'bg-indigo-600 text-white hover:bg-indigo-700 shadow-[0_1px_2px_0_rgba(15,23,42,0.08)]',
        secondary:
          'bg-teal-700 text-white hover:bg-teal-800 shadow-[0_1px_2px_0_rgba(15,23,42,0.08)]',
        destructive:
          'bg-red-600 text-white hover:bg-red-700 shadow-[0_1px_2px_0_rgba(15,23,42,0.08)]',
        outline:
          'border border-slate-200 bg-white hover:bg-slate-50 hover:text-slate-900 text-slate-700 shadow-[0_1px_2px_0_rgba(15,23,42,0.02)]',
        subtle:
          'bg-slate-100 text-slate-900 hover:bg-slate-200/80',
        ghost:
          'hover:bg-slate-100 text-slate-700',
        link: 'text-indigo-600 underline-offset-4 hover:underline p-0 h-auto',
      },
      size: {
        default: 'h-8.5 px-3 py-1.5',
        sm: 'h-7.5 px-2.5 text-xs',
        lg: 'h-9.5 px-4 text-sm',
        icon: 'h-8.5 w-8.5 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
