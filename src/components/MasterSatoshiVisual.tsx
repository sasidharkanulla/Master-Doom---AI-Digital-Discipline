import React from "react";
import { motion } from "motion/react";
import { FSMState } from "../types";

interface MasterSatoshiVisualProps {
  state: FSMState;
  characterId: string;
  isListening?: boolean;
}

export const MasterSatoshiVisual: React.FC<MasterSatoshiVisualProps> = ({
  state,
  characterId = "satoshi",
  isListening = false
}) => {
  // Variations based on character
  const isSatoshi = characterId === "satoshi";
  const isVance = characterId === "vance";
  const isMarcus = characterId === "marcus";
  const isCyber = characterId === "cyber";

  return (
    <div className="relative w-48 h-48 sm:w-56 sm:h-56 mx-auto flex items-center justify-center select-none">
      {/* Background Zen Enso / Aura Glow */}
      <motion.div
        className="absolute inset-0 rounded-full blur-xl pointer-events-none"
        animate={{
          scale: state === "LISTENING" ? [1, 1.25, 1] : state === "EVALUATING" ? [1.1, 1.35, 1.1] : 1,
          opacity: state === "DENIED" ? 0.35 : state === "APPROVED" ? 0.6 : 0.25,
          backgroundColor:
            state === "DENIED"
              ? "rgba(225, 29, 72, 0.4)"
              : state === "APPROVED"
              ? "rgba(234, 179, 8, 0.45)"
              : state === "EVALUATING"
              ? "rgba(168, 85, 247, 0.35)"
              : state === "LISTENING"
              ? "rgba(14, 165, 233, 0.4)"
              : "rgba(245, 158, 11, 0.15)"
        }}
        transition={{ duration: state === "LISTENING" ? 1.2 : 2.5, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Outer Rotating Ink Ring (Enso Circle) */}
      <motion.svg
        className="absolute w-full h-full pointer-events-none"
        viewBox="0 0 200 200"
        animate={{
          rotate: state === "EVALUATING" ? 360 : 0,
          scale: state === "LISTENING" ? 1.05 : 1
        }}
        transition={{
          rotate: { duration: 12, repeat: Infinity, ease: "linear" },
          scale: { duration: 0.4 }
        }}
      >
        <circle
          cx="100"
          cy="100"
          r="86"
          fill="none"
          stroke={
            state === "DENIED"
              ? "#f43f5e"
              : state === "APPROVED"
              ? "#eab308"
              : state === "EVALUATING"
              ? "#a855f7"
              : "#71717a"
          }
          strokeWidth="2.5"
          strokeDasharray="480"
          strokeDashoffset={state === "EVALUATING" ? 180 : 40}
          strokeLinecap="round"
          className="opacity-40 transition-colors duration-500"
        />
        {/* Subtle Zen dash marks */}
        <circle
          cx="100"
          cy="100"
          r="92"
          fill="none"
          stroke="#52525b"
          strokeWidth="1"
          strokeDasharray="4 14"
          className="opacity-30"
        />
      </motion.svg>

      {/* Main Character Avatar Container with FSM animations */}
      <motion.div
        className="relative z-10 w-40 h-40 sm:w-44 sm:h-44 rounded-full overflow-hidden border border-zinc-700/60 bg-gradient-to-b from-zinc-900 via-zinc-950 to-black flex items-center justify-center shadow-2xl"
        animate={{
          y: state === "IDLE" ? [0, -4, 0] : state === "LISTENING" ? 4 : state === "APPROVED" ? [0, 6, 0] : 0,
          rotate: state === "DENIED" ? [0, -6, 6, -4, 4, 0] : 0,
          scale: state === "EVALUATING" ? 1.04 : state === "COOLDOWN" ? 0.95 : 1
        }}
        transition={{
          y: { duration: 3.5, repeat: Infinity, ease: "easeInOut" },
          rotate: { duration: 0.6, ease: "easeInOut" },
          scale: { duration: 0.4 }
        }}
      >
        {/* Visual representation of Master Satoshi or Archetype */}
        <svg viewBox="0 0 160 160" className="w-full h-full">
          <defs>
            <linearGradient id="robeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#27272a" />
              <stop offset="100%" stopColor="#09090b" />
            </linearGradient>
            <linearGradient id="auraGold" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#d97706" stopOpacity="0.2" />
            </linearGradient>
            <radialGradient id="glareRed">
              <stop offset="0%" stopColor="#f43f5e" />
              <stop offset="100%" stopColor="#881337" />
            </radialGradient>
          </defs>

          {/* Background Ink Wash */}
          <circle cx="80" cy="80" r="78" fill="#121214" />
          <path
            d="M 20 130 Q 80 100 140 130 L 140 160 L 20 160 Z"
            fill="url(#robeGrad)"
            stroke="#3f3f46"
            strokeWidth="1.2"
          />

          {isSatoshi && (
            <g>
              {/* Monk Cowl / Robe Neck */}
              <path
                d="M 50 120 Q 80 140 110 120 L 115 155 Q 80 162 45 155 Z"
                fill="#18181b"
                stroke="#52525b"
                strokeWidth="1"
              />
              {/* Head / Face */}
              <ellipse cx="80" cy="74" rx="28" ry="32" fill="#2d2d30" stroke="#52525b" strokeWidth="1.2" />

              {/* Shaved Head Silhouette */}
              <path d="M 52 70 C 52 46 108 46 108 70 Z" fill="#242427" />

              {/* Stern Eyebrows */}
              <path
                d={
                  state === "DENIED"
                    ? "M 58 66 L 73 69 M 102 66 L 87 69"
                    : state === "EVALUATING"
                    ? "M 58 68 L 73 64 M 102 68 L 87 64"
                    : "M 58 65 L 72 63 M 102 65 L 88 63"
                }
                stroke="#a1a1aa"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Eyes */}
              {state === "DENIED" || state === "COOLDOWN" ? (
                // Closed/Disappointed eyes
                <g stroke="#71717a" strokeWidth="2" strokeLinecap="round">
                  <path d="M 60 73 Q 66 76 72 73" fill="none" />
                  <path d="M 88 73 Q 94 76 100 73" fill="none" />
                </g>
              ) : state === "EVALUATING" ? (
                // Intense Glare Eyes
                <g>
                  <ellipse cx="66" cy="71" rx="4" ry="2.2" fill="#fbbf24" />
                  <ellipse cx="94" cy="71" rx="4" ry="2.2" fill="#fbbf24" />
                  <circle cx="66" cy="71" r="1.5" fill="#451a03" />
                  <circle cx="94" cy="71" r="1.5" fill="#451a03" />
                </g>
              ) : (
                // Calm, penetrating eyes
                <g stroke="#d4d4d8" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M 61 71 Q 66 69 71 71" fill="none" />
                  <path d="M 89 71 Q 94 69 99 71" fill="none" />
                  <circle cx="66" cy="72" r="1.8" fill="#e4e4e7" />
                  <circle cx="94" cy="72" r="1.8" fill="#e4e4e7" />
                </g>
              )}

              {/* Nose */}
              <path d="M 80 73 L 78 83 L 83 83" fill="none" stroke="#71717a" strokeWidth="1.4" strokeLinecap="round" />

              {/* Stern / Neutral Mouth */}
              <path
                d={
                  state === "DENIED"
                    ? "M 72 94 Q 80 90 88 94"
                    : state === "APPROVED"
                    ? "M 72 92 Q 80 95 88 92"
                    : "M 73 92 L 87 92"
                }
                fill="none"
                stroke="#a1a1aa"
                strokeWidth="1.8"
                strokeLinecap="round"
              />

              {/* Zen Bead Necklace or Seal */}
              <circle cx="80" cy="128" r="5" fill="#ca8a04" stroke="#a16207" strokeWidth="1" />
              <circle cx="71" cy="130" r="4" fill="#a16207" />
              <circle cx="89" cy="130" r="4" fill="#a16207" />
            </g>
          )}

          {isVance && (
            <g>
              {/* Military Beret & Sharp Collar */}
              <path d="M 44 58 Q 80 40 116 54 L 114 66 L 46 66 Z" fill="#14532d" stroke="#166534" strokeWidth="1.5" />
              <circle cx="60" cy="58" r="4" fill="#eab308" />
              <ellipse cx="80" cy="80" rx="26" ry="28" fill="#3f3f46" stroke="#52525b" strokeWidth="1.2" />
              {/* Stern drill instructor jaw */}
              <path d="M 64 88 L 80 98 L 96 88" fill="none" stroke="#71717a" strokeWidth="2" />
              <path d="M 58 72 L 72 70 M 102 72 L 88 70" stroke="#f43f5e" strokeWidth="2.5" />
              <line x1="71" y1="91" x2="89" y2="91" stroke="#e4e4e7" strokeWidth="2.5" strokeLinecap="round" />
            </g>
          )}

          {isMarcus && (
            <g>
              {/* Roman Laurel & Stoic Beard */}
              <ellipse cx="80" cy="76" rx="28" ry="30" fill="#38383a" stroke="#78716c" strokeWidth="1.2" />
              {/* Golden Laurel Wreath */}
              <path d="M 50 62 Q 80 48 110 62" fill="none" stroke="#eab308" strokeWidth="2" strokeDasharray="3 4" />
              {/* Beard */}
              <path d="M 62 82 Q 80 110 98 82 Q 80 94 62 82 Z" fill="#292524" stroke="#44403c" strokeWidth="1.2" />
              <circle cx="68" cy="72" r="2" fill="#f5f5f4" />
              <circle cx="92" cy="72" r="2" fill="#f5f5f4" />
            </g>
          )}

          {isCyber && (
            <g>
              {/* Cybernetic Visor / Zero Trust HUD */}
              <rect x="48" y="55" width="64" height="48" rx="8" fill="#0f172a" stroke="#06b6d4" strokeWidth="1.5" />
              <line x1="52" y1="75" x2="108" y2="75" stroke="#22d3ee" strokeWidth="2" strokeDasharray="6 3" />
              <circle cx="80" cy="75" r="4" fill="#06b6d4" />
              <text x="56" y="94" fill="#67e8f9" fontSize="9" fontFamily="monospace">
                0xZERO_TRUST
              </text>
            </g>
          )}
        </svg>

        {/* Real-time State Badge on Character */}
        <div className="absolute bottom-1 px-2 py-0.5 rounded-full text-[9px] font-mono tracking-wider uppercase border border-zinc-700 bg-black/80">
          <span
            className={
              state === "DENIED"
                ? "text-rose-400 font-bold"
                : state === "APPROVED"
                ? "text-amber-400 font-bold"
                : state === "EVALUATING"
                ? "text-purple-400 animate-pulse"
                : state === "LISTENING"
                ? "text-cyan-400 animate-pulse"
                : "text-zinc-400"
            }
          >
            {state}
          </span>
        </div>
      </motion.div>

      {/* Pulsing Audio Waveform Indicator during LISTENING */}
      {state === "LISTENING" && (
        <div className="absolute -bottom-5 flex items-center gap-1">
          {[12, 24, 18, 28, 14, 22, 10].map((h, i) => (
            <motion.div
              key={i}
              className="w-1 bg-cyan-400 rounded-full"
              animate={{ height: [6, h, 6] }}
              transition={{
                duration: 0.4 + (i % 3) * 0.15,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};
