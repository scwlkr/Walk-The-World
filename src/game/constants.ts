export const GAME_VERSION = '0.2.0';
export const EARTH_CIRCUMFERENCE_MILES = 24901;
export const CANONICAL_MOON_DISTANCE_MILES = 238855;
export const MOON_CIRCUMFERENCE_MILES = 6786;
export const STARTING_IDLE_MILES_PER_SECOND = 0.0004;
export const STARTING_CLICK_MILES = 0.004;
export const STARTING_WALKERBUCKS = 0;
export const BASE_WB_PER_MILE = 1;
export const DEFAULT_OFFLINE_CAP_SECONDS = 14400;
export const EARTH_LOOP_REWARD_WB = 10000;
export const MOON_LOOP_REWARD_WB = 15000;
export const EARTH_PRESTIGE_SPEED_BONUS = 0.05;
export const EARTH_PRESTIGE_WB_BONUS = 0.05;
export const EARTH_PRESTIGE_MOON_ACCELERATION_BONUS = 0.15;
export const SAVE_KEY = 'walk_the_world_save_v1';
export const SAVE_VERSION = 11;
export const LOGIC_TICK_RATE_MS = 100;
export const AUTO_SAVE_INTERVAL_MS = 5000;
export const RANDOM_EVENT_MIN_INTERVAL_MS = 20000;
export const RANDOM_EVENT_MAX_INTERVAL_MS = 60000;
export const RANDOM_EVENT_LIFE_MS = 12000;
export const ROUTE_ENCOUNTER_MIN_INTERVAL_MS = 12000;
export const ROUTE_ENCOUNTER_MAX_INTERVAL_MS = 28000;
export const ROUTE_ENCOUNTER_LIFE_MS = 14000;
export const ENABLE_ADVANCED_EVENT_SYSTEMS = false;

// WalkerBucks/WB is ledger-owned. The browser may queue unsubmitted grant
// amounts, but every spendable WB balance must come from the trusted bridge.
