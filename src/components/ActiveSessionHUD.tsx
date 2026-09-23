import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Clock, CheckCircle, ShieldAlert, ArrowLeft, Send } from "lucide-react";
import { RestrictedApp } from "../types";
import { soundEngine } from "../utils/audio";

interface ActiveSessionHUDProps {
  app: RestrictedApp;
  grantedDurationSeconds: number;
  userPrompt: string;
  onTimeExpired: () => void;
  onFinishEarly: () => void;
}

export const ActiveSessionHUD: React.FC<ActiveSessionHUDProps> = ({
  app,
  grantedDurationSeconds,
  userPrompt,
  onTimeExpired,
  onFinishEarly
}) => {
  const [remainingSeconds, setRemainingSeconds] = useState(grantedDurationSeconds);

  useEffect(() => {
    if (remainingSeconds <= 0) {
      soundEngine.playAuditChime();
      onTimeExpired();
      return;
    }

    const interval = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          soundEngine.playAuditChime();
          onTimeExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [remainingSeconds, onTimeExpired]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const isUrgent = remainingSeconds <= 30;

  return (
    <div className="absolute inset-0 z-40 bg-zinc-950 text-zinc-100 flex flex-col justify-between overflow-hidden">
      {/* Top Persistent Hard Countdown HUD */}
      <div
        className={`px-4 pt-8 pb-3 border-b flex items-center justify-between transition-colors ${
          isUrgent
            ? "bg-rose-950/90 border-rose-800/80 animate-pulse text-rose-200"
            : "bg-zinc-900/95 border-zinc-800 text-zinc-100"
        }`}
      >
        <div className="flex items-center gap-2">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              isUrgent ? "bg-rose-500 animate-ping" : "bg-emerald-500 animate-pulse"
            }`}
          />
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">
              HARD COUNTDOWN ACTIVE
            </div>
            <div className="text-xs font-semibold text-zinc-200 truncate max-w-[170px]">
              Task: "{userPrompt}"
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span
              className={`text-xl font-mono font-black tracking-wider ${
                isUrgent ? "text-rose-400" : "text-amber-400"
              }`}
            >
              {formatTime(remainingSeconds)}
            </span>
          </div>

          <button
            onClick={onFinishEarly}
            className="px-2.5 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors"
          >
            Done Early
          </button>
        </div>
      </div>

      {/* Simulated Application Window Content */}
      <div className="flex-1 bg-zinc-900 flex flex-col overflow-y-auto">
        {/* App Bar */}
        <div className="px-4 py-2.5 bg-zinc-950/60 border-b border-zinc-800/50 flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full bg-gradient-to-tr ${app.color}`} />
            <span className="font-semibold text-zinc-200">{app.app_name}</span>
          </div>
          <span className="text-[10px] font-mono text-zinc-500">Zero-Trust Guarded Sandbox</span>
        </div>

        {/* Mock App Content showing the utility task */}
        <div className="p-4 space-y-3 flex-1">
          <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/70 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-zinc-400">
              <span className="font-medium text-amber-400">Direct Message / Task Channel</span>
              <span className="text-[10px] text-zinc-500">Today 12:04 PM</span>
            </div>
            <p className="text-xs text-zinc-200 leading-relaxed">
              "Client: The office address for our 2:00 PM session is 742 Evergreen Terrace, Suite 400. Door code is 8841."
            </p>
          </div>

          <div className="p-3 rounded-xl bg-zinc-950/40 border border-zinc-800/40 text-xs text-zinc-400 space-y-2">
            <div className="flex items-center gap-2 text-zinc-300">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>Time-Bound Window Constraint</span>
            </div>
            <p className="text-[11px] text-zinc-500">
              Execute your task without distraction. When the timer reaches 0:00, Master Satoshi will re-mask the display and audit your completion.
            </p>
          </div>

          <div className="pt-2">
            <div className="text-[11px] font-mono text-zinc-500 mb-1">Reply / Note to Client:</div>
            <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2">
              <input
                type="text"
                placeholder="Type confirmation..."
                className="bg-transparent text-xs text-zinc-100 flex-1 focus:outline-none"
                defaultValue="Received. On my way."
              />
              <button
                onClick={onFinishEarly}
                className="p-1 rounded-lg bg-amber-500 text-zinc-950"
              >
                <Send className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom status bar */}
      <div className="px-4 py-2 bg-zinc-950 border-t border-zinc-800 text-[10px] font-mono text-zinc-500 flex items-center justify-between">
        <span>STATUS: APPLICATION_TEMPORARY_UNMASK</span>
        <span>POST-SESSION AUDIT PENDING</span>
      </div>
    </div>
  );
};
