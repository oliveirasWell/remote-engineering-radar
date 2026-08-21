import styles from './Disclaimer.module.css';

type DisclaimerProps = {
  children: string;
};

export const Disclaimer = ({ children }: DisclaimerProps) => (
  <p className={styles.disclaimer}>{children}</p>
);
