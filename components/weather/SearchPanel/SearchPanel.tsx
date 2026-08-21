import { Input } from '@/components/ui/Input/Input';
import { SEARCH_PANEL_TEXT } from './constants';
import styles from './SearchPanel.module.css';

type SearchPanelProps = {
  value: string;
  onQueryChange: (query: string) => void;
};

export const SearchPanel = ({ value, onQueryChange }: SearchPanelProps) => {
  return (
    <section className={styles.section}>
      <h2>{SEARCH_PANEL_TEXT.heading}</h2>
      <Input
        className={styles.input}
        type="search"
        placeholder={SEARCH_PANEL_TEXT.placeholder}
        value={value}
        onChange={(event) => onQueryChange(event.target.value)}
      />
    </section>
  );
};
