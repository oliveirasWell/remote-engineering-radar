/**
 * Rewrites every active job's roleFocus with the lane strategies from
 * SPEC-022, and deactivates what the new classifier rejects.
 */
export const LANE_STRATEGIES_DATA_MIGRATION = '022-lane-strategies';

/**
 * Strips the body-text geography that ingestion before PR #48 copied into
 * `countries`, so non-Brazil jobs leave the Brazil tab.
 */
export const LEGACY_GEOGRAPHY_COUNTRIES_DATA_MIGRATION =
  '023-drop-legacy-geography-countries';
