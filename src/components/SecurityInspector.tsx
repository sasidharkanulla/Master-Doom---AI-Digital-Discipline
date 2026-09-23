import React, { useState } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  Copy,
  Check,
  Code2,
  FileCode,
  Terminal,
  Cpu,
  AlertTriangle,
  RefreshCw,
  Smartphone
} from "lucide-react";
import { NATIVE_CODE_BLUEPRINTS } from "../data/initialData";
import { SecurityState } from "../types";

interface SecurityInspectorProps {
  securityState: SecurityState;
  onToggleSecurityParam: (key: keyof SecurityState) => void;
}

export const SecurityInspector: React.FC<SecurityInspectorProps> = ({
  securityState,
  onToggleSecurityParam
}) => {
  const [activeCodeTab, setActiveCodeTab] = useState<
    "android_overlay_service" | "ios_shield_extension" | "fastapi_main" | "sql_schema"
  >("android_overlay_service");
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(NATIVE_CODE_BLUEPRINTS[activeCodeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 text-zinc-100 select-none pb-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono mb-1.5">
          <Lock className="w-3.5 h-3.5" />
          SECTION 1, 6 & 7: OS-LEVEL HOOKS & ANTI-CHEAT ARCHITECTURE
        </div>
        <h2 className="text-xl sm:text-2xl font-bold font-sans tracking-tight text-zinc-100">
          Native Kernel Interceptors & Security Hardening
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
          Production implementation specifications for Android 15 (API 35), iOS 18 Shield Extensions, and Tamper Defenses.
        </p>
      </div>

      {/* Interactive Anti-Cheat Defense Status */}
      <div className="p-5 rounded-3xl bg-zinc-900/80 border border-zinc-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider font-mono flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            Active Anti-Cheat Status & Permissions Monitor
          </h3>
          <span className="text-[10px] font-mono text-zinc-500">LIVE OS HOOK SIMULATOR</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* SYSTEM_ALERT_WINDOW */}
          <div
            onClick={() => onToggleSecurityParam("system_alert_window_granted")}
            className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
              securityState.system_alert_window_granted
                ? "bg-zinc-950 border-emerald-900/60 hover:border-emerald-700"
                : "bg-rose-950/40 border-rose-900 hover:border-rose-700"
            }`}
          >
            <div className="flex items-center justify-between text-xs font-mono mb-1">
              <span className="text-zinc-300">SYSTEM_ALERT_WINDOW</span>
              {securityState.system_alert_window_granted ? (
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-400" />
              )}
            </div>
            <p className="text-[11px] text-zinc-400">
              {securityState.system_alert_window_granted
                ? "Granted: TYPE_APPLICATION_OVERLAY active with cutout coverage."
                : "REVOKED: Hard-lock notification loop triggered instantly."}
            </p>
          </div>

          {/* FLAG_SECURE */}
          <div
            onClick={() => onToggleSecurityParam("flag_secure_enabled")}
            className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 cursor-pointer transition-all"
          >
            <div className="flex items-center justify-between text-xs font-mono mb-1">
              <span className="text-zinc-300">FLAG_SECURE Defense</span>
              <Lock className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-[11px] text-zinc-400">
              Blocks UI caching and screenshot rendering in Android OS Recents switcher.
            </p>
          </div>

          {/* Boot Receiver */}
          <div
            onClick={() => onToggleSecurityParam("boot_receiver_registered")}
            className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 cursor-pointer transition-all"
          >
            <div className="flex items-center justify-between text-xs font-mono mb-1">
              <span className="text-zinc-300">RECEIVE_BOOT_COMPLETED</span>
              <RefreshCw className="w-4 h-4 text-cyan-400" />
            </div>
            <p className="text-[11px] text-zinc-400">
              Auto-reinitializes ForegroundService interceptor upon device restart.
            </p>
          </div>

          {/* Android 15 Special Use */}
          <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800">
            <div className="flex items-center justify-between text-xs font-mono mb-1">
              <span className="text-zinc-300">API 35 Compliance</span>
              <Cpu className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-[11px] text-zinc-400">
              foregroundServiceType="specialUse" with mandatory System.onTimeout() handler.
            </p>
          </div>
        </div>
      </div>

      {/* Production Code Blueprint Viewer */}
      <div className="rounded-3xl bg-zinc-900/90 border border-zinc-800 overflow-hidden shadow-2xl">
        {/* Code Tabs */}
        <div className="p-3 bg-zinc-950 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-1 overflow-x-auto text-xs font-mono">
            <button
              onClick={() => setActiveCodeTab("android_overlay_service")}
              className={`px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 ${
                activeCodeTab === "android_overlay_service"
                  ? "bg-zinc-800 text-amber-400 font-bold border border-zinc-700"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              GatekeeperOverlayService.kt
            </button>
            <button
              onClick={() => setActiveCodeTab("ios_shield_extension")}
              className={`px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 ${
                activeCodeTab === "ios_shield_extension"
                  ? "bg-zinc-800 text-amber-400 font-bold border border-zinc-700"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              ShieldConfigurationExtension.swift
            </button>
            <button
              onClick={() => setActiveCodeTab("fastapi_main")}
              className={`px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 ${
                activeCodeTab === "fastapi_main"
                  ? "bg-zinc-800 text-amber-400 font-bold border border-zinc-700"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              main.py (FastAPI)
            </button>
            <button
              onClick={() => setActiveCodeTab("sql_schema")}
              className={`px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 ${
                activeCodeTab === "sql_schema"
                  ? "bg-zinc-800 text-amber-400 font-bold border border-zinc-700"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              schema.sql (Room/SQLite)
            </button>
          </div>

          <button
            onClick={handleCopyCode}
            className="self-end sm:self-auto px-3 py-1 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 text-xs font-mono transition-colors flex items-center gap-1.5"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Copy Code
              </>
            )}
          </button>
        </div>

        {/* Code Content Block */}
        <pre className="p-4 sm:p-6 text-xs font-mono text-zinc-300 overflow-x-auto leading-relaxed bg-zinc-950/80 max-h-[500px]">
          <code>{NATIVE_CODE_BLUEPRINTS[activeCodeTab]}</code>
        </pre>
      </div>
    </div>
  );
};
