/**
 * Application-wide constants.
 *
 * All magic numbers and hardcoded values should live here so they are
 * easy to locate, review, and update in one place.
 */

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

/**
 * Base URL for all backend API requests.
 *
 * In development the Vite dev proxy forwards `/api` to the .NET backend,
 * so a relative path is correct and avoids CORS issues.
 * In production the .NET host serves the frontend from the same origin,
 * so the same relative path works without any change.
 *
 * Override with VITE_API_BASE_URL in a local `.env` file if needed.
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------

/** Number of log entries streamed per request. */
export const PAGE_SIZE = 5_000;

// ---------------------------------------------------------------------------
// Settings / Configuration modal
// ---------------------------------------------------------------------------

/**
 * Default folder path pre-filled in the local log source input.
 * This is left empty so the user is forced to choose/input a valid path.
 */
export const DEFAULT_LOCAL_LOG_PATH = '';

// ---------------------------------------------------------------------------
// Live-mode polling
// ---------------------------------------------------------------------------

/** Interval (ms) between automatic log refreshes when live mode is active. */
export const LIVE_POLL_INTERVAL_MS = 10_000;
