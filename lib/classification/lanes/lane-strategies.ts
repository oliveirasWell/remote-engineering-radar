import {
  DATA_ANNOTATION_ROLE_FOCUS,
  MOBILE_ROLE_FOCUS,
  PLATFORM_ROLE_FOCUS,
  PRODUCT_ROLE_FOCUS,
  REACT_ROLE_FOCUS,
} from '../constants';
import { VOCABULARY } from '../vocabulary/vocabulary';
import { anchorPlusN } from './anchor-plus-n';
import { anyOf } from './any-of';
import {
  CLOUD_SUPPORT_MINIMUM,
  CLOUD_SUPPORT_TERMS,
  MOBILE_TERMS,
  REACT_BODY_ANCHORS,
  REACT_SUPPORT_MINIMUM,
  REACT_SUPPORT_TERMS,
  REACT_TITLE_ANCHORS,
  REACT_TITLE_VETOES,
} from './constants';
import { excludeAny } from './exclude-any';
import { titleAnchorOrBodyPlusN } from './title-anchor-or-body-plus-n';
import type { LaneInput, LaneRoleFocus, LaneStrategy } from './types';

/**
 * First match wins. Order is narrowest claim first: a product or annotation
 * posting names its own job, a cloud posting needs its tools, and React is
 * what is left of the software jobs. Adding a lane is one factory call and
 * one row here.
 */
const LANE_STRATEGIES: readonly LaneStrategy[] = [
  {
    roleFocus: PRODUCT_ROLE_FOCUS,
    matches: anyOf({ terms: VOCABULARY.productTitle, titleOnly: true }),
  },
  {
    roleFocus: DATA_ANNOTATION_ROLE_FOCUS,
    matches: anyOf({
      terms: [...VOCABULARY.annotationTitle, ...VOCABULARY.annotationText],
    }),
  },
  {
    roleFocus: PLATFORM_ROLE_FOCUS,
    matches: anchorPlusN({
      anchors: VOCABULARY.cloudOpsTitle,
      support: CLOUD_SUPPORT_TERMS,
      n: CLOUD_SUPPORT_MINIMUM,
    }),
  },
  {
    roleFocus: MOBILE_ROLE_FOCUS,
    matches: anyOf({ terms: MOBILE_TERMS }),
  },
  {
    roleFocus: REACT_ROLE_FOCUS,
    matches: excludeAny({
      vetoes: REACT_TITLE_VETOES,
      strategy: titleAnchorOrBodyPlusN({
        titleAnchors: REACT_TITLE_ANCHORS,
        bodyAnchors: REACT_BODY_ANCHORS,
        support: REACT_SUPPORT_TERMS,
        n: REACT_SUPPORT_MINIMUM,
      }),
    }),
  },
];

/** Every value a lane can write, for the rules that ask "is this on a track?". */
export const LANE_ROLE_FOCUS_VALUES: readonly LaneRoleFocus[] =
  LANE_STRATEGIES.map((lane) => lane.roleFocus);

export const laneRoleFocus = (input: LaneInput): LaneRoleFocus | undefined =>
  LANE_STRATEGIES.find((lane) => lane.matches(input))?.roleFocus;
