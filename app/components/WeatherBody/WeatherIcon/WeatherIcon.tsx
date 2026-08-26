import { cn } from '@/components/ui/cn';
import { iconClass } from '../iconClass/iconClass';

type WeatherIconProps = {
  iconCode: number;
  isDay?: boolean;
  className?: string;
};

export const WeatherIcon = ({
  iconCode,
  isDay,
  className,
}: WeatherIconProps) => (
  <i
    className={cn('wi', iconClass(iconCode, isDay), className)}
    data-cy="weather-icon"
    aria-hidden="true"
  />
);
