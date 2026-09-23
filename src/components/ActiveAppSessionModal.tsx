import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  FastForward,
  Send,
  ShieldAlert,
  Edit3,
  FileText,
  MessageSquare,
  BookOpen,
  Compass,
  Code,
  Volume2,
  Timer
} from "lucide-react";
import { AppIcon } from "./AppIcon";
import { PomodoroTimer } from "./PomodoroTimer";
import { createAccessDeadline } from "../utils/accessDeadline";

interface ActiveAppSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  app: {
    package_name: string;
    app_name: string;
    category: string;
    icon_name: string;
    is_social_media?: boolean;
  } | null;
  initialGrantedSeconds?: number;
  onSessionExtended?: (purpose: string) => void;
  verifiedReason?: string;
}

export const ActiveAppSessionModal: React.FC<ActiveAppSessionModalProps> = ({
  isOpen,
  onClose,
  app,
  initialGrantedSeconds = 0, // Missing social grants expire immediately; direct access keeps its own threshold.
  onSessionExtended,
  verifiedReason
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [purposePromptOpen, setPurposePromptOpen] = useState(false);
  const [statedPurpose, setStatedPurpose] = useState("");
  const [extensionNotice, setExtensionNotice] = useState<string | null>(null);
  const [mockContentState, setMockContentState] = useState("");
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Absolute elapsed time prevents background timer throttling from extending a grant.
  // The callback ref also prevents parent clock updates from restarting the session.
  useEffect(() => {
    if (!isOpen || !app?.is_social_media) return;
    const deadline = createAccessDeadline(initialGrantedSeconds, performance.now());
    let expired = false;
    const tick = () => {
      if (expired) return;
      const snapshot = deadline.read(performance.now());
      setRemainingSeconds(snapshot.remainingSeconds);
      if (snapshot.expired) {
        expired = true;
        onCloseRef.current();
      }
    };
    tick();
    const timer = window.setInterval(tick, 250);
    document.addEventListener("visibilitychange", tick);
    window.addEventListener("focus", tick);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
      window.removeEventListener("focus", tick);
    };
  }, [isOpen, app, initialGrantedSeconds]);

  // Track session timer
  useEffect(() => {
    if (!isOpen || !app) {
      setElapsedSeconds(0);
      setPurposePromptOpen(false);
      setExtensionNotice(null);
      return;
    }

    const timer = setInterval(() => {
      setElapsedSeconds((prev) => {
        const next = prev + 1;
        // Check 15-minute threshold (900 seconds) for direct access apps
        if (!app.is_social_media && next >= 900 && !purposePromptOpen && !extensionNotice) {
          setPurposePromptOpen(true);
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, app, purposePromptOpen, extensionNotice]);

  if (!isOpen || !app) return null;

  const isSocial = Boolean(app.is_social_media);

  // Fast forward helper to immediately test 15-minute threshold
  const handleFastForward15m = () => {
    setElapsedSeconds(905);
    setPurposePromptOpen(true);
  };

  // Submit stated purpose (No hard rules! Grants access smoothly)
  const handleConfirmPurpose = (customText?: string) => {
    const textToSubmit = (customText || statedPurpose).trim();
    if (!textToSubmit) return;

    setPurposePromptOpen(false);
    setExtensionNotice(
      `Master Satoshi: "Purpose acknowledged: '${textToSubmit}'. Access extended for 15 more minutes. No rigid obstacles when working with intention."`
    );

    // Reset countdown for another 15 minutes
    setElapsedSeconds(0);
    setStatedPurpose("");

    if (onSessionExtended) {
      onSessionExtended(textToSubmit);
    }

    setTimeout(() => {
      setExtensionNotice(null);
    }, 6000);
  };

  const formatTimer = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const QUICK_PURPOSE_SUGGESTIONS = [
    "Finalizing document draft",
    "Reviewing project specifications",
    "Replying to urgent work communication",
    "Researching reference material"
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/95 backdrop-blur-2xl text-white select-none">
      <div className="relative w-full max-w-3xl h-[88vh] rounded-3xl bg-transparent border border-white/40 shadow-2xl flex flex-col overflow-hidden text-white">
        {/* Top App Bar & Live HUD */}
        <div className="px-4 sm:px-6 py-3 border-b border-white/20 flex items-center justify-between bg-transparent backdrop-blur-md">
          {/* App Info */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-transparent border border-white/30 flex items-center justify-center text-white">
              <AppIcon iconName={app.icon_name} className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-serif font-bold text-white tracking-wide">
                  {app.app_name}
                </span>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-md border border-white/30 text-white">
                  {isSocial ? "Social Media • Verified Duty" : "Direct Access • No Permission Needed"}
                </span>
              </div>
              <div className="text-[11px] font-mono text-white/70 flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-white" />
                <span>{isSocial ? `Remaining: ${formatTimer(remainingSeconds)}` : `Elapsed: ${formatTimer(elapsedSeconds)}`}</span>
                {!isSocial && (
                  <span className="text-white/40">/ 15:00 threshold</span>
                )}
                {verifiedReason && (
                  <span className="text-white/60 ml-1 truncate max-w-[200px]">
                    • Reason: "{verifiedReason}"
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Controls: Fast Forward + Exit */}
          <div className="flex items-center gap-2">
            {!isSocial && (
              <button
                onClick={handleFastForward15m}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-transparent hover:bg-white/10 text-white border border-white/30 hover:border-white text-[11px] font-mono transition-all"
                title="Simulate spending > 15 minutes to trigger the purpose check"
              >
                <FastForward className="w-3.5 h-3.5 text-white" />
                <span className="hidden sm:inline">Simulate &gt;15m</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-transparent hover:bg-white/10 text-white border border-white/30 transition-colors"
              title="Close and return to Master Satoshi"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* Extension Notice Toast */}
        <AnimatePresence>
          {extensionNotice && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-3 bg-transparent border-b border-white/40 text-xs font-serif text-white flex items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-white flex-shrink-0" />
                <span className="text-white">{extensionNotice}</span>
              </div>
              <button
                onClick={() => setExtensionNotice(null)}
                className="p-1 text-white hover:opacity-70"
              >
                <X className="w-3.5 h-3.5 text-white" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Simulated App Workspace */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 font-sans bg-transparent">
          {/* Header Mock */}
          <div className="p-4 rounded-2xl border border-white/20 bg-transparent space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-widest text-white/70">
                Active Workspace
              </span>
              <span className="text-[10px] font-mono text-white/50">
                Zero-Trust Gatekeeper Guard Active
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-serif text-white font-semibold">
              {app.app_name}: Current Focus Session
            </h2>
            <p className="text-xs font-sans text-white/70 leading-relaxed">
              {isSocial
                ? `You unlocked ${app.app_name} with verified purpose: "${verifiedReason || "Specific utility"}". Keep your session intentional.`
                : `You are using ${app.app_name} via Direct Access without friction. Work as needed; Master Satoshi will only ask for your purpose after 15 minutes.`}
            </p>
          </div>

          {/* POMODORO FOCUS TIMER (15-MINUTE WINDOW FOCUS) */}
          <PomodoroTimer
            initialDurationSeconds={900}
            appName={app.app_name}
            onSprintComplete={() => {
              if (!isSocial) {
                setPurposePromptOpen(true);
              }
            }}
          />

          {/* Interactive Mock Content Area */}
          <div className="p-4 rounded-2xl border border-white/20 bg-transparent space-y-3">
            <div className="flex items-center justify-between text-xs font-mono text-white/80 border-b border-white/10 pb-2">
              <span className="flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5 text-white" />
                <span>Session Notes & Draft Area</span>
              </span>
              <span className="text-[10px] text-white/50">Auto-saved</span>
            </div>

            <textarea
              value={mockContentState}
              onChange={(e) => setMockContentState(e.target.value)}
              placeholder="Type your notes, thoughts, tasks, or continue your active task in this session..."
              className="w-full h-32 bg-transparent text-white placeholder-white/40 border border-white/20 rounded-xl p-3 text-xs sm:text-sm font-mono focus:outline-none focus:border-white leading-relaxed resize-none"
            />

            <div className="flex items-center justify-between text-[11px] font-mono text-white/60">
              <span>Characters: {mockContentState.length}</span>
              <span>Focus mode active</span>
            </div>
          </div>
        </div>

        {/* 15-MINUTE PURPOSE DIALOGUE (TRIGGERED AFTER 15 MINUTES) */}
        <AnimatePresence>
          {purposePromptOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl"
            >
              <div className="w-full max-w-lg rounded-3xl bg-black/95 border border-white/60 p-6 sm:p-8 shadow-2xl text-left space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-transparent border border-white/40 flex items-center justify-center text-white">
                      <Clock className="w-4 h-4 text-white animate-pulse" />
                    </div>
                    <div>
                      <div className="text-xs font-mono uppercase tracking-widest text-white/70">
                        15-Minute Threshold Exceeded
                      </div>
                      <h3 className="text-base sm:text-lg font-serif font-bold text-white">
                        State Your Ongoing Purpose
                      </h3>
                    </div>
                  </div>
                </div>

                {/* Explanation: No Hard Rules! */}
                <p className="text-xs font-serif text-white/80 leading-relaxed border-l-2 border-white/40 pl-3">
                  You have spent over 15 minutes on <strong>{app.app_name}</strong>.
                  There are <strong>no rigid obstacles or harsh denials</strong> here—simply state your ongoing intention to renew access for 15 more minutes.
                </p>

                {/* Quick suggestions */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono uppercase text-white/60">
                    Quick Purpose Options:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_PURPOSE_SUGGESTIONS.map((sug, sIdx) => (
                      <button
                        key={sIdx}
                        onClick={() => handleConfirmPurpose(sug)}
                        className="px-2.5 py-1 rounded-lg bg-transparent hover:bg-white/10 text-white border border-white/30 text-[11px] font-serif transition-colors text-left"
                      >
                        "{sug}"
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom purpose input */}
                <div className="space-y-2 pt-2">
                  <span className="text-[10px] font-mono uppercase text-white/60">
                    Or type specific purpose:
                  </span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={statedPurpose}
                      onChange={(e) => setStatedPurpose(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleConfirmPurpose();
                      }}
                      placeholder="e.g. Completing draft for team review..."
                      className="flex-1 px-3 py-2 rounded-xl bg-transparent border border-white/40 text-xs font-serif text-white placeholder-white/40 focus:outline-none focus:border-white"
                      autoFocus
                    />
                    <button
                      onClick={() => handleConfirmPurpose()}
                      disabled={!statedPurpose.trim()}
                      className="px-4 py-2 rounded-xl bg-transparent hover:bg-white/10 disabled:opacity-30 text-white border border-white text-xs font-mono font-bold transition-all flex items-center gap-1.5"
                    >
                      <span>Continue</span>
                      <Send className="w-3 h-3 text-white" />
                    </button>
                  </div>
                </div>

                <div className="pt-2 text-[10px] font-mono text-white/50 text-center">
                  Master Satoshi: "Self-awareness is the highest form of freedom."
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
