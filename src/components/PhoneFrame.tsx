import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Wifi, Battery, Signal, Lock, ChevronUp, Smartphone } from "lucide-react";

interface PhoneFrameProps {
  children: React.ReactNode;
  isLocked: boolean;
  onUnlock: () => void;
  overlayElement?: React.ReactNode;
  activeSessionElement?: React.ReactNode;
  auditModalElement?: React.ReactNode;
}

export const PhoneFrame: React.FC<PhoneFrameProps> = ({
  children,
  isLocked,
  onUnlock,
  overlayElement,
  activeSessionElement,
  auditModalElement
}) => {
  const [currentTime] = useState(() => {
    const d = new Date();
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
  });

  return (
    <div className="relative mx-auto w-full max-w-[380px] sm:max-w-[400px] h-[780px] sm:h-[820px] rounded-[48px] bg-zinc-950 p-3.5 shadow-2xl border-[5px] border-zinc-800 ring-1 ring-zinc-700/50 flex flex-col justify-between overflow-hidden select-none">
      {/* Dynamic Island / Top Camera Cutout */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 w-28 h-6 bg-black rounded-full flex items-center justify-between px-3 border border-zinc-800/80 shadow-md">
        <div className="w-2.5 h-2.5 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center">
          <div className="w-1 h-1 rounded-full bg-cyan-900" />
        </div>
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/80" />
      </div>

      {/* Screen Container with edge-to-edge radius */}
      <div className="relative w-full h-full rounded-[38px] bg-zinc-950 overflow-hidden flex flex-col border border-zinc-800/60">
        {/* Status Bar */}
        <div className="relative z-40 px-6 pt-3 pb-1 flex items-center justify-between text-[11px] font-mono font-medium text-zinc-400 bg-zinc-950/70 backdrop-blur-md">
          <span>{currentTime}</span>
          <div className="flex items-center gap-1.5">
            <Signal className="w-3 h-3" />
            <Wifi className="w-3 h-3" />
            <Battery className="w-3.5 h-3.5 text-zinc-300" />
          </div>
        </div>

        {/* Screen Content */}
        <div className="relative flex-1 w-full h-full overflow-hidden flex flex-col">
          {/* Main Launcher Content */}
          {children}

          {/* Lock Screen Overlay (if locked) */}
          <AnimatePresence>
            {isLocked && (
              <motion.div
                className="absolute inset-0 z-50 bg-zinc-950/95 backdrop-blur-xl flex flex-col justify-between p-6 text-center select-none"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -60 }}
                transition={{ duration: 0.3 }}
              >
                <div className="pt-10 flex flex-col items-center">
                  <div className="p-3 rounded-full bg-zinc-900 border border-zinc-800 text-amber-400 mb-4 shadow-lg">
                    <Lock className="w-6 h-6" />
                  </div>
                  <h2 className="text-4xl font-mono font-light text-zinc-100">{currentTime}</h2>
                  <p className="text-xs font-mono uppercase tracking-widest text-zinc-400 mt-1">
                    Protected by Gatekeeper Core
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-400 space-y-1">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-amber-500 font-bold">
                    Impulse Velocity Metric Engine
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Unlocking will start the Δt timer. Tap a restricted app to register your reaction velocity.
                  </p>
                </div>

                <div className="pb-6">
                  <button
                    onClick={onUnlock}
                    className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <ChevronUp className="w-4 h-4 animate-bounce" />
                    Swipe Up or Tap to Unlock
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Active Session HUD Element */}
          <AnimatePresence>{activeSessionElement}</AnimatePresence>

          {/* Opaque System Interceptor Overlay Element */}
          <AnimatePresence>{overlayElement}</AnimatePresence>

          {/* Post Session Audit Modal Element */}
          <AnimatePresence>{auditModalElement}</AnimatePresence>
        </div>

        {/* Bottom Home Indicator Bar (Android 15 / iOS 18 Gesture Bar) */}
        <div className="relative z-40 py-2 flex justify-center bg-zinc-950">
          <div className="w-32 h-1 bg-zinc-700 rounded-full" />
        </div>
      </div>
    </div>
  );
};
