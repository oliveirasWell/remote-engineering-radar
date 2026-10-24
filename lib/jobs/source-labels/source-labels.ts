const JOB_SOURCE_LABELS: Record<string, string> = {
  greenhouse: 'Greenhouse',
  ashby: 'Ashby',
  lever: 'Lever',
  getonbrd: 'GetOnBrd',
  hackernews: 'Hacker News',
  himalayas: 'Himalayas',
  jobicy: 'Jobicy',
  frontendbr: 'frontendbr',
  quave: 'quave',
  ycombinator: 'Y Combinator',
};

/** The public name of a stored source slug. Unknown sources stay as stored. */
export const jobSourceLabel = (source: string): string =>
  JOB_SOURCE_LABELS[source] ?? source;
