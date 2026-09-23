import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Mic, MicOff, Volume2, X, Sparkles, Radio } from "lucide-react";
import { LiveVoiceSession } from "../utils/liveVoice";

interface LiveVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMasterSpoke?: (text?: string) => void;
}

export const LiveVoiceModal: React.FC<LiveVoiceModalProps> = ({ isOpen, onClose }) => {
  const [status, setStatus] = useState<"connecting" | "connected" | "speaking" | "listening" | "disconnected">("connecting");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const sessionRef = useRef<LiveVoiceSession | null>(null);

  useEffect(() => {
    if (!isOpen) {
      if (sessionRef.current) {
        sessionRef.current.stop();
        sessionRef.current = null;
      }
      return;
    }

    setErrorMessage("");
    setStatus("connecting");

    const session = new LiveVoiceSession({
      onStatusChange: (newStatus, err) => {
        setStatus(newStatus);
        if (err) setErrorMessage(err);
      },
      onAudioLevel: (level) => {
        setAudioLevel(level);
      }
    });

    sessionRef.current = session;
    session.start().catch((err) => {
      setErrorMessage(err.message || "Failed to start live voice session");
      setStatus("disconnected");
    });

    return () => {
      if (sessionRef.current) {
        sessionRef.current.stop();
        sessionRef.current = null;
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
      >
        <div className="relative w-full max-w-md rounded-2xl bg-black/95 border border-white/30 p-6 sm:p-8 shadow-2xl text-center overflow-hidden backdrop-blur-xl">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl bg-transparent hover:bg-white/10 text-white border border-white/20 transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>

          {/* Header */}
          <div className="flex items-center justify-center gap-2 mb-1">
            <Radio className="w-3.5 h-3.5 text-white animate-pulse" />
            <span className="text-[11px] font-mono tracking-widest text-white uppercase font-semibold">
              Live Voice • gemini-3.8-live
            </span>
          </div>
          <h3 className="text-xl font-serif tracking-wide text-white font-semibold mt-1">
            Dialogue with Master Satoshi
          </h3>
          <p className="text-xs text-white/70 font-sans mt-1 max-w-xs mx-auto">
            Speak naturally. Master Satoshi hears your spoken words and answers in real-time.
          </p>

          {/* Visualizer Pulsing Orb (Minimalist Monochrome) */}
          <div className="relative my-8 flex items-center justify-center">
            {/* Ambient pulse rings */}
            <motion.div
              className="absolute w-36 h-36 rounded-full border border-white/20"
              animate={{
                scale: status === "speaking" ? [1, 1.35, 1] : 1 + audioLevel * 0.7,
                opacity: status === "speaking" ? [0.2, 0.6, 0.2] : 0.15 + audioLevel * 0.5
              }}
              transition={{
                duration: status === "speaking" ? 1.2 : 0.1,
                repeat: status === "speaking" ? Infinity : 0
              }}
            />
            <motion.div
              className="absolute w-28 h-28 rounded-full border border-white/30"
              animate={{
                scale: status === "speaking" ? [1, 1.2, 1] : 1 + audioLevel * 0.4
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />

            {/* Center Core Circle */}
            <div
              className="relative z-10 w-24 h-24 rounded-full flex items-center justify-center border-2 border-white bg-transparent text-white shadow-xl transition-all duration-300"
            >
              {status === "speaking" ? (
                <Volume2 className="w-10 h-10 animate-bounce text-white" />
              ) : status === "listening" ? (
                <Mic className="w-10 h-10 animate-pulse text-white" />
              ) : (
                <Sparkles className="w-8 h-8 animate-spin text-white" />
              )}
            </div>
          </div>

          {/* Status feedback */}
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-transparent border border-white/30 text-xs font-mono text-white">
              <span
                className={`w-2 h-2 rounded-full bg-white ${
                  status === "speaking" || status === "listening" || status === "connecting"
                    ? "animate-pulse"
                    : ""
                }`}
              />
              <span className="text-white capitalize">
                {status === "connecting" && "Establishing connection..."}
                {status === "listening" && "Listening to you... Speak freely"}
                {status === "speaking" && "Master Satoshi is speaking..."}
                {status === "connected" && "Ready..."}
                {status === "disconnected" && (errorMessage || "Session ended")}
              </span>
            </div>

            <p className="text-[11px] text-white/50 font-serif italic pt-3">
              "Master your tongue, and you master your destiny."
            </p>
          </div>

          {/* Controls */}
          <div className="mt-6 flex items-center justify-center gap-3">
            {status === "disconnected" ? (
              <button
                onClick={() => {
                  setErrorMessage("");
                  setStatus("connecting");
                  const session = new LiveVoiceSession({
                    onStatusChange: (s, e) => {
                      setStatus(s);
                      if (e) setErrorMessage(e);
                    },
                    onAudioLevel: (lvl) => setAudioLevel(lvl)
                  });
                  sessionRef.current = session;
                  session.start();
                }}
                className="px-5 py-2.5 rounded-xl bg-transparent hover:bg-white/10 text-white border border-white font-semibold font-mono text-xs tracking-wide transition-colors"
              >
                Reconnect
              </button>
            ) : (
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-transparent hover:bg-white/10 text-white border border-white/30 text-xs font-mono tracking-wide transition-colors"
              >
                End Voice Session
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
