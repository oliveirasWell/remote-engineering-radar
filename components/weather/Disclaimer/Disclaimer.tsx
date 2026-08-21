type DisclaimerProps = {
  children: string;
};

export const Disclaimer = ({ children }: DisclaimerProps) => (
  <p className="disclaimer">{children}</p>
);
