import type { ButtonHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../cn';

const button = cva('cursor-pointer rounded-xl px-3 py-2.5', {
  variants: {
    variant: {
      list: 'w-full border-0 bg-transparent text-left hover:bg-black/10',
      toggle:
        'border border-white/65 bg-transparent text-on-panel aria-[pressed=true]:bg-on-panel aria-[pressed=true]:text-foreground',
    },
  },
});

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant: NonNullable<VariantProps<typeof button>['variant']>;
};

export const Button = ({
  className,
  type = 'button',
  variant,
  ...props
}: ButtonProps) => (
  <button
    className={cn(button({ variant }), className)}
    type={type}
    {...props}
  />
);
