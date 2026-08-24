import type { ReactNode } from 'react';
import { cn } from '@/components/ui/cn';

type DisclaimerProps = {
  children: ReactNode;
  className?: string;
};

export const Disclaimer = ({ children, className }: DisclaimerProps) => (
  <div
    className={cn(
      'flex flex-col gap-2 pt-6 text-xs leading-normal text-foreground [&_p]:m-0',
      className,
    )}
  >
    {children}
  </div>
);
