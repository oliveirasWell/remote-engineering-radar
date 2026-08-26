import type { ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../cn';

const pageTitle = cva('text-3xl font-bold', {
  variants: {
    shadow: {
      none: '',
      panel: 'text-shadow-sm',
    },
  },
  defaultVariants: {
    shadow: 'none',
  },
});

type PageTitleProps = VariantProps<typeof pageTitle> & {
  as?: 'h1' | 'h2';
  children: ReactNode;
  className?: string;
};

export const PageTitle = ({
  as: Tag = 'h2',
  children,
  className,
  shadow,
}: PageTitleProps) => (
  <Tag className={cn(pageTitle({ shadow }), className)}>{children}</Tag>
);
