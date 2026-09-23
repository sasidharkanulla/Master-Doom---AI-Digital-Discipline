import { BargainSession, CalculatedAnalytics } from "../types";

/**
 * Section 5: Behavioral Analytics Engine Mathematical Formulation
 */

export const TAU_SECONDS = 300; // Tau decay constant = 300s
export const ROLLING_WINDOW_SECONDS = 900; // 15-minute window = 900s

/**
 * Calculate Impulse Velocity Index (IVI)
 * IVI = t_tap - t_unlock (in milliseconds)
 */
export function calculateIVI(unlockTimestamp: number, tapTimestamp: number): number {
  return Math.max(0, tapTimestamp - unlockTimestamp);
}

/**
 * Calculate Relapse Clustering Coefficient (RCC)
 * Density of access attempts over rolling 15-minute window:
 * RCC = sum_{k=1}^N e^{-(t_current - t_k) / tau} (where tau = 300s)
 */
export function calculateRCC(attemptTimestamps: number[], currentTimestamp: number = Date.now()): number {
  const currentSec = currentTimestamp / 1000;
  const windowStartSec = currentSec - ROLLING_WINDOW_SECONDS;

  // Filter to attempts within the last 15 minutes (900 seconds)
  const recentAttempts = attemptTimestamps
    .map(ts => ts / 1000)
    .filter(t => t >= windowStartSec && t <= currentSec);

  if (recentAttempts.length === 0) return 0;

  let rcc = 0;
  for (const t of recentAttempts) {
    const deltaT = Math.max(0, currentSec - t);
    rcc += Math.exp(-deltaT / TAU_SECONDS);
  }

  return Number(rcc.toFixed(3));
}

/**
 * Calculate Intent Realization Index (IRI)
 * IRI = sum(Sessions_passed_audit) / sum(Sessions_granted)
 */
export function calculateIRI(sessions: BargainSession[]): number {
  const grantedSessions = sessions.filter(s => s.decision === "APPROVED");
  if (grantedSessions.length === 0) return 1.0;

  const passedAudit = grantedSessions.filter(s => s.audit_completed === 1 && s.audit_passed === 1).length;
  const completedAudit = grantedSessions.filter(s => s.audit_completed === 1).length;

  if (completedAudit === 0) return 1.0;
  return Number((passedAudit / completedAudit).toFixed(3));
}

/**
 * Calculate Digital Dependency Score (DDS)
 * DDS = min(100.0, w1 * (3000 / (IVI + 1)) + w2 * (RCC * 15) + w3 * (1.0 - IRI) * 40 + w4 * NPR)
 * Default Weights: w1 = 0.25, w2 = 0.35, w3 = 0.25, w4 = 0.15
 */
export function calculateDDS(
  ivi_ms: number,
  rcc: number,
  iri: number,
  npr_score: number,
  weights = { w1: 0.25, w2: 0.35, w3: 0.25, w4: 0.15 }
): number {
  const comp1 = weights.w1 * (3000 / (Math.max(1, ivi_ms) + 1));
  const comp2 = weights.w2 * (rcc * 15);
  const comp3 = weights.w3 * ((1.0 - Math.min(1.0, Math.max(0, iri))) * 40);
  const comp4 = weights.w4 * Math.min(100, Math.max(0, npr_score));

  const total = comp1 + comp2 + comp3 + comp4;
  return Math.min(100.0, Number(Math.max(0, total).toFixed(1)));
}

/**
 * Full analytics aggregator
 */
export function computeAnalyticsState(
  sessions: BargainSession[],
  attemptTimestamps: number[],
  lastUnlockTimestamp: number,
  lastTapTimestamp: number,
  phantomTapCount: number
): CalculatedAnalytics {
  const now = Date.now();
  const ivi_ms = calculateIVI(lastUnlockTimestamp, lastTapTimestamp);
  const rcc_score = calculateRCC(attemptTimestamps, now);
  const iri_ratio = calculateIRI(sessions);

  // Count recent relapses (within 15 mins)
  const windowStart = now - ROLLING_WINDOW_SECONDS * 1000;
  const relapse_count_15m = attemptTimestamps.filter(t => t >= windowStart).length;

  // Count recent denials (within 1 hour = 3600s)
  const oneHourAgo = now - 3600 * 1000;
  const denial_count_1h = sessions.filter(s => s.timestamp >= oneHourAgo && s.decision === "DENIED").length;

  // NPR (Non-Productive Relapse Index)
  const npr = Math.min(100, phantomTapCount * 12 + denial_count_1h * 15);

  const dds_score = calculateDDS(ivi_ms, rcc_score, iri_ratio, npr);

  return {
    ivi_ms,
    ptf_count: phantomTapCount,
    rcc_score,
    iri_ratio,
    dds_score,
    relapse_count_15m,
    denial_count_1h,
    lockdown_until: denial_count_1h >= 3 ? now + 14400 * 1000 : null
  };
}

export function getDDSStatusCategory(score: number): {
  label: string;
  color: string;
  textColor: string;
  description: string;
} {
  if (score < 25) {
    return {
      label: "Autonomous Discipline",
      color: "emerald",
      textColor: "text-emerald-400",
      description: "Low impulse velocity, zero relapse clustering, high intentionality."
    };
  }
  if (score < 55) {
    return {
      label: "Moderate Impulsive Drift",
      color: "amber",
      textColor: "text-amber-400",
      description: "Occasional quick taps detected; intentionality remains recoverable."
    };
  }
  if (score < 80) {
    return {
      label: "Elevated Dopamine Loop",
      color: "orange",
      textColor: "text-orange-400",
      description: "High clustering coefficient with sub-second phantom taps."
    };
  }
  return {
    label: "Critical Relapse State",
    color: "rose",
    textColor: "text-rose-400",
    description: "Compulsive unlocking loop detected. Enforcing strict gatekeeper quarantine."
  };
}
