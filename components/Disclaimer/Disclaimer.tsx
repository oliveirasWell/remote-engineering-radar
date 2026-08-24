import type { ReactNode } from 'react';

type DisclaimerProps = {
  children: ReactNode;
  className?: string;
};

export const Disclaimer = ({ children, className }: DisclaimerProps) => (
  <div
    className={`flex flex-col gap-2 pt-6 text-xs leading-normal text-foreground [&_p]:m-0${className ? ` ${className}` : ''}`}
  >
    {children}
  </div>
);
