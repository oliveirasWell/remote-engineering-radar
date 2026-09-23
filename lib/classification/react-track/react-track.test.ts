import { REACT_TRACK_THRESHOLD } from '../constants';
import { meetsReactTrackThreshold } from './react-track';

const SENIOR_REACT_ENGINEER = 'Senior React Engineer';
const SENIOR_SOFTWARE_ENGINEER = 'Senior Software Engineer';
const REACT_APPLICATIONS = 'Build React applications with TypeScript.';
const REACT_NATIVE_ENGINEER = 'Senior React Native Engineer';
const REACT_VERB = 'We react quickly to customer needs.';
const JEST_ONLY = 'Write unit tests with Jest.';
const SUPPORTING_STACK = 'Jest, Material UI, and Tailwind CSS.';
const DESIGNER_REACT_TEAM =
  'Work with our React engineers on the design system.';

describe('meetsReactTrackThreshold', () => {
  it(`treats a React title as enough to clear ${REACT_TRACK_THRESHOLD}`, () => {
    expect(meetsReactTrackThreshold(SENIOR_REACT_ENGINEER, '')).toBe(true);
  });

  it('treats React Native as enough on its own', () => {
    expect(meetsReactTrackThreshold(REACT_NATIVE_ENGINEER, '')).toBe(true);
  });

  it('accepts a body that names React applications', () => {
    expect(
      meetsReactTrackThreshold(SENIOR_SOFTWARE_ENGINEER, REACT_APPLICATIONS),
    ).toBe(true);
  });

  it('rejects the English verb react', () => {
    expect(meetsReactTrackThreshold(SENIOR_SOFTWARE_ENGINEER, REACT_VERB)).toBe(
      false,
    );
  });

  it('rejects Jest alone', () => {
    expect(meetsReactTrackThreshold(SENIOR_SOFTWARE_ENGINEER, JEST_ONLY)).toBe(
      false,
    );
  });

  it('accepts Jest, Material UI, and Tailwind together', () => {
    expect(
      meetsReactTrackThreshold(SENIOR_SOFTWARE_ENGINEER, SUPPORTING_STACK),
    ).toBe(true);
  });

  it('does not treat a neighbouring React team as a hit', () => {
    expect(
      meetsReactTrackThreshold('Product Designer', DESIGNER_REACT_TEAM),
    ).toBe(false);
  });
});
