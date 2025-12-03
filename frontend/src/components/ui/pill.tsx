import type { ComponentProps, ReactNode } from 'react';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

export type PillProps = ComponentProps<'div'> & {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  themed?: boolean;
};

export const Pill = ({
  variant = 'secondary',
  themed = false,
  className,
  ...props
}: PillProps) => {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 text-xs font-normal',
        className
      )}
      {...props}
    />
  );
};

export type PillStatusProps = {
  children: ReactNode;
  className?: string;
};

export const PillStatus = ({
  children,
  className,
  ...props
}: PillStatusProps) => (
  <div
    className={cn(
      'flex items-center gap-2 border-r pr-2 font-medium',
      className
    )}
    {...props}
  >
    {children}
  </div>
);

export type PillIndicatorProps = {
  variant?: 'success' | 'error' | 'warning' | 'info';
  pulse?: boolean;
};

export const PillIndicator = ({
  variant = 'success',
  pulse = false,
}: PillIndicatorProps) => (
  <span className="relative flex size-2">
    {pulse && (
      <span
        className={cn(
          'absolute inline-flex h-full w-full animate-ping rounded-full opacity-75',
          variant === 'success' && 'bg-emerald-400',
          variant === 'error' && 'bg-rose-400',
          variant === 'warning' && 'bg-amber-400',
          variant === 'info' && 'bg-sky-400'
        )}
      />
    )}
    <span
      className={cn(
        'relative inline-flex size-2 rounded-full',
        variant === 'success' && 'bg-emerald-500',
        variant === 'error' && 'bg-rose-500',
        variant === 'warning' && 'bg-amber-500',
        variant === 'info' && 'bg-sky-500'
      )}
    />
  </span>
);

export type PillDeltaProps = {
  delta: number;
  className?: string;
};

export const PillDelta = ({ delta, className }: PillDeltaProps) => {
  if (delta > 0) {
    return (
      <span className={cn('inline-flex items-center', className)}>
        <ArrowUp className="h-3 w-3 text-emerald-600" />
      </span>
    );
  } else if (delta < 0) {
    return (
      <span className={cn('inline-flex items-center', className)}>
        <ArrowDown className="h-3 w-3 text-rose-600" />
      </span>
    );
  } else {
    return (
      <span className={cn('inline-flex items-center', className)}>
        <Minus className="h-3 w-3 text-gray-500" />
      </span>
    );
  }
};

