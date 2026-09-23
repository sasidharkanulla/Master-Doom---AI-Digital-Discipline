import { CharacterProfile, RestrictedApp, WhitelistedApp, BargainSession } from "../types";

export const INITIAL_RESTRICTED_APPS: RestrictedApp[] = [
  {
    package_name: "com.instagram.android",
    app_name: "Instagram",
    category: "Social Media",
    is_blocked: true,
    custom_cooldown_minutes: 15,
    created_at: Date.now() - 86400000 * 7,
    icon_name: "Instagram",
    color: "from-pink-500 via-rose-500 to-amber-500"
  },
  {
    package_name: "com.zhiliaoapp.musically",
    app_name: "TikTok",
    category: "Short Video",
    is_blocked: true,
    custom_cooldown_minutes: 15,
    created_at: Date.now() - 86400000 * 7,
    icon_name: "Video",
    color: "from-zinc-900 to-cyan-500"
  },
  {
    package_name: "com.twitter.android",
    app_name: "X / Twitter",
    category: "Social Media",
    is_blocked: true,
    custom_cooldown_minutes: 15,
    created_at: Date.now() - 86400000 * 6,
    icon_name: "Twitter",
    color: "from-zinc-800 to-zinc-950"
  },
  {
    package_name: "com.google.android.youtube",
    app_name: "YouTube",
    category: "Entertainment",
    is_blocked: true,
    custom_cooldown_minutes: 15,
    created_at: Date.now() - 86400000 * 5,
    icon_name: "Youtube",
    color: "from-red-600 to-red-800"
  },
  {
    package_name: "com.reddit.frontpage",
    app_name: "Reddit",
    category: "Social Media",
    is_blocked: true,
    custom_cooldown_minutes: 15,
    created_at: Date.now() - 86400000 * 4,
    icon_name: "MessageSquare",
    color: "from-orange-600 to-orange-800"
  },
  {
    package_name: "com.discord",
    app_name: "Discord",
    category: "Messaging",
    is_blocked: true,
    custom_cooldown_minutes: 15,
    created_at: Date.now() - 86400000 * 3,
    icon_name: "MessageCircle",
    color: "from-indigo-600 to-indigo-800"
  }
];

export const WHITELISTED_APPS: WhitelistedApp[] = [
  {
    package_name: "com.google.android.dialer",
    app_name: "Phone",
    category: "Utility",
    icon_name: "Phone",
    color: "from-emerald-600 to-teal-700"
  },
  {
    package_name: "com.google.android.GoogleCamera",
    app_name: "Camera",
    category: "Utility",
    icon_name: "Camera",
    color: "from-zinc-700 to-zinc-800"
  },
  {
    package_name: "com.google.android.calendar",
    app_name: "Calendar",
    category: "Utility",
    icon_name: "Calendar",
    color: "from-blue-600 to-indigo-700"
  },
  {
    package_name: "com.gatekeeper.app.metrics",
    app_name: "Discipline HUD",
    category: "Health",
    icon_name: "ShieldCheck",
    color: "from-amber-600 to-amber-700"
  }
];

export const DEFAULT_DIRECT_ACCESS_APPS: Array<{
  package_name: string;
  app_name: string;
  category: "Productivity" | "Utility" | "Reading" | "Tools" | "Health" | "Work";
  icon_name: string;
  added_at: number;
}> = [
  {
    package_name: "notion.id",
    app_name: "Notion",
    category: "Productivity",
    icon_name: "FileText",
    added_at: Date.now() - 86400000 * 2
  },
  {
    package_name: "com.slack",
    app_name: "Slack",
    category: "Work",
    icon_name: "MessageSquare",
    added_at: Date.now() - 86400000 * 2
  },
  {
    package_name: "com.amazon.kindle",
    app_name: "Kindle Books",
    category: "Reading",
    icon_name: "BookOpen",
    added_at: Date.now() - 86400000 * 1
  },
  {
    package_name: "com.google.android.apps.maps",
    app_name: "Google Maps",
    category: "Utility",
    icon_name: "Compass",
    added_at: Date.now() - 86400000 * 1
  }
];

