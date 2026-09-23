import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Phone,
  Camera,
  Calendar,
  MessageSquare,
  Zap,
  Clock,
  Sparkles,
  Unlock,
  AlertOctagon,
  Mic,
  CheckCircle2,
  ArrowRight
} from "lucide-react";
import { RestrictedApp, WhitelistedApp, CalculatedAnalytics, UnlockedAppGrant } from "../types";
import { getDDSStatusCategory } from "../utils/math";
import { AppIcon } from "./AppIcon";

interface LauncherHomeProps {
  restrictedApps: RestrictedApp[];
  whitelistedApps: WhitelistedApp[];
  analytics: CalculatedAnalytics;
  onLaunchRestrictedApp: (app: RestrictedApp) => void;
  onLaunchWhitelistedApp: (app: WhitelistedApp) => void;
  onLockDevice: () => void;
  isLockedScreen?: boolean;
  onOpenChatNegotiation?: (app?: RestrictedApp) => void;
  unlockedGrants?: UnlockedAppGrant[];
  onLaunchUnlockedApp?: (grant: UnlockedAppGrant) => void;
}

export const LauncherHome: React.FC<LauncherHomeProps> = ({
  restrictedApps,
  whitelistedApps,
  analytics,
  onLaunchRestrictedApp,
  onLaunchWhitelistedApp,
  onOpenChatNegotiation,
  unlockedGrants = [],
  onLaunchUnlockedApp
}) => {
  const [timeStr, setTimeStr] = useState("");
  const [dateStr, setDateStr] = useState("");
  const [, setTick] = useState(0);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })
      );
      setDateStr(
        now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
      );
      setTick(t => t + 1);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const ddsInfo = getDDSStatusCategory(analytics.dds_score);
  const isLockdownActive = analytics.lockdown_until && analytics.lockdown_until > Date.now();

  // Filter active grants that haven't expired
  const now = Date.now();
  const activeGrants = unlockedGrants.filter(g => g.expiresAt > now);

  const formatRemainingSeconds = (expiresAt: number) => {
    const sec = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="w-full h-full flex flex-col justify-between p-4 text-zinc-100 select-none overflow-y-auto">
      {/* Top Section: System Launcher Header & Clock */}
      <div className="pt-2 text-center">
        {/* Launcher registration badge */}
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>ZERO-TRUST LAUNCHER • DISCIPLINE MODE</span>
        </div>

        {/* Minimal Zen Clock */}
        <div className="mt-3">
          <h1 className="text-4xl sm:text-5xl font-mono font-light tracking-tight text-zinc-100">
            {timeStr || "12:00"}
          </h1>
          <p className="text-xs font-mono tracking-widest text-zinc-400 uppercase mt-0.5">
            {dateStr}
          </p>
        </div>

        {/* Behavioral Ticker Banner */}
        <div className="mt-3 p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800/80 flex items-center justify-between text-left">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-zinc-950 border border-zinc-800">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div>
              <div className="text-[10px] font-mono text-zinc-400 uppercase">
                Digital Dependency (DDS)
              </div>
              <div className="text-xs font-bold font-mono text-zinc-200">
                {analytics.dds_score.toFixed(1)} / 100 •{" "}
                <span className={ddsInfo.textColor}>{ddsInfo.label}</span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[9px] font-mono text-zinc-500 uppercase">Impulse IVI</div>
            <div className="text-xs font-mono font-semibold text-zinc-300">
              {analytics.ivi_ms > 0 ? `${analytics.ivi_ms}ms` : "Calibrating"}
            </div>
          </div>
        </div>

        {/* 4-Hour System Lockdown Banner if triggered */}
        {isLockdownActive && (
          <div className="mt-2 p-2 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs font-mono flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>4-HOUR LOCKDOWN ACTIVE: Exceeded strike threshold (3 denials/hr).</span>
          </div>
        )}
      </div>

      {/* Center Section: ZERO LOCKED APP ICONS. Displayed ONLY when negotiation is successful */}
      <div className="my-auto py-2 space-y-3">
        {/* CASE 1: NEGOTIATION SUCCEEDED - Display Unlocked App Icon(s) */}
        {activeGrants.length > 0 ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-mono tracking-wider text-emerald-400 uppercase flex items-center gap-1 font-bold">
                <Unlock className="w-3 h-3 text-emerald-400" />
                Negotiation Succeeded • Unlocked
              </span>
              <span className="text-[9px] font-mono text-emerald-500 bg-emerald-950/70 border border-emerald-800/80 px-2 py-0.5 rounded-full">
                ACTIVE PASS
              </span>
            </div>

            <div className="space-y-2">
              {activeGrants.map(grant => {
                const remaining = formatRemainingSeconds(grant.expiresAt);
                return (
                  <div
                    key={grant.app.package_name}
                    className="p-3.5 rounded-2xl bg-zinc-900/90 border-2 border-emerald-500/70 shadow-lg shadow-emerald-500/10 flex items-center justify-between gap-3 animate-in fade-in"
                  >
                    {/* Unlocked App Icon (Tappable to launch) */}
                    <button
                      type="button"
                      onClick={() =>
                        onLaunchUnlockedApp
                          ? onLaunchUnlockedApp(grant)
                          : onLaunchRestrictedApp(grant.app)
                      }
                      className="flex items-center gap-3 text-left group flex-1 cursor-pointer"
                      title={`Tap to open ${grant.app.app_name}`}
                    >
                      <div className="relative">
                        <div
                          className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${
                            grant.app.color || "from-amber-500 to-amber-600"
                          } p-0.5 shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform flex items-center justify-center`}
                        >
                          <div className="w-full h-full rounded-[14px] bg-zinc-950/40 backdrop-blur-sm flex items-center justify-center text-white">
                            <AppIcon iconName={grant.app.icon_name} className="w-7 h-7" />
                          </div>
                        </div>
                        <div className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-full bg-emerald-500 text-zinc-950 text-[8px] font-mono font-black uppercase shadow">
                          OPEN
                        </div>
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold text-zinc-100 truncate">
                            {grant.app.app_name}
                          </span>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                        </div>
                        <div className="text-[11px] font-mono text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          <span>Allotted: {remaining}</span>
                        </div>
                        <div className="text-[9px] text-zinc-400 truncate max-w-[140px] italic">
                          "{grant.reason}"
                        </div>
                      </div>
                    </button>

                    {/* Open Button */}
                    <button
                      type="button"
                      onClick={() =>
                        onLaunchUnlockedApp
                          ? onLaunchUnlockedApp(grant)
                          : onLaunchRestrictedApp(grant.app)
                      }
                      className="px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-zinc-950 font-bold text-[11px] uppercase tracking-wider shadow-md shadow-emerald-500/20 flex items-center gap-1 active:scale-95 transition-all flex-shrink-0"
                    >
                      <span>Open</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* CASE 2: ZERO UNLOCKED APPS - Clean Zero-Trust Discipline Perimeter */
          <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 text-center space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center mx-auto text-amber-400 shadow-inner">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="text-xs font-bold text-zinc-200 uppercase tracking-wide">
              Zero-Trust Quarantine Active
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed max-w-[250px] mx-auto">
              All high-dopamine apps are quarantined. No locked icons appear on screen until unlocked via negotiation.
            </p>
          </div>
        )}

        {/* AI Negotiation Control Card (Text or Talk with Bot to Unlock) */}
        {onOpenChatNegotiation && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-b from-zinc-900/90 to-zinc-900/50 border border-amber-500/30 shadow-md shadow-amber-500/5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-amber-500 text-zinc-950 flex items-center justify-center font-bold shadow-sm">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                    <span>Negotiate Unlock with AI</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  <div className="text-[10px] font-mono text-zinc-400">
                    Text or talk to earn access
                  </div>
                </div>
              </div>

              {/* Quick Mic / Talk Button */}
              <button
                type="button"
                onClick={() => onOpenChatNegotiation(restrictedApps[0])}
                className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500 hover:text-zinc-950 transition-colors"
                title="Talk with Gatekeeper"
              >
                <Mic className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Target App Negotiation Chips (Text chips without showing locked icons) */}
            <div className="space-y-1">
              <div className="text-[9px] font-mono text-zinc-400 uppercase">
                Select app to negotiate:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {restrictedApps.map(app => (
                  <button
                    key={app.package_name}
                    type="button"
                    onClick={() => onOpenChatNegotiation(app)}
                    className="px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-800 hover:border-amber-500/60 hover:text-amber-300 text-zinc-300 text-[10px] font-medium transition-colors"
                  >
                    {app.app_name}
                  </button>
                ))}
              </div>
            </div>

            {/* Main Action Button */}
            <button
              type="button"
              onClick={() => onOpenChatNegotiation(restrictedApps[0])}
              className="w-full py-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
              <span>Start Negotiation Dialogue</span>
            </button>
          </div>
        )}
      </div>

      {/* Bottom Section: Whitelisted App Dock Tray (Essential System Services) */}
      <div className="pt-2">
        <div className="p-2.5 rounded-2xl bg-zinc-900/90 border border-zinc-800/90 shadow-2xl flex items-center justify-around">
          {whitelistedApps.map(app => (
            <button
              key={app.package_name}
              onClick={() => onLaunchWhitelistedApp(app)}
              className="flex flex-col items-center group"
              title={`${app.app_name} (Whitelisted - Direct Access)`}
            >
              <div className="w-10 h-10 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                {app.icon_name === "Phone" && <Phone className="w-5 h-5 text-emerald-400" />}
                {app.icon_name === "Camera" && <Camera className="w-5 h-5 text-zinc-300" />}
                {app.icon_name === "Calendar" && <Calendar className="w-5 h-5 text-blue-400" />}
                {app.icon_name === "ShieldCheck" && <ShieldCheck className="w-5 h-5 text-amber-400" />}
              </div>
              <span className="text-[9px] font-medium text-zinc-400 mt-1">
                {app.app_name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
