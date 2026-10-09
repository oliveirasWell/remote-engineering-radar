import type {
  DATA_ANNOTATION_ROLE_FOCUS,
  MOBILE_ROLE_FOCUS,
  PLATFORM_ROLE_FOCUS,
  PRODUCT_ROLE_FOCUS,
  REACT_ROLE_FOCUS,
} from '../constants';

/** Accent-folded text, as `classifyJob` already prepared it. */
export type LaneInput = {
  title: string;
  /** Title, description, location, and remote policy joined. */
  haystack: string;
};

export type LaneRule = (input: LaneInput) => boolean;

export type LaneRoleFocus =
  | typeof REACT_ROLE_FOCUS
  | typeof MOBILE_ROLE_FOCUS
  | typeof PLATFORM_ROLE_FOCUS
  | typeof PRODUCT_ROLE_FOCUS
  | typeof DATA_ANNOTATION_ROLE_FOCUS;

/** A job is on the lane only when every rule passes. */
export type LaneStrategy = {
  roleFocus: LaneRoleFocus;
  rules: readonly LaneRule[];
};
