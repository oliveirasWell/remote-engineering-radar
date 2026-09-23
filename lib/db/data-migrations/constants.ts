/**
 * Applied when the lane-strategy classifier ships. Do not register it
 * against the current classifier — the row would stick and skip the real
 * backfill.
 */
export const LANE_STRATEGIES_DATA_MIGRATION = '022-lane-strategies';
