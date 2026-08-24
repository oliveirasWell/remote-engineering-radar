import type { InputHTMLAttributes } from 'react';
import { cn } from '../cn';

export const Input = ({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) => (
  <input
    className={cn(
      'h-11 w-full appearance-none rounded-sm border border-input-border bg-input px-6',
      className,
    )}
    {...props}
  />
);
