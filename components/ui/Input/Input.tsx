import type { InputHTMLAttributes } from 'react';

export const Input = ({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) => (
  <input
    className={`h-11 w-full rounded-sm border border-input-border bg-input px-6${className ? ` ${className}` : ''}`}
    {...props}
  />
);
