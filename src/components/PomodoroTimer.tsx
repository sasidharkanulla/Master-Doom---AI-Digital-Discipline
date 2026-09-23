import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Target,
  Flame,
  CheckCircle,
  Clock,
  Sparkles,
  ChevronRight
} from "lucide-react";
import { soundEngine } from "../utils/audio";

interface PomodoroTimerProps {
  initialDurationSeconds?: number; // default 900 (15 min)
  onSprintComplete?: () => void;
  appName: string;
}

export const PomodoroTimer: React.FC<PomodoroTimerProps> = ({
  initialDurationSeconds = 900, // 15-minute window
  onSprintComplete,
  appName
}) => {
  // Timer modes
  const [mode, setMode] = useState<"focus" | "break">("focus");
  const [targetSeconds, setTargetSeconds] = useState<number>(initialDurationSeconds);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(initialDurationSeconds);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [completedSprints, setCompletedSprints] = useState<number>(0);
  const [sprintGoal, setSprintGoal] = useState<string>("");
  const [isEditingGoal, setIsEditingGoal] = useState<boolean>(false);

  // Sync when initial duration changes
  useEffect(() => {
    if (mode === "focus") {
      setTargetSeconds(initialDurationSeconds);
      setSecondsRemaining(initialDurationSeconds);
    }
  }, [initialDurationSeconds]);

  // Main countdown tick
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            // Sprint finished
            if (soundEnabled) {
              soundEngine.playApprovedChime();
            }
            if (mode === "focus") {
              setCompletedSprints((s) => s + 1);
              if (onSprintComplete) {
                onSprintComplete();
              }
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (secondsRemaining === 0 && isActive) {
      setIsActive(false);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, secondsRemaining, mode, soundEnabled, onSprintComplete]);

  const toggleActive = () => {
    if (secondsRemaining === 0) {
      // Restart if reached 0
      setSecondsRemaining(targetSeconds);
      setIsActive(true);
    } else {
      setIsActive(!isActive);
    }
  };

  const handleReset = () => {
    setIsActive(false);
    setSecondsRemaining(targetSeconds);
  };

  const handleSetMode = (newMode: "focus" | "break", durationSec: number) => {
    setMode(newMode);
    setTargetSeconds(durationSec);
    setSecondsRemaining(durationSec);
    setIsActive(true);
  };

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const timeFormatted = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  // Progress percentage (0% at start, 100% at end)
  const elapsed = targetSeconds - secondsRemaining;
  const progressRatio = targetSeconds > 0 ? elapsed / targetSeconds : 0;
  const progressPercent = Math.min(100, Math.max(0, progressRatio * 100));

  // Circular progress calculation
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - progressRatio * circumference;

  return (
    <div className="w-full rounded-2xl bg-transparent border border-white/30 p-4 sm:p-5 text-white backdrop-blur-sm shadow-xl space-y-4">
      {/* Top Header: Mode Selector & Sound Toggle */}
      <div className="flex items-center justify-between border-b border-white/20 pb-3">
        <div className="flex items-center gap-2">
          {/* 15m Focus Sprint Mode */}
          <button
            onClick={() => handleSetMode("focus", 900)}
            className={`px-3 py-1 rounded-xl text-xs font-mono transition-all flex items-center gap-1.5 border ${
              mode === "focus" && targetSeconds === 900
                ? "bg-transparent text-white font-bold border-white"
                : "bg-transparent text-white/60 hover:text-white border-transparent"
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-white" />
            <span>15m Focus Sprint</span>
          </button>

          {/* 5m Rest Mode */}
          <button
            onClick={() => handleSetMode("break", 300)}
            className={`px-3 py-1 rounded-xl text-xs font-mono transition-all flex items-center gap-1.5 border ${
              mode === "break"
                ? "bg-transparent text-white font-bold border-white"
                : "bg-transparent text-white/60 hover:text-white border-transparent"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-white" />
            <span>5m Breather</span>
          </button>
        </div>

        {/* Audio Zen Chime Toggle */}
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="p-1.5 rounded-xl bg-transparent hover:bg-white/10 text-white border border-white/20 transition-colors"
          title={soundEnabled ? "Chime enabled on finish" : "Chime muted"}
        >
          {soundEnabled ? (
            <Volume2 className="w-4 h-4 text-white" />
          ) : (
            <VolumeX className="w-4 h-4 text-white/50" />
          )}
        </button>
      </div>

      {/* Main Focus Dial & Metrics */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 py-1">
        {/* Left: Circular Dial */}
        <div className="relative flex items-center justify-center flex-shrink-0">
          <svg className="w-36 h-36 transform -rotate-90" viewBox="0 0 128 128">
            {/* Background ring */}
            <circle
              cx="64"
              cy="64"
              r={radius}
              stroke="rgba(255, 255, 255, 0.15)"
              strokeWidth="5"
              fill="transparent"
            />
            {/* Active progress ring */}
            <circle
              cx="64"
              cy="64"
              r={radius}
              stroke="#ffffff"
              strokeWidth="5"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-1000 ease-linear"
            />
          </svg>

          {/* Center Digital Display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-2xl sm:text-3xl font-mono font-bold tracking-tight text-white drop-shadow">
              {timeFormatted}
            </span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-white/60 mt-0.5">
              {mode === "focus" ? "Focus Sprint" : "Recovery"}
            </span>
          </div>
        </div>

        {/* Right: Controls & Sprint Stats */}
        <div className="flex-1 w-full space-y-3.5">
          {/* Target Task / Sprint Intention */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] font-mono text-white/70">
              <span className="flex items-center gap-1 text-white">
                <Target className="w-3.5 h-3.5 text-white" />
                <span>Single Focus Objective:</span>
              </span>
              <button
                onClick={() => setIsEditingGoal(!isEditingGoal)}
                className="text-[10px] text-white hover:underline uppercase"
              >
                {isEditingGoal ? "Done" : sprintGoal ? "Edit" : "+ Set Objective"}
              </button>
            </div>

            {isEditingGoal ? (
              <input
                type="text"
                value={sprintGoal}
                onChange={(e) => setSprintGoal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") setIsEditingGoal(false);
                }}
                placeholder={`What must be accomplished in ${appName} during these 15m?`}
                className="w-full px-3 py-1.5 rounded-xl bg-transparent border border-white/40 text-xs font-serif text-white placeholder-white/40 focus:outline-none focus:border-white"
                autoFocus
              />
            ) : (
              <p
                onClick={() => setIsEditingGoal(true)}
                className="text-xs font-serif italic text-white/90 truncate cursor-pointer hover:text-white"
              >
                {sprintGoal
                  ? `"${sprintGoal}"`
                  : `Tap to set your single 15-minute goal for ${appName}...`}
              </p>
            )}
          </div>

          {/* Linear Progress Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-mono text-white/60">
              <span>{Math.floor(progressPercent)}% Elapsed</span>
              <span>
                {Math.ceil(secondsRemaining / 60)} min remaining in window
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden border border-white/20">
              <div
                className="h-full bg-white transition-all duration-1000 ease-linear rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Action Buttons: Play/Pause, Reset, +1m */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={toggleActive}
              className="flex-1 py-2 px-3 rounded-xl bg-transparent hover:bg-white/10 text-white border border-white font-mono text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95"
            >
              {isActive ? (
                <>
                  <Pause className="w-3.5 h-3.5 text-white" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 text-white fill-white" />
                  <span>{secondsRemaining === 0 ? "Restart" : "Resume"}</span>
                </>
              )}
            </button>

            <button
              onClick={handleReset}
              className="p-2 rounded-xl bg-transparent hover:bg-white/10 text-white border border-white/30 transition-colors"
              title="Reset Timer to 15m"
            >
              <RotateCcw className="w-3.5 h-3.5 text-white" />
            </button>

            {/* Quick Sprints Completed Counter */}
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-transparent border border-white/20 text-xs font-mono text-white">
              <Flame className="w-3.5 h-3.5 text-white" />
              <span className="font-bold">{completedSprints}</span>
              <span className="text-[10px] text-white/60 hidden sm:inline">
                {completedSprints === 1 ? "sprint" : "sprints"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Stoic Discipline Quote */}
      <div className="flex items-center justify-between text-[11px] font-serif text-white/70 pt-2 border-t border-white/10">
        <span>"Concentrate every minute like a Roman—on doing what's in front of you."</span>
        <span className="font-mono text-[10px] text-white/50">Marcus Aurelius</span>
      </div>
    </div>
  );
};
