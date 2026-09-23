/**
 * Zero-Trust Digital Discipline Platform ("Gatekeeper") Types
 */

export type FSMState =
  | "IDLE"
  | "LISTENING"
  | "EVALUATING"
  | "DENIED"
  | "APPROVED"
  | "COOLDOWN"
  | "AUDIT";

export type DecisionType = "APPROVED" | "DENIED" | "CLARIFICATION_REQUIRED";

export interface GatekeeperEvaluationOutput {
  action_text: string;
  dialogue_text: string;
  decision: DecisionType;
  granted_duration_seconds: number;
  cooldown_seconds: number;
}

export interface RestrictedApp {
  package_name: string;
  app_name: string;
  category: "Social Media" | "Short Video" | "Entertainment" | "Gaming" | "Messaging";
  is_blocked: boolean;
  custom_cooldown_minutes: number;
  created_at: number;
  icon_name: string;
  color: string;
  active_cooldown_until?: number; // timestamp in ms
}

export interface WhitelistedApp {
  package_name: string;
  app_name: string;
  category: "Utility" | "System" | "Health";
  icon_name: string;
  color: string;
}

export interface DirectAccessApp {
  package_name: string;
  app_name: string;
  category: "Productivity" | "Utility" | "Reading" | "Tools" | "Health" | "Work";
  icon_name: string;
  added_at: number;
}

export interface ActiveAppSession {
  app: {
    package_name: string;
    app_name: string;
    category: string;
    icon_name: string;
    is_social_media?: boolean;
  };
  startedAt: number;
  durationSeconds: number; // accumulated usage
  purposePromptRequired: boolean; // triggered after 15m (900s)
  currentPurpose?: string;
  expiresAt?: number; // for social media grants
}

export interface BargainSession {
  id: string;
  package_name: string;
  character_id: string;
  user_prompt: string;
  llm_rationale: string;
  decision: DecisionType;
  granted_duration_seconds: number;
  timestamp: number;
  audit_completed: number; // 0 or 1
  audit_passed: number; // 0 or 1
  cooldown_seconds: number;
}

export interface CharacterProfile {
  character_id: string;
  display_name: string;
  archetype: string;
  system_prompt: string;
  voice_id: string;
  is_unlocked: boolean;
  price_usd: number;
  ssml_rate: string;
  ssml_pitch: string;
  avatar_bg: string;
  quote: string;
  voice_traits?: string;
}

export interface BehavioralMetricEntry {
  id: string;
  timestamp: number;
  impulse_velocity_ms: number; // Delta t between unlock & app tap
  phantom_tap: number; // 1 if tapped & closed < 2s
  relapse_count_15m: number; // Repeated attempts in rolling 15m
  intent_realization_rate: number;
  calculated_dds_score: number;
}

export interface CalculatedAnalytics {
  ivi_ms: number; // Impulse Velocity Index
  ptf_count: number; // Phantom Tap Frequency
  rcc_score: number; // Relapse Clustering Coefficient
  iri_ratio: number; // Intent Realization Index
  dds_score: number; // Digital Dependency Score (0.0 to 100.0)
  relapse_count_15m: number;
  denial_count_1h: number;
  lockdown_until: number | null;
}

export interface SecurityState {
  system_alert_window_granted: boolean;
  accessibility_service_granted: boolean;
  boot_receiver_registered: boolean;
  flag_secure_enabled: boolean;
  tamper_detected: boolean;
  lockdown_active: boolean;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
}

export interface UnlockedAppGrant {
  app: RestrictedApp;
  durationSeconds: number;
  grantedAt: number;
  expiresAt: number;
  reason: string;
}

