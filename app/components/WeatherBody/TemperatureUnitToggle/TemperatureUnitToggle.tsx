import type { TemperatureUnit } from '@/lib/weather/types';
import { Button } from '@/components/ui/Button/Button';

type TemperatureUnitToggleProps = {
  unit: TemperatureUnit;
  onChange: (unit: TemperatureUnit) => void;
};

const UNITS = [
  { value: 'celsius', label: '°C' },
  { value: 'fahrenheit', label: '°F' },
] as const;

export const TemperatureUnitToggle = ({
  unit,
  onChange,
}: TemperatureUnitToggleProps) => (
  <div className="flex gap-2" role="group" aria-label="Temperature unit">
    {UNITS.map(({ label, value }) => (
      <Button
        key={value}
        variant="toggle"
        aria-pressed={unit === value}
        onClick={() => onChange(value)}
      >
        {label}
      </Button>
    ))}
  </div>
);