export const AVAILABLE_CATALOG_APPS = [
  { package_name: "notion.id", app_name: "Notion", category: "Productivity", icon_name: "FileText" },
  { package_name: "com.slack", app_name: "Slack", category: "Work", icon_name: "MessageSquare" },
  { package_name: "com.amazon.kindle", app_name: "Kindle Books", category: "Reading", icon_name: "BookOpen" },
  { package_name: "com.google.android.apps.maps", app_name: "Google Maps", category: "Utility", icon_name: "Compass" },
  { package_name: "com.apple.notes", app_name: "Notes & Memos", category: "Productivity", icon_name: "Edit3" },
  { package_name: "com.github.mobile", app_name: "GitHub", category: "Work", icon_name: "Code" },
  { package_name: "com.calculator", app_name: "Calculator", category: "Tools", icon_name: "Calculator" },
  { package_name: "com.spotify.music", app_name: "Spotify (Focus Audio)", category: "Utility", icon_name: "Headphones" },
  { package_name: "com.obsidian", app_name: "Obsidian", category: "Productivity", icon_name: "Brain" },
  { package_name: "com.duolingo", app_name: "Duolingo", category: "Reading", icon_name: "Languages" },
  { package_name: "com.google.calendar", app_name: "Calendar", category: "Tools", icon_name: "Calendar" },
  { package_name: "com.google.camera", app_name: "Camera", category: "Tools", icon_name: "Camera" },
  // Social Media catalog entries (flagged as strict restriction)
  { package_name: "com.instagram.android", app_name: "Instagram", category: "Social Media", icon_name: "Instagram", is_social_media: true },
  { package_name: "com.zhiliaoapp.musically", app_name: "TikTok", category: "Social Media", icon_name: "Video", is_social_media: true },
  { package_name: "com.twitter.android", app_name: "X / Twitter", category: "Social Media", icon_name: "Twitter", is_social_media: true },
  { package_name: "com.reddit.frontpage", app_name: "Reddit", category: "Social Media", icon_name: "MessageCircle", is_social_media: true },
  { package_name: "com.google.android.youtube", app_name: "YouTube", category: "Social Media", icon_name: "Youtube", is_social_media: true }
];

export const CHARACTER_PROFILES: CharacterProfile[] = [
  {
    character_id: "satoshi",
    display_name: "Master Satoshi",
    archetype: "Encouraging Stoic Mentor",
    system_prompt: `SYSTEM PROMPT: MASTER SATOSHI\nRole: You are Master Satoshi — a calm, deeply respected mentor and guide in digital self-mastery.\nPhilosophy: Discipline is not self-punishment; it is self-respect. You choose what you want most over what you want right now.\nRules of Engagement:\n1. Encourage, do not scold: never lecture or shame the user. Empower their focus.\n2. Share practical discipline ideas: teach real micro-habits (the 5-minute rule, urge surfing, environmental friction, writing the next micro-step on paper).\n3. Deep contextual understanding: listen to what they need, understand their struggle, and guide them with grounded wisdom.\n4. Do not recite clock times. Keep replies warm, clear, and actionable.`,
    voice_id: "satoshi_natural_baritone",
    is_unlocked: true,
    price_usd: 0.0,
    ssml_rate: "76% (Slow & Deliberate)",
    ssml_pitch: "-5st (Deep Strong Baritone)",
    avatar_bg: "bg-gradient-to-b from-stone-800 to-zinc-950",
    quote: "Discipline is self-respect. Focus on what you want most, not what is easiest right now.",
    voice_traits: "Calm • Grounded Presence • Encouraging Mentor"
  }
];

export const SAMPLE_INITIAL_SESSIONS: BargainSession[] = [
  {
    id: "sess_init_1",
    package_name: "com.instagram.android",
    character_id: "satoshi",
    user_prompt: "Need to verify client's address sent via DM for today's 2pm site visit",
    llm_rationale: "Concrete, urgent utility task with verified real-world deadline.",
    decision: "APPROVED",
    granted_duration_seconds: 180,
    timestamp: Date.now() - 3600000 * 2,
    audit_completed: 1,
    audit_passed: 1,
    cooldown_seconds: 0
  },
  {
    id: "sess_init_2",
    package_name: "com.zhiliaoapp.musically",
    character_id: "satoshi",
    user_prompt: "Just want a quick 5 min break to scroll",
    llm_rationale: "Violation of Rule 1: Mindless dopamine chasing and scrolling.",
    decision: "DENIED",
    granted_duration_seconds: 0,
    timestamp: Date.now() - 3600000 * 1.2,
    audit_completed: 0,
    audit_passed: 0,
    cooldown_seconds: 900
  },
  {
    id: "sess_init_3",
    package_name: "com.twitter.android",
    character_id: "satoshi",
    user_prompt: "Checking industry breaking security vulnerability report for Kubernetes CVE",
    llm_rationale: "High utility professional security research.",
    decision: "APPROVED",
    granted_duration_seconds: 240,
    timestamp: Date.now() - 1800000,
    audit_completed: 1,
    audit_passed: 1,
    cooldown_seconds: 0
  }
];

