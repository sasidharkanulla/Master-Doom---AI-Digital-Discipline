import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Clock,
  CheckCircle2,
  X,
  Send,
  Play,
  Pause,
  Search,
  Navigation,
  Mail,
  MessageSquare,
  FileText,
  Music,
  Video,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  ExternalLink
} from "lucide-react";
import { soundEngine } from "../utils/audio";

interface OpenedAppSessionProps {
  appName: string;
  durationSeconds: number;
  taskPrompt: string;
  onComplete: (early: boolean, timeUsedSeconds: number) => void;
  onClose: () => void;
}

export const OpenedAppSession: React.FC<OpenedAppSessionProps> = ({
  appName,
  durationSeconds,
  taskPrompt,
  onComplete,
  onClose
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState(durationSeconds);
  const [isCompleted, setIsCompleted] = useState(false);
  const [earlyCompleted, setEarlyCompleted] = useState(false);

  // App-specific internal state
  // Slack
  const [slackMessages, setSlackMessages] = useState([
    { id: 1, sender: "Sarah (Team Lead)", time: "12:41 PM", text: "Hey! Can you verify if the pull request passed the automated test suite?" },
    { id: 2, sender: "Alex (DevOps)", time: "12:43 PM", text: "Deployment pipeline is standing by. Let us know when you sign off." }
  ]);
  const [slackInput, setSlackInput] = useState("");

  // Gmail
  const [mailReplyText, setMailReplyText] = useState("");
  const [mailSent, setMailSent] = useState(false);

  // YouTube
  const [ytPlaying, setYtPlaying] = useState(false);
  const [ytProgress, setYtProgress] = useState(25);

  // Notes
  const [noteTitle, setNoteTitle] = useState("Meeting & Work Notes");
  const [noteBody, setNoteBody] = useState("- Action item 1: Confirm project timeline\n- Action item 2: Send status report to team\n- Action item 3: Put down phone and focus");
  const [noteSaved, setNoteSaved] = useState(false);

  // Spotify focus audio
  const [musicPlaying, setMusicPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  // Timer countdown
  useEffect(() => {
    if (secondsRemaining <= 0 && !isCompleted) {
      soundEngine.playAuditChime();
      setIsCompleted(true);
      return;
    }

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          soundEngine.playAuditChime();
          setIsCompleted(true);
          return 0;
        }
        if (prev === 30) {
          soundEngine.playAuditChime();
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [secondsRemaining, isCompleted]);

  // Audio synthesizer for Spotify focus beats
  const toggleFocusAudio = () => {
    if (musicPlaying) {
      if (oscRef.current) {
        try {
          oscRef.current.stop();
          oscRef.current.disconnect();
        } catch (_) {}
      }
      setMusicPlaying(false);
    } else {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        audioContextRef.current = ctx;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(216, ctx.currentTime); // 432Hz subharmonic for deep calm
        gain.gain.setValueAtTime(0.04, ctx.currentTime);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();

        oscRef.current = osc;
        gainRef.current = gain;
        setMusicPlaying(true);
      } catch (e) {
        console.warn("Audio synth notice:", e);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (oscRef.current) {
        try {
          oscRef.current.stop();
          oscRef.current.disconnect();
        } catch (_) {}
      }
      if (audioContextRef.current) {
        try {
          audioContextRef.current.close();
        } catch (_) {}
      }
    };
  }, []);

  const handleFinishEarly = () => {
    soundEngine.playApprovedSound();
    setEarlyCompleted(true);
    setIsCompleted(true);
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const normalizedAppName = appName.toLowerCase();
  const isSlack = normalizedAppName.includes("slack") || normalizedAppName.includes("message") || normalizedAppName.includes("discord") || normalizedAppName.includes("whatsapp");
  const isYouTube = normalizedAppName.includes("youtube") || normalizedAppName.includes("video");
  const isGmail = normalizedAppName.includes("gmail") || normalizedAppName.includes("mail") || normalizedAppName.includes("email");
  const isMaps = normalizedAppName.includes("map") || normalizedAppName.includes("navigation") || normalizedAppName.includes("direction");
  const isNotes = normalizedAppName.includes("note") || normalizedAppName.includes("notion");
  const isSpotify = normalizedAppName.includes("spotify") || normalizedAppName.includes("music") || normalizedAppName.includes("sound");

  const timeUsed = durationSeconds - secondsRemaining;

  return (
    <div className="fixed inset-0 z-50 bg-black text-white flex flex-col justify-between overflow-hidden font-sans select-none animate-in fade-in duration-300">
      {/* 1. TOP GUARDIAN BAR: MASTER SATOSHI HUD */}
      <div className="relative z-10 w-full px-4 py-3 bg-black/90 border-b border-white/20 backdrop-blur-md flex items-center justify-between gap-3 shadow-xl">
        {/* Left: Master Satoshi Badge & Task */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-transparent border border-white/40 flex items-center justify-center flex-shrink-0">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[10px] font-mono tracking-wider text-white uppercase font-bold">
              <span>MASTER SATOSHI • OPENED APP</span>
              <span className="text-white/40">•</span>
              <span className="text-white/80">{appName}</span>
            </div>
            <p className="text-xs font-serif text-white/90 truncate max-w-[200px] sm:max-w-md">
              "{taskPrompt || "Purposeful execution session"}"
            </p>
          </div>
        </div>

        {/* Right: Remaining Time & Action */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-right">
            <div className="text-[9px] font-mono text-white/60 uppercase tracking-widest">
              WINDOW REMAINING
            </div>
            <div
              className={`text-base sm:text-xl font-mono font-bold tracking-wider ${
                secondsRemaining <= 30 ? "text-white animate-pulse underline" : "text-white"
              }`}
            >
              {formatTime(secondsRemaining)}
            </div>
          </div>

          <button
            onClick={handleFinishEarly}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-transparent hover:bg-white/10 text-white border border-white/40 hover:border-white text-xs font-mono tracking-wide transition-all shadow-md active:scale-95"
            title="Conclude task and return to Master Satoshi"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-white" />
            <span className="hidden sm:inline">Done Task</span>
            <span className="sm:hidden">Done</span>
          </button>
        </div>
      </div>

      {/* 2. GUARDED APP BODY INTERFACE */}
      <div className="relative flex-1 bg-black flex flex-col overflow-y-auto">
        {/* Anti-Addiction Guard Notice */}
        <div className="w-full bg-transparent px-4 py-1.5 border-b border-white/10 text-[10px] font-mono text-white/60 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3 h-3 text-white" />
            Zero-Trust Sandbox: Distracting feeds, algorithmic recommendations, and infinite scroll blocked.
          </span>
          <span className="hidden md:inline">Duty Mode Active</span>
        </div>

        {/* Content depending on app */}
        <div className="flex-1 p-4 sm:p-6 max-w-4xl w-full mx-auto flex flex-col justify-start">
          {/* SLACK / TEAM MESSAGING */}
          {isSlack && (
            <div className="flex-1 flex flex-col rounded-2xl border border-white/20 bg-transparent overflow-hidden shadow-2xl">
              <div className="px-4 py-3 border-b border-white/20 bg-transparent flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-white" />
                  <span className="font-mono text-xs font-bold text-white">#engineering • Team Sync</span>
                </div>
                <span className="text-[10px] font-mono text-white/60">3 members active</span>
              </div>

              <div className="flex-1 p-4 space-y-3 overflow-y-auto">
                {slackMessages.map((msg) => (
                  <div key={msg.id} className="p-3 rounded-xl bg-transparent border border-white/15 space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-mono text-white/70">
                      <span className="font-bold text-white">{msg.sender}</span>
                      <span>{msg.time}</span>
                    </div>
                    <p className="text-xs sm:text-sm text-white font-sans">{msg.text}</p>
                  </div>
                ))}
              </div>

              <div className="p-3 border-t border-white/20 bg-transparent flex items-center gap-2">
                <input
                  type="text"
                  value={slackInput}
                  onChange={(e) => setSlackInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && slackInput.trim()) {
                      setSlackMessages((prev) => [
                        ...prev,
                        {
                          id: Date.now(),
                          sender: "You (Verified Practitioner)",
                          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                          text: slackInput.trim()
                        }
                      ]);
                      setSlackInput("");
                      soundEngine.playHapticTick();
                    }
                  }}
                  placeholder="Send quick status reply to team..."
                  className="flex-1 bg-transparent px-3 py-2 text-xs text-white placeholder-white/40 border border-white/20 rounded-xl focus:outline-none font-sans"
                />
                <button
                  onClick={() => {
                    if (slackInput.trim()) {
                      setSlackMessages((prev) => [
                        ...prev,
                        {
                          id: Date.now(),
                          sender: "You (Verified Practitioner)",
                          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                          text: slackInput.trim()
                        }
                      ]);
                      setSlackInput("");
                      soundEngine.playHapticTick();
                    }
                  }}
                  className="px-3 py-2 rounded-xl bg-transparent hover:bg-white/10 text-white border border-white/40 font-mono text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Send className="w-3.5 h-3.5 text-white" />
                  <span>Send</span>
                </button>
              </div>
            </div>
          )}

          {/* YOUTUBE / VIDEO TUTORIAL */}
          {isYouTube && (
            <div className="flex-1 flex flex-col rounded-2xl border border-white/20 bg-transparent overflow-hidden shadow-2xl space-y-4">
              <div className="relative aspect-video w-full bg-black border-b border-white/20 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 rounded-full border border-white/40 bg-transparent flex items-center justify-center mb-3">
                  <Play className="w-7 h-7 text-white translate-x-0.5" />
                </div>
                <h4 className="text-sm sm:text-base font-serif font-bold text-white max-w-md">
                  {taskPrompt || "Architectural Patterns & Deep Focus Study Session"}
                </h4>
                <p className="text-[11px] font-mono text-white/60 mt-1">
                  Verified Educational Content • Algorithmic recommendations removed
                </p>

                {/* Progress bar */}
                <div className="w-full max-w-md mt-4 flex items-center gap-3">
                  <span className="text-[10px] font-mono text-white/70">04:15</span>
                  <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-white w-1/3 rounded-full" />
                  </div>
                  <span className="text-[10px] font-mono text-white/70">12:30</span>
                </div>
              </div>

              <div className="p-4 space-y-2">
                <div className="text-xs font-mono uppercase tracking-wider text-white/70">
                  Approved Educational Queue
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="p-3 rounded-xl border border-white/15 bg-transparent hover:bg-white/5 transition-colors cursor-pointer">
                    <div className="text-xs font-bold text-white">Lesson 1: System Design Principles</div>
                    <div className="text-[10px] font-mono text-white/60 mt-0.5">14m • Clean Architecture</div>
                  </div>
                  <div className="p-3 rounded-xl border border-white/15 bg-transparent hover:bg-white/5 transition-colors cursor-pointer">
                    <div className="text-xs font-bold text-white">Lesson 2: Stoic Focus in the Modern World</div>
                    <div className="text-[10px] font-mono text-white/60 mt-0.5">18m • Cal Newport & Epictetus</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* GMAIL / EMAIL */}
          {isGmail && (
            <div className="flex-1 flex flex-col rounded-2xl border border-white/20 bg-transparent overflow-hidden shadow-2xl">
              <div className="px-4 py-3 border-b border-white/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-white" />
                  <span className="font-mono text-xs font-bold text-white">Inbox • Task Focused View</span>
                </div>
                <span className="text-[10px] font-mono text-white/60">Filtered by Master Satoshi</span>
              </div>

              <div className="p-4 space-y-4 flex-1 overflow-y-auto">
                <div className="p-4 rounded-xl border border-white/20 bg-transparent space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono text-white/80">
                    <span className="font-bold text-white">From: Project Lead & Client</span>
                    <span>Today 11:20 AM</span>
                  </div>
                  <div className="text-xs font-bold text-white">Subject: Confirmation needed for upcoming deployment schedule</div>
                  <p className="text-xs text-white/90 leading-relaxed font-sans pt-1">
                    "Please confirm if the testing environment is prepared and whether the final release can be pushed this afternoon. Let us know as soon as you have checked."
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-mono text-white/70">Your Response:</div>
                  <textarea
                    rows={4}
                    value={mailReplyText}
                    onChange={(e) => setMailReplyText(e.target.value)}
                    placeholder="Type your brief, professional response..."
                    className="w-full bg-transparent p-3 text-xs text-white placeholder-white/40 border border-white/20 rounded-xl focus:outline-none font-sans"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-white/50">
                      {mailSent ? "✓ Response sent. Ready to exit." : "Keep it concise and clear."}
                    </span>
                    <button
                      onClick={() => {
                        if (mailReplyText.trim()) {
                          setMailSent(true);
                          soundEngine.playApprovedSound();
                        }
                      }}
                      className="px-4 py-1.5 rounded-xl bg-transparent hover:bg-white/10 text-white border border-white/40 font-mono text-xs flex items-center gap-1.5"
                    >
                      <Send className="w-3 h-3 text-white" />
                      <span>{mailSent ? "Sent!" : "Send Email"}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* GOOGLE MAPS */}
          {isMaps && (
            <div className="flex-1 flex flex-col rounded-2xl border border-white/20 bg-transparent overflow-hidden shadow-2xl">
              <div className="px-4 py-3 border-b border-white/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-white" />
                  <span className="font-mono text-xs font-bold text-white">Google Maps • Verified Navigation</span>
                </div>
                <span className="text-[10px] font-mono text-white/60">GPS Active</span>
              </div>

              <div className="p-4 space-y-4 flex-1">
                <div className="p-4 rounded-xl border border-white/20 bg-transparent space-y-2">
                  <div className="text-xs font-mono text-white/70 uppercase">Target Destination</div>
                  <div className="text-sm font-bold text-white">City Professional Center, Suite 400</div>
                  <div className="text-xs font-mono text-white/80">ETA: 14 min (5.2 mi) • Fastest route with current traffic</div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-mono text-white/70">Turn-by-turn guidance:</div>
                  <div className="space-y-1.5 font-mono text-xs text-white/90">
                    <div className="p-2.5 rounded-lg border border-white/10 bg-transparent flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full border border-white/30 flex items-center justify-center text-[10px]">1</span>
                      <span>Head north on Market St toward 4th Ave (0.4 mi)</span>
                    </div>
                    <div className="p-2.5 rounded-lg border border-white/10 bg-transparent flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full border border-white/30 flex items-center justify-center text-[10px]">2</span>
                      <span>Turn right onto Interstate 80 East (3.8 mi)</span>
                    </div>
                    <div className="p-2.5 rounded-lg border border-white/10 bg-transparent flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full border border-white/30 flex items-center justify-center text-[10px]">3</span>
                      <span>Take exit 12 toward Downtown Center (0.3 mi)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* NOTES / NOTION */}
          {isNotes && (
            <div className="flex-1 flex flex-col rounded-2xl border border-white/20 bg-transparent overflow-hidden shadow-2xl p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-white/20">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-white" />
                  <input
                    type="text"
                    value={noteTitle}
                    onChange={(e) => setNoteTitle(e.target.value)}
                    className="bg-transparent font-serif font-bold text-sm text-white focus:outline-none"
                  />
                </div>
                <span className="text-[10px] font-mono text-white/60">
                  {noteSaved ? "Saved ✓" : "Auto-saving"}
                </span>
              </div>

              <textarea
                value={noteBody}
                onChange={(e) => {
                  setNoteBody(e.target.value);
                  setNoteSaved(true);
                }}
                rows={10}
                className="w-full flex-1 bg-transparent p-2 text-xs sm:text-sm font-mono text-white placeholder-white/40 focus:outline-none resize-none leading-relaxed"
                placeholder="Jot down your notes, ideas, or task checklist..."
              />
            </div>
          )}

          {/* SPOTIFY / FOCUS SOUNDS */}
          {isSpotify && (
            <div className="flex-1 flex flex-col rounded-2xl border border-white/20 bg-transparent overflow-hidden shadow-2xl p-6 text-center items-center justify-center space-y-4">
              <div
                className={`w-24 h-24 rounded-full border-2 border-white flex items-center justify-center transition-transform ${
                  musicPlaying ? "animate-spin [animation-duration:8s]" : ""
                }`}
              >
                <Music className="w-10 h-10 text-white" />
              </div>

              <div>
                <h4 className="text-base font-serif font-bold text-white">432Hz Binaural Focus Waves</h4>
                <p className="text-xs font-mono text-white/60 mt-1">
                  Ambient concentration frequency for deep work and urge dissolution
                </p>
              </div>

              <button
                onClick={toggleFocusAudio}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-transparent hover:bg-white/10 text-white border border-white text-xs font-mono tracking-wide transition-all shadow-md active:scale-95"
              >
                {musicPlaying ? (
                  <>
                    <Pause className="w-4 h-4 text-white" />
                    <span>Pause Audio</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 text-white" />
                    <span>Play Ambient Waves</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* GENERIC / CUSTOM APP */}
          {!isSlack && !isYouTube && !isGmail && !isMaps && !isNotes && !isSpotify && (
            <div className="flex-1 flex flex-col rounded-2xl border border-white/20 bg-transparent overflow-hidden shadow-2xl p-6 text-center justify-between">
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-2xl border border-white/30 bg-transparent mx-auto flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-serif font-bold text-white">{appName}</h3>
                <p className="text-xs font-mono text-white/70 max-w-md mx-auto">
                  Guarded execution window granted by Master Satoshi. Execute your intended task and return to stillness.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-white/20 bg-transparent text-left max-w-md mx-auto w-full space-y-2">
                <div className="text-[10px] font-mono uppercase tracking-wider text-white/60">
                  Approved Purpose:
                </div>
                <p className="text-xs font-serif text-white italic">
                  "{taskPrompt || "Verified task"}"
                </p>
              </div>

              <div className="pt-4">
                <button
                  onClick={handleFinishEarly}
                  className="px-6 py-2.5 rounded-xl bg-transparent hover:bg-white/10 text-white border border-white text-xs font-mono font-bold tracking-wide transition-all shadow-md"
                >
                  Confirm Task Done & Return to Master
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. COMPLETION / INTEGRITY AUDIT OVERLAY */}
      <AnimatePresence>
        {isCompleted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 text-center select-none"
          >
            <div className="max-w-md w-full rounded-2xl border border-white/30 p-6 sm:p-8 space-y-5 bg-transparent shadow-2xl">
              <div className="w-14 h-14 rounded-full border border-white bg-transparent mx-auto flex items-center justify-center text-white">
                <CheckCircle2 className="w-7 h-7 text-white" />
              </div>

              <div className="space-y-1">
                <div className="text-[10px] font-mono uppercase tracking-widest text-white/60">
                  SESSION CONCLUDED • DISCIPLINE HONORED
                </div>
                <h3 className="text-xl font-serif font-bold text-white">
                  Duty Accomplished
                </h3>
                <p className="text-xs font-serif text-white/80 max-w-xs mx-auto pt-1 leading-relaxed">
                  "You came to {appName} with a conscious purpose, executed without getting pulled into the digital swamp, and stepped away. That is true self-mastery."
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-white/20 bg-transparent flex items-center justify-between text-xs font-mono text-white">
                <div>
                  <span className="text-white/60">Time Used: </span>
                  <span className="font-bold text-white">{formatTime(timeUsed)}</span>
                </div>
                <div>
                  <span className="text-white/60">Score Gain: </span>
                  <span className="font-bold text-white">+2 Stoic Pts</span>
                </div>
              </div>

              <button
                onClick={() => onComplete(earlyCompleted, timeUsed)}
                className="w-full py-3 rounded-xl bg-transparent hover:bg-white/10 text-white border border-white font-mono text-xs font-bold tracking-wider uppercase transition-all shadow-lg active:scale-95"
              >
                Return to Master Satoshi
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
