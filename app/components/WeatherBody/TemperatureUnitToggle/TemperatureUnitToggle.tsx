import type { TemperatureUnit } from '@/lib/weather/types';
import styles from './TemperatureUnitToggle.module.css';

type TemperatureUnitToggleProps = {
  unit: TemperatureUnit;
  onChange: (unit: TemperatureUnit) => void;
};

const CELSIUS_LABEL = '°C';
const FAHRENHEIT_LABEL = '°F';

export const TemperatureUnitToggle = ({
  unit,
  onChange,
}: TemperatureUnitToggleProps) => (
  <div className={styles.group} role="group" aria-label="Temperature unit">
    <button
      className={styles.button}
      type="button"
      aria-pressed={unit === 'celsius'}
      onClick={() => onChange('celsius')}
    >
      {CELSIUS_LABEL}
    </button>
    <button
      className={styles.button}
      type="button"
      aria-pressed={unit === 'fahrenheit'}
      onClick={() => onChange('fahrenheit')}
    >
      {FAHRENHEIT_LABEL}
    </button>
  </div>
);