export const NATIVE_CODE_BLUEPRINTS = {
  android_overlay_service: `// GatekeeperOverlayService.kt - Production Android 15 (API 35) Overlay Service
package com.gatekeeper.app.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.content.pm.ServiceInfo
import android.graphics.PixelFormat
import android.os.Build
import android.os.IBinder
import android.view.Gravity
import android.view.LayoutInflater
import android.view.View
import android.view.WindowManager
import androidx.core.app.NotificationCompat
import com.gatekeeper.app.R

class GatekeeperOverlayService : Service() {

    private lateinit var windowManager: WindowManager
    private var overlayView: View? = null

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        windowManager = getSystemService(WINDOW_SERVICE) as WindowManager
        startForegroundServiceWithCompliance()
        showOverlay()
    }

    /**
     * Android 15+ Foreground Service Compliance
     * Registers foregroundServiceType="specialUse" with notification channel
     */
    private fun startForegroundServiceWithCompliance() {
        val channelId = "gatekeeper_discipline_channel"
        val channel = NotificationChannel(
            channelId,
            "Gatekeeper Active Discipline Interceptor",
            NotificationManager.IMPORTANCE_HIGH
        ).apply {
            description = "Active OS-level interceptor monitoring unauthorized package launches"
            setSound(null, null)
        }
        val manager = getSystemService(NotificationManager::class.java)
        manager.createNotificationChannel(channel)

        val notification: Notification = NotificationCompat.Builder(this, channelId)
            .setContentTitle("Gatekeeper Active")
            .setContentText("Zero-Trust System Interceptor is enforcing digital boundaries.")
            .setSmallIcon(R.drawable.ic_gatekeeper_shield)
            .setOngoing(true)
            .build()

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(
                1001,
                notification,
                ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE
            )
        } else {
            startForeground(1001, notification)
        }
    }

    private fun showOverlay() {
        val layoutParams = WindowManager.LayoutParams().apply {
            type = WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
            flags = WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or
                    WindowManager.LayoutParams.FLAG_FULLSCREEN or
                    WindowManager.LayoutParams.FLAG_SECURE or
                    WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED
            format = PixelFormat.TRANSLUCENT
            width = WindowManager.LayoutParams.MATCH_PARENT
            height = WindowManager.LayoutParams.MATCH_PARENT
            gravity = Gravity.CENTER
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_ALWAYS
            }
        }

        val inflater = LayoutInflater.from(this)
        overlayView = inflater.inflate(R.layout.overlay_gatekeeper_layout, null)
        windowManager.addView(overlayView, layoutParams)
    }

    override fun onDestroy() {
        super.onDestroy()
        overlayView?.let { windowManager.removeView(it) }
    }
}`,

  ios_shield_extension: `// ShieldConfigurationExtension.swift - Production iOS 18+ Shield Extension
import ManagedSettings
import ManagedSettingsUI
import UIKit

class ShieldConfigurationExtension: ShieldConfigurationDataSource {
    
    // Renders custom Gatekeeper UI directly over blocked application windows at kernel boundary
    override func configuration(shielding application: Application) -> ShieldConfiguration {
        let appName = application.localizedDisplayName ?? "Restricted Application"
        
        return ShieldConfiguration(
            backgroundBlurStyle: .systemUltraThinMaterialDark,
            backgroundColor: UIColor(red: 0.05, green: 0.05, blue: 0.07, alpha: 1.0),
            icon: UIImage(named: "gatekeeper_zen_seal"),
            title: ShieldConfiguration.Label(
                text: "GATEKEEPER INTERCEPT",
                color: UIColor(red: 0.95, green: 0.85, blue: 0.65, alpha: 1.0)
            ),
            subtitle: ShieldConfiguration.Label(
                text: "\\(appName) is locked under Zero-Trust Discipline.\\nNegotiate access with Master Satoshi.",
                color: UIColor.white.withAlphaComponent(0.8)
            ),
            primaryButtonLabel: ShieldConfiguration.Label(
                text: "Begin AI Bargaining",
                color: UIColor.black
            ),
            primaryButtonBackgroundColor: UIColor(red: 0.92, green: 0.76, blue: 0.45, alpha: 1.0),
            secondaryButtonLabel: ShieldConfiguration.Label(
                text: "Accept Cooldown (Exit)",
                color: UIColor.white.withAlphaComponent(0.6)
            )
        )
    }
}`,

  fastapi_main: `# main.py - FastAPI Production Reason Engine
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Literal

app = FastAPI(title="Gatekeeper AI Reason Engine", version="1.0.0")

class BargainRequest(BaseModel):
    user_id: str
    package_name: str
    user_prompt: str
    character_id: str = "satoshi"
    seconds_since_last_session: int

class GatekeeperEvaluationOutput(BaseModel):
    action_text: str = Field(..., description="Stage directions for character animation")
    dialogue_text: str = Field(..., description="Spoken output text")
    decision: Literal["APPROVED", "DENIED", "CLARIFICATION_REQUIRED"]
    granted_duration_seconds: int = Field(default=0, ge=0, le=600)
    cooldown_seconds: int = Field(default=0, ge=0)

@app.post("/v1/bargain/evaluate", response_model=GatekeeperEvaluationOutput)
async def evaluate_bargain(request: BargainRequest):
    # Rule 1: Blacklist keyword filter check
    banned_keywords = ["bored", "scroll", "meme", "quick look", "just checking", "pass the time", "5 mins please"]
    if any(word in request.user_prompt.lower() for word in banned_keywords):
        return GatekeeperEvaluationOutput(
            action_text="Master Satoshi slowly shakes his head, shutting his eyes in deep disappointment.",
            dialogue_text="Chasing mindless shadows yields no wisdom. Return to your stillness.",
            decision="DENIED",
            granted_duration_seconds=0,
            cooldown_seconds=900
        )
    
    # Rule 2: App-Hopping Check (<30 mins)
    if request.seconds_since_last_session < 1800:
        return GatekeeperEvaluationOutput(
            action_text="Master Satoshi opens his eyes with a sharp, stern glare.",
            dialogue_text="You stood here less than thirty minutes ago. Your focus is fracturing.",
            decision="DENIED",
            granted_duration_seconds=0,
            cooldown_seconds=1800
        )

    # Standard LLM Evaluation Route with Gemini / Claude
    return GatekeeperEvaluationOutput(
        action_text="Master Satoshi nods slowly with a disciplined gaze.",
        dialogue_text="A specific intent. You have three minutes to complete your task.",
        decision="APPROVED",
        granted_duration_seconds=180,
        cooldown_seconds=0
    )`,

  sql_schema: `-- schema.sql - Room (Android/Kotlin) & SQLite Persistence Schema

-- 1. Application Block List & Tracking
CREATE TABLE IF NOT EXISTS restricted_apps (
    package_name TEXT PRIMARY KEY NOT NULL,
    app_name TEXT NOT NULL,
    category TEXT NOT NULL,
    is_blocked INTEGER NOT NULL DEFAULT 1,
    custom_cooldown_minutes INTEGER DEFAULT 15,
    created_at INTEGER NOT NULL
);

-- 2. AI Bargaining History Log
CREATE TABLE IF NOT EXISTS bargain_sessions (
    id TEXT PRIMARY KEY NOT NULL,
    package_name TEXT NOT NULL,
    character_id TEXT NOT NULL,
    user_prompt TEXT NOT NULL,
    llm_rationale TEXT NOT NULL,
    decision TEXT CHECK(decision IN ('APPROVED', 'DENIED', 'CLARIFICATION_REQUIRED')) NOT NULL,
    granted_duration_seconds INTEGER NOT NULL DEFAULT 0,
    timestamp INTEGER NOT NULL,
    audit_completed INTEGER DEFAULT 0,
    audit_passed INTEGER DEFAULT 0,
    FOREIGN KEY(package_name) REFERENCES restricted_apps(package_name)
);

-- 3. Character Profiles & Unlocked Marketplace Assets
CREATE TABLE IF NOT EXISTS character_profiles (
    character_id TEXT PRIMARY KEY NOT NULL,
    display_name TEXT NOT NULL,
    archetype TEXT NOT NULL,
    system_prompt TEXT NOT NULL,
    voice_id TEXT NOT NULL,
    is_unlocked INTEGER NOT NULL DEFAULT 0,
    price_usd REAL DEFAULT 0.00,
    ssml_rate TEXT DEFAULT '85%',
    ssml_pitch TEXT DEFAULT '-2st'
);

-- 4. Behavioral Metrics & Addiction Analytics
CREATE TABLE IF NOT EXISTS behavioral_metrics_log (
    id TEXT PRIMARY KEY NOT NULL,
    timestamp INTEGER NOT NULL,
    impulse_velocity_ms INTEGER NOT NULL, -- Δt between unlock & app tap
    phantom_tap INTEGER NOT NULL DEFAULT 0, -- 1 if tapped & instantly closed
    relapse_count_15m INTEGER NOT NULL DEFAULT 0, -- Repeated attempts
    intent_realization_rate REAL NOT NULL DEFAULT 1.0,
    calculated_dds_score REAL NOT NULL
);`
};
