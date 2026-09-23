import { foldText } from '@/lib/text/fold-text/fold-text';
import { laneRoleFocus } from './lane-strategies';

const laneInput = (title: string, description?: string) => ({
  title: foldText(title),
  haystack: foldText([title, description].filter(Boolean).join('\n')),
});

const REACT_LANE = 'react';
const MOBILE_LANE = 'mobile';
const PLATFORM_LANE = 'platform';
const PRODUCT_LANE = 'product';
const ANNOTATION_LANE = 'annotation';

const SOFTWARE_TITLE = 'Senior Software Engineer';
const REACT_STACK_BODY =
  'React + TypeScript + Next.js + Jest, shipped every week.';

const LANE_CASES = [
  {
    name: 'a React title is enough on its own',
    input: laneInput('Senior React Engineer'),
    lane: REACT_LANE,
  },
  {
    name: 'a React stack in the body clears the support minimum',
    input: laneInput(SOFTWARE_TITLE, REACT_STACK_BODY),
    lane: REACT_LANE,
  },
  {
    name: 'a data engineering lead is not React',
    input: laneInput(
      'Head of Data Engineering',
      'Own our Spark and Airflow pipelines.',
    ),
    lane: undefined,
  },
  {
    name: 'a designer who works with React engineers is not React',
    input: laneInput(
      'Product Designer',
      'You will work with React engineers every day.',
    ),
    lane: undefined,
  },
  {
    name: 'the verb react is not the library',
    input: laneInput(SOFTWARE_TITLE, 'We react quickly to customer feedback.'),
    lane: undefined,
  },
  {
    name: 'React alone in the body is not enough',
    input: laneInput(SOFTWARE_TITLE, 'Our stack includes React.'),
    lane: undefined,
  },
  {
    name: 'an Angular title vetoes a React stack in the body',
    input: laneInput('Angular Developer', REACT_STACK_BODY),
    lane: undefined,
  },
  {
    name: 'an iOS title is Mobile',
    input: laneInput('iOS Engineer', 'Ship our native app.'),
    lane: MOBILE_LANE,
  },
  {
    name: 'React Native without iOS or Android is not Mobile',
    input: laneInput(
      'React Native Engineer',
      'Build cross-platform apps with Expo.',
    ),
    lane: REACT_LANE,
  },
  {
    name: 'Flutter alone is not Mobile',
    input: laneInput('Mobile Engineer', 'We build with Flutter.'),
    lane: undefined,
  },
  {
    name: 'a cloud title with two tools is Cloud & Ops',
    input: laneInput(
      'Senior DevOps Engineer',
      'Run AWS and Kubernetes in production.',
    ),
    lane: PLATFORM_LANE,
  },
  {
    name: 'a cloud title with one tool is not Cloud & Ops',
    input: laneInput('Cloud Engineer', 'We run on AWS.'),
    lane: undefined,
  },
  {
    name: 'cloud tooling without a cloud title is not Cloud & Ops',
    input: laneInput(
      SOFTWARE_TITLE,
      'React and TypeScript, deployed with Docker on AWS.',
    ),
    lane: undefined,
  },
  {
    name: 'a product manager title is Product',
    input: laneInput('Senior Product Manager'),
    lane: PRODUCT_LANE,
  },
  {
    name: 'an AI trainer title is Data Annotation',
    input: laneInput('Freelance AI Trainer - Python'),
    lane: ANNOTATION_LANE,
  },
] as const;

describe('laneRoleFocus', () => {
  it.each(LANE_CASES)('$name', ({ input, lane }) => {
    expect(laneRoleFocus(input)).toBe(lane);
  });
});
