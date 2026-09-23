import React, { useState } from "react";
import { motion } from "motion/react";
import { ShieldAlert, CheckCircle, XCircle, Clock, Sparkles } from "lucide-react";
import { RestrictedApp } from "../types";
import { MasterSatoshiVisual } from "./MasterSatoshiVisual";

interface PostSessionAuditModalProps {
  app: RestrictedApp;
  userPrompt: string;
  characterId: string;
  onAuditSubmit: (passed: boolean) => void;
}

export const PostSessionAuditModal: React.FC<PostSessionAuditModalProps> = ({
  app,
  userPrompt,
  characterId,
  onAuditSubmit
}) => {
  const [submitted, setSubmitted] = useState<boolean | null>(null);

  const handleAudit = (passed: boolean) => {
    setSubmitted(passed);
    setTimeout(() => {
      onAuditSubmit(passed);
    }, 1500);
  };

  return (
    <motion.div
      className="absolute inset-0 z-50 bg-zinc-950/98 backdrop-blur-3xl text-zinc-100 flex flex-col justify-between p-5 select-none"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
    >
      {/* Header */}
      <div className="text-center pt-6 space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-mono font-semibold tracking-wider uppercase">
          <Clock className="w-3.5 h-3.5" />
          SESSION TIMER EXPIRED • SCREEN RE-MASKED
        </div>
        <h2 className="text-lg font-serif font-bold text-zinc-100 mt-2">
          Post-Session Integrity Audit
        </h2>
        <p className="text-xs text-zinc-400">
          The Zero-Trust firewall has re-engaged. Master Satoshi demands an honest accounting.
        </p>
      </div>

      {/* Visual Avatar */}
      <div className="py-2 flex justify-center">
        <MasterSatoshiVisual
          state={submitted === true ? "APPROVED" : submitted === false ? "DENIED" : "AUDIT"}
          characterId={characterId}
        />
      </div>

      {/* Audit Question Box */}
      <div className="w-full max-w-sm mx-auto p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-center space-y-3 shadow-xl">
        <div>
          <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
            Your Stated Commitment:
          </div>
          <p className="text-xs sm:text-sm font-semibold text-amber-200 mt-1 italic">
            "{userPrompt}"
          </p>
        </div>

        <p className="text-xs text-zinc-300">
          Did you strictly execute this utility task without drifting into mindless consumption?
        </p>

        {submitted === null ? (
          <div className="grid grid-cols-2 gap-2.5 pt-2">
            <button
              onClick={() => handleAudit(true)}
              className="py-2.5 px-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
            >
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              Yes, Accomplished
            </button>
            <button
              onClick={() => handleAudit(false)}
              className="py-2.5 px-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 hover:bg-rose-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
            >
              <XCircle className="w-4 h-4 text-rose-400" />
              No, Got Distracted
            </button>
          </div>
        ) : (
          <div
            className={`py-3 px-4 rounded-xl border text-xs font-mono font-bold flex items-center justify-center gap-2 ${
              submitted
                ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                : "bg-rose-500/20 border-rose-500 text-rose-300"
            }`}
          >
            {submitted ? (
              <>
                <CheckCircle className="w-4 h-4" />
                Audit Passed. Intent Realization Recorded.
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4" />
                Relapse Recorded. Cooldown Quarantine Applied.
              </>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center pb-4 text-[10px] font-mono text-zinc-500">
        Intent Realization Index (IRI) updates with every verified session.
      </div>
    </motion.div>
  );
};
