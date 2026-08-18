/** Contribution charts rendered once per build and reused across page renders. */
type ActivityChartsCache = { githubSvg: string; giteaSvg: string; at: number };

/**
 * Build-time memo shared by every render of /experience in a single `astro build`
 * (and across dev-server module reloads), so the upstream chart APIs are hit once.
 */
declare var __activityCharts: ActivityChartsCache | undefined;
