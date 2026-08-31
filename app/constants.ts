export const APP_NAME = 'Remote Engineering Radar';

export const FOCUS_TECHNOLOGIES = [
  'React',
  'TypeScript',
  'Node.js',
  'GraphQL',
  'React Native',
] as const;

const lastFocusTechnology =
  FOCUS_TECHNOLOGIES[FOCUS_TECHNOLOGIES.length - 1] ?? '';

export const FOCUS_STACK_LABEL = `${FOCUS_TECHNOLOGIES.slice(0, -1).join(', ')}, and ${lastFocusTechnology}`;

export const APP_DESCRIPTION = `Automated job intelligence for remote senior frontend and fullstack roles in ${FOCUS_STACK_LABEL}.`;
