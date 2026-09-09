import { cn } from '@/components/ui/cn';
import { EN_MESSAGES } from '@/lib/i18n/messages';

const WORDMARK_LINES = EN_MESSAGES.app.name.split(' ');

export const SiteWordmark = ({ className }: { className?: string }) => (
  <span
    className={cn(
      'flex flex-col leading-[0.87] font-extrabold tracking-[-0.07em]',
      className,
    )}
  >
    <span className="sr-only">{EN_MESSAGES.app.name}</span>
    {WORDMARK_LINES.map((line) => (
      <span key={line} aria-hidden="true">
        {line}
      </span>
    ))}
  </span>
);
