import { iconClass } from '../iconClass/iconClass';

type WeatherIconProps = {
  iconCode: number;
  isDay?: boolean;
  className?: string;
};

export const WeatherIcon = ({ iconCode, isDay, className }: WeatherIconProps) => (
  <i
    className={`wi ${iconClass(iconCode, isDay)} ${className ?? ''}`}
    aria-hidden="true"
  />
);
