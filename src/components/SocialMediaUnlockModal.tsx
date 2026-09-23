import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Lock,
  ShieldAlert,
  CheckCircle2,
  Sparkles,
  Send,
  AlertTriangle,
  Flame,
  Volume2
} from "lucide-react";
import { AppIcon } from "./AppIcon";

interface SocialMediaUnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  app: {
    package_name: string;
    app_name: string;
    icon_name: string;
    category: string;
  } | null;
  onUnlockSuccess: (app: any, reason: string, durationSeconds: number) => void;
}

export const SocialMediaUnlockModal: React.FC<SocialMediaUnlockModalProps> = ({
  isOpen,
  onClose,
  app,
  onUnlockSuccess
}) => {
  const [reasonText, setReasonText] = useState("");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [result, setResult] = useState<{
    decision: "APPROVED" | "DENIED" | null;
    dialogue: string;
    duration: number;
    cooldown: number;
  } | null>(null);

  if (!isOpen || !app) return null;

  const SAMPLE_REASONS = [
    {
      label: "Valid Duty",
      text: "Need to reply to urgent client inquiry sent via DM with project files"
    },
    {
      label: "Valid Duty",
      text: "Publishing pre-scheduled business announcement and product update"
    },
    {
      label: "Impulsive (Denied)",
      text: "Just bored and wanted to scroll the feed for 5 minutes"
    }
  ];

  const handleEvaluateReason = async (textToEvaluate?: string) => {
    const prompt = (textToEvaluate || reasonText).trim();
    if (!prompt || isEvaluating) return;

    setIsEvaluating(true);
    setResult(null);

    try {
      const now = new Date();
      const res = await fetch("/api/bargain/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          package_name: app.package_name,
          user_prompt: prompt,
          character_id: "satoshi",
          client_hour: now.getHours(),
          client_time_str: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        })
      });

      const data = await res.json();
      setResult({
        decision: data.decision,
        dialogue: data.dialogue_text || "State your intention clearly.",
        duration: data.granted_duration_seconds || (data.decision === "APPROVED" ? 180 : 0),
        cooldown: data.cooldown_seconds || (data.decision === "DENIED" ? 900 : 0)
      });

      if (data.decision === "APPROVED") {
        setTimeout(() => {
          onUnlockSuccess(app, prompt, data.granted_duration_seconds || 180);
          onClose();
        }, 1800);
      }
    } catch (err) {
      console.warn("Evaluation error:", err);
      // Fallback deterministic check for offline resilience
      const lower = prompt.toLowerCase();
      const isUrgent =
        lower.includes("client") ||
        lower.includes("work") ||
        lower.includes("business") ||
        lower.includes("publish") ||
        lower.includes("emergency");

      if (isUrgent) {
        setResult({
          decision: "APPROVED",
          dialogue: "Legitimate duty verified. 3 minutes granted. Complete your task and depart immediately.",
          duration: 180,
          cooldown: 0
        });
        setTimeout(() => {
          onUnlockSuccess(app, prompt, 180);
          onClose();
        }, 1800);
      } else {
        setResult({
          decision: "DENIED",
          dialogue: "Impulse detected. Social media feeds destroy deep stillness. Restraint cooldown initiated.",
          duration: 0,
          cooldown: 900
        });
      }
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl text-white select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-lg rounded-3xl bg-black/95 border border-white/60 p-6 sm:p-8 shadow-2xl space-y-4"
      >
        {/* Top bar */}
        <div className="flex items-center justify-between border-b border-white/20 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-transparent border border-white/40 flex items-center justify-center text-white">
              <Lock className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-white/70">
                Strict Restriction
              </span>
              <h3 className="text-base sm:text-lg font-serif font-bold text-white">
                Unlock {app.app_name}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-transparent hover:bg-white/10 text-white border border-white/20 transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Master Satoshi's Rule Explainer */}
        <div className="p-3.5 rounded-2xl bg-transparent border border-white/30 text-xs font-serif leading-relaxed text-white space-y-1.5">
          <div className="flex items-center gap-1.5 text-white font-mono text-[11px] uppercase font-bold">
            <AlertTriangle className="w-3.5 h-3.5 text-white" />
            <span>Master Satoshi's Iron Rule for Social Media</span>
          </div>
          <p className="text-white/80">
            Unlike productivity apps, social media cannot be accessed directly. You must state a <strong>valid, verifiable reason</strong> to Master Satoshi. Mindless scrolling or boredom will be denied.
          </p>
        </div>

        {/* Test sample prompts */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-mono uppercase text-white/60">
            Test Petition Reasons:
          </span>
          <div className="flex flex-col gap-1.5">
            {SAMPLE_REASONS.map((sample, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setReasonText(sample.text);
                  handleEvaluateReason(sample.text);
                }}
                className="px-3 py-1.5 rounded-xl bg-transparent hover:bg-white/10 text-white border border-white/20 hover:border-white/50 text-[11px] font-serif transition-colors text-left flex items-center justify-between"
              >
                <span className="truncate mr-2">"{sample.text}"</span>
                <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border border-white/30 text-white flex-shrink-0">
                  {sample.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Input box */}
        <div className="space-y-2 pt-1">
          <span className="text-[10px] font-mono uppercase text-white/60">
            Or state your custom reason:
          </span>
          <textarea
            value={reasonText}
            onChange={(e) => setReasonText(e.target.value)}
            placeholder="Explain why you genuinely need access to this app right now..."
            rows={3}
            className="w-full px-3 py-2 rounded-xl bg-transparent border border-white/40 text-xs font-serif text-white placeholder-white/40 focus:outline-none focus:border-white resize-none"
          />

          <button
            onClick={() => handleEvaluateReason()}
            disabled={!reasonText.trim() || isEvaluating}
            className="w-full py-2.5 rounded-xl bg-transparent hover:bg-white/10 disabled:opacity-30 text-white border border-white font-mono text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md"
          >
            {isEvaluating ? (
              <>
                <Sparkles className="w-3.5 h-3.5 text-white animate-spin" />
                <span>Master Satoshi is judging intent...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5 text-white" />
                <span>Petition Master Satoshi</span>
              </>
            )}
          </button>
        </div>

        {/* Verdict Display */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-2xl bg-transparent border border-white/60 text-white space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {result.decision === "APPROVED" ? (
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  ) : (
                    <ShieldAlert className="w-4 h-4 text-white" />
                  )}
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                    Verdict: {result.decision}
                  </span>
                </div>
                {result.decision === "APPROVED" ? (
                  <span className="text-[10px] font-mono text-white/80">
                    Duration: {Math.floor(result.duration / 60)}m
                  </span>
                ) : (
                  <span className="text-[10px] font-mono text-white/80">
                    Cooldown: {Math.floor(result.cooldown / 60)}m
                  </span>
                )}
              </div>

              <p className="text-xs font-serif text-white/90 italic">
                "{result.dialogue}"
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
