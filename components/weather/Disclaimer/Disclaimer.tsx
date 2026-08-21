import type { ReactNode } from 'react';
import styles from './Disclaimer.module.css';

type DisclaimerProps = {
  children: ReactNode;
};

export const Disclaimer = ({ children }: DisclaimerProps) => (
  <div className={styles.disclaimer}>{children}</div>
);
