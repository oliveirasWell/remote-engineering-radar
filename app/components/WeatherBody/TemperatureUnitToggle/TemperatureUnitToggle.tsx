import type { TemperatureUnit } from '@/lib/weather/types';

type TemperatureUnitToggleProps = {
  unit: TemperatureUnit;
  onChange: (unit: TemperatureUnit) => void;
};

const CELSIUS_LABEL = '°C';
const FAHRENHEIT_LABEL = '°F';
const BUTTON_CLASS_NAME =
  'cursor-pointer rounded-xl border border-white/65 bg-transparent px-3 py-2.5 text-on-panel aria-[pressed=true]:bg-on-panel aria-[pressed=true]:text-foreground';

export const TemperatureUnitToggle = ({
  unit,
  onChange,
}: TemperatureUnitToggleProps) => (
  <div className="flex gap-2" role="group" aria-label="Temperature unit">
    <button
      className={BUTTON_CLASS_NAME}
      type="button"
      aria-pressed={unit === 'celsius'}
      onClick={() => onChange('celsius')}
    >
      {CELSIUS_LABEL}
    </button>
    <button
      className={BUTTON_CLASS_NAME}
      type="button"
      aria-pressed={unit === 'fahrenheit'}
      onClick={() => onChange('fahrenheit')}
    >
      {FAHRENHEIT_LABEL}
    </button>
  </div>
);
