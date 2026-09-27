import {
  DATA_ANNOTATION_ROLE_FOCUS,
  MOBILE_ROLE_FOCUS,
  PLATFORM_ROLE_FOCUS,
  PRODUCT_ROLE_FOCUS,
  REACT_ROLE_FOCUS,
} from '../constants';
import { VOCABULARY } from '../vocabulary/vocabulary';
import { anyOf } from './any-of';
import {
  CLOUD_SUPPORT_MINIMUM,
  CLOUD_SUPPORT_TERMS,
  MOBILE_TERMS,
  MOBILE_TITLE_NAMES,
  PRODUCT_POSITIONS,
  QA_POSITIONS,
  REACT_BODY_ANCHORS,
  REACT_SUPPORT_MINIMUM,
  REACT_SUPPORT_TERMS,
  REACT_TITLE_ANCHORS,
  REACT_TITLE_VETOES,
} from './constants';
import { titleAnchorOrBodyPlusN } from './title-anchor-or-body-plus-n';
import { titleMatchesNone } from './title-matches-none';
import type { LaneInput, LaneRoleFocus, LaneStrategy } from './types';

/**
 * First lane whose rules all pass wins. Order is narrowest claim first: a
 * product or annotation posting names its own job, a cloud posting needs its
 * tools, and React is what is left of the software jobs. Adding a lane is one
 * row here; adding a condition is one rule in that row.
 */
const LANE_STRATEGIES: readonly LaneStrategy[] = [
  {
    roleFocus: PRODUCT_ROLE_FOCUS,
    rules: [anyOf({ terms: VOCABULARY.productTitle, titleOnly: true })],
  },
  {
    roleFocus: DATA_ANNOTATION_ROLE_FOCUS,
    rules: [
      anyOf({
        terms: [...VOCABULARY.annotationTitle, ...VOCABULARY.annotationText],
      }),
    ],
  },
  {
    roleFocus: PLATFORM_ROLE_FOCUS,
    rules: [
      anyOf({ terms: VOCABULARY.cloudOpsTitle, titleOnly: true }),
      anyOf({ terms: CLOUD_SUPPORT_TERMS, n: CLOUD_SUPPORT_MINIMUM }),
    ],
  },
  {
    roleFocus: MOBILE_ROLE_FOCUS,
    rules: [
      anyOf({ terms: MOBILE_TITLE_NAMES, titleOnly: true }),
      anyOf({ terms: MOBILE_TERMS }),
      titleMatchesNone([...QA_POSITIONS, ...PRODUCT_POSITIONS]),
    ],
  },
  {
    roleFocus: REACT_ROLE_FOCUS,
    rules: [
      titleMatchesNone(REACT_TITLE_VETOES),
      titleAnchorOrBodyPlusN({
        titleAnchors: REACT_TITLE_ANCHORS,
        bodyAnchors: REACT_BODY_ANCHORS,
        support: REACT_SUPPORT_TERMS,
        n: REACT_SUPPORT_MINIMUM,
      }),
    ],
  },
];

const allRulesPass = (lane: LaneStrategy, input: LaneInput): boolean =>
  lane.rules.every((rule) => rule(input));

/** Every value a lane can write, for the rules that ask "is this on a track?". */
export const LANE_ROLE_FOCUS_VALUES: readonly LaneRoleFocus[] =
  LANE_STRATEGIES.map((lane) => lane.roleFocus);

export const laneRoleFocus = (input: LaneInput): LaneRoleFocus | undefined =>
  LANE_STRATEGIES.find((lane) => allRulesPass(lane, input))?.roleFocus;
