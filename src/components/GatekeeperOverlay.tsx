import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Mic,
  MicOff,
  Send,
  ShieldAlert,
  Volume2,
  VolumeX,
  X,
  Clock,
  CheckCircle2,
  Lock,
  Sparkles,
  RefreshCw,
  Maximize2
} from "lucide-react";
import { FSMState, RestrictedApp, CharacterProfile, ChatMessage } from "../types";
import { soundEngine } from "../utils/audio";
import { MasterSatoshiVisual } from "./MasterSatoshiVisual";
import { AppIcon } from "./AppIcon";

interface GatekeeperOverlayProps {
  app: RestrictedApp;
  character: CharacterProfile;
  secondsSinceLastSession: number;
  relapseCount15m: number;
  denialCount1h: number;
  onApprove: (durationSeconds: number, userPrompt: string, rationale: string) => void;
  onDeny: (cooldownSeconds: number, userPrompt: string, rationale: string) => void;
  onDismiss: () => void;
  onOpenChatNegotiation?: () => void;
}

export const GatekeeperOverlay: React.FC<GatekeeperOverlayProps> = ({
  app,
  character,
  secondsSinceLastSession,
  relapseCount15m,
  denialCount1h,
  onApprove,
  onDeny,
  onDismiss,
  onOpenChatNegotiation
}) => {
  const [fsmState, setFsmState] = useState<FSMState>("IDLE");
  const [inputText, setInputText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(soundEngine.getMuted());
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);

  // Negotiation state
  const [decisionState, setDecisionState] = useState<{
    decision: "APPROVED" | "DENIED" | null;
    duration: number;
    cooldown: number;
    userPrompt: string;
    rationale: string;
  }>({
    decision: null,
    duration: 0,
    cooldown: 0,
    userPrompt: "",
    rationale: ""
  });

  // Helper for dynamic contextual greetings
  const getInitialGatekeeperGreeting = () => {
    if (character.character_id === "satoshi") {
      const hour = new Date().getHours();
      const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      if (hour >= 23 || hour < 5) {
        return `It is ${timeStr}. Why are you begging for "${app.app_name}" in the dark? State your excuse.`;
      } else if (hour >= 5 && hour < 9) {
        return `It is ${timeStr}. Already craving "${app.app_name}"? State your business.`;
      } else if (hour >= 9 && hour < 17) {
        return `It is ${timeStr}, peak working hours. Why are you slacking on "${app.app_name}"?`;
      } else {
        return `It is ${timeStr}. What real purpose do you have with "${app.app_name}"?`;
      }
    }
    return `Access to ${app.app_name} requested. State your purpose and minutes.`;
  };

  // Conversation history
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: "msg_init",
      role: "assistant",
      content: getInitialGatekeeperGreeting(),
      timestamp: Date.now()
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const hapticIntervalRef = useRef<any>(null);

  // Start ambient hum on mount & speak initial greeting
  useEffect(() => {
    soundEngine.startAmbientHum();
    const initialGreeting = getInitialGatekeeperGreeting();
    soundEngine.speakDialogue(initialGreeting, character.character_id);

    return () => {
      soundEngine.stopContinuousSounds();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
      if (hapticIntervalRef.current) {
        clearInterval(hapticIntervalRef.current);
      }
    };
  }, [app.app_name, character.character_id]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isEvaluating]);

  // Cooldown countdown timer effect
  useEffect(() => {
    let timer: any;
    if (cooldownRemaining > 0) {
      timer = setInterval(() => {
        setCooldownRemaining(prev => {
          if (prev <= 1) {
            setFsmState("IDLE");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldownRemaining]);

  // Speech Recognition (Web Speech API)
  const toggleSpeechRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechError("Speech recognition not supported in this browser. Please type your message.");
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setIsListening(false);
      setFsmState("IDLE");
      if (hapticIntervalRef.current) {
        clearInterval(hapticIntervalRef.current);
      }
    } else {
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = "en-US";
        recognition.continuous = false;
        recognition.interimResults = true;

        recognition.onstart = () => {
          setIsListening(true);
          setFsmState("LISTENING");
          setSpeechError(null);
          hapticIntervalRef.current = setInterval(() => {
            soundEngine.playHapticTick();
          }, 350);
        };

        recognition.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result: any) => result[0].transcript)
            .join("");
          setInputText(transcript);
        };

        recognition.onerror = (err: any) => {
          console.warn("Speech recognition error:", err);
          setIsListening(false);
          setFsmState("IDLE");
          if (hapticIntervalRef.current) {
            clearInterval(hapticIntervalRef.current);
          }
        };

        recognition.onend = () => {
          setIsListening(false);
          if (hapticIntervalRef.current) {
            clearInterval(hapticIntervalRef.current);
          }
          // If we captured voice text, submit it immediately to the bot
          if (inputText.trim().length > 0) {
            handleSendMessage(inputText);
          } else {
            setFsmState("IDLE");
          }
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (err: any) {
        setSpeechError("Could not start microphone: " + (err.message || "Permission issue"));
        setIsListening(false);
        setFsmState("IDLE");
      }
    }
  };

  // Send message to Gemini negotiation backend
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isEvaluating) return;

    soundEngine.playHapticTick();
    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}_u`,
      role: "user",
      content: text,
      timestamp: Date.now()
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputText("");
    setIsEvaluating(true);
    setFsmState("EVALUATING");
    soundEngine.stopAmbientHum();
    soundEngine.startEvaluatingLoop();

    try {
      const res = await fetch("/api/bargain/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          package_name: app.package_name,
          app_name: app.app_name,
          character_id: character.character_id,
          messages: newHistory.map(m => ({ role: m.role, content: m.content })),
          client_hour: new Date().getHours(),
          client_time_str: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        })
      });

      soundEngine.stopEvaluatingLoop();

      const data = await res.json();
      const assistantReply =
        data.reply ||
        "I have scrutinized your words. Let your actions match your stated discipline.";

      const aiMsg: ChatMessage = {
        id: `msg_${Date.now()}_a`,
        role: "assistant",
        content: assistantReply,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, aiMsg]);
      soundEngine.speakDialogue(assistantReply, character.character_id);

      if (data.decision === "APPROVED") {
        setFsmState("APPROVED");
        soundEngine.playApprovedChime();
        const grantedSecs = data.granted_duration_seconds || 180;
        setDecisionState({
          decision: "APPROVED",
          duration: grantedSecs,
          cooldown: 0,
          userPrompt: text,
          rationale: assistantReply
        });
      } else if (data.decision === "DENIED") {
        setFsmState("DENIED");
        soundEngine.playDeniedBurst();
        const cooldownSecs = data.cooldown_seconds || 900;
        setCooldownRemaining(cooldownSecs);
        setDecisionState({
          decision: "DENIED",
          duration: 0,
          cooldown: cooldownSecs,
          userPrompt: text,
          rationale: assistantReply
        });
        onDeny(cooldownSecs, text, assistantReply);
        setTimeout(() => {
          setFsmState("COOLDOWN");
          soundEngine.playLockSound();
        }, 1500);
      } else {
        setFsmState("IDLE");
      }
    } catch (err) {
      soundEngine.stopEvaluatingLoop();
      console.error("Negotiation error:", err);
      const fallbackReply =
        character.character_id === "satoshi"
          ? "State your essential duty in 3 minutes, or step away."
          : "State your task in 3 minutes, or step away.";
      setMessages(prev => [
        ...prev,
        {
          id: `msg_${Date.now()}_a`,
          role: "assistant",
          content: fallbackReply,
          timestamp: Date.now()
        }
      ]);
      soundEngine.speakDialogue(fallbackReply, character.character_id);
      setFsmState("IDLE");
    } finally {
      setIsEvaluating(false);
    }
  };

  // Launch the app when the user taps the App Icon
  const handleOpenAppForSession = () => {
    onApprove(
      decisionState.duration || 180,
      decisionState.userPrompt || "Task completed via negotiation",
      decisionState.rationale || "Approved by Gatekeeper"
    );
  };

  const handleMuteToggle = () => {
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <motion.div
      id="gatekeeper-interceptor-overlay"
      className="absolute inset-0 z-50 bg-zinc-950/98 backdrop-blur-2xl text-zinc-100 flex flex-col justify-between overflow-hidden"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      {/* Top Header: OS Interception Status */}
      <div className="pt-8 px-4 pb-2.5 flex items-center justify-between border-b border-zinc-800/80 bg-zinc-950/95 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              fsmState === "APPROVED"
                ? "bg-emerald-400 animate-pulse"
                : fsmState === "DENIED" || fsmState === "COOLDOWN"
                ? "bg-rose-500"
                : "bg-rose-500 animate-ping"
            }`}
          />
          <div className="flex flex-col">
            <span className="text-[9px] font-mono tracking-widest text-zinc-400 uppercase">
              INTERCEPTOR (TYPE_APPLICATION_OVERLAY)
            </span>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-200">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>NEGOTIATING: {app.app_name}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {onOpenChatNegotiation && (
            <button
              onClick={onOpenChatNegotiation}
              className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-amber-400 transition-colors"
              title="Open Expanded Chat Modal"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={handleMuteToggle}
            className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
            title={isMuted ? "Unmute sound" : "Mute sound"}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onDismiss}
            className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-rose-400 transition-colors"
            title="Dismiss & Return to Launcher"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Gatekeeper Character Visual & Archetype Header Strip */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-900 bg-zinc-900/40 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl overflow-hidden border border-zinc-800 flex items-center justify-center bg-zinc-950">
            <MasterSatoshiVisual state={fsmState} characterId={character.character_id} isListening={isListening} />
          </div>
          <div>
            <div className="text-xs font-serif font-bold text-zinc-100 flex items-center gap-1.5">
              <span>{character.display_name}</span>
              <span className="text-[9px] font-mono text-amber-400/90 font-normal px-1.5 py-0.2 rounded bg-amber-500/10 border border-amber-500/20">
                {character.character_id === "satoshi" ? "Deep & Slow Voice" : character.archetype}
              </span>
            </div>
            <div className="text-[10px] font-mono text-zinc-400">
              {fsmState === "LISTENING"
                ? "🎙️ Listening to voice speech..."
                : fsmState === "EVALUATING"
                ? "🧠 Scrutinizing intent against Zero-Trust..."
                : fsmState === "APPROVED"
                ? "✨ Access Granted • Ready to Launch"
                : fsmState === "COOLDOWN"
                ? "🔒 System Lockout Enforced"
                : "Active AI Voice & Text Channel"}
            </div>
          </div>
        </div>

        {/* Status Pill */}
        <div className="text-right">
          {fsmState === "APPROVED" ? (
            <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/70 border border-emerald-800 px-2 py-0.5 rounded-full">
              APPROVED
            </span>
          ) : fsmState === "COOLDOWN" ? (
            <span className="text-[10px] font-mono font-bold text-rose-400 bg-rose-950/70 border border-rose-800 px-2 py-0.5 rounded-full">
              LOCKED {formatSeconds(cooldownRemaining)}
            </span>
          ) : (
            <span className="text-[10px] font-mono text-zinc-500">
              STRIKES: {denialCount1h}/3
            </span>
          )}
        </div>
      </div>

      {/* Main Conversation Stream */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
        {messages.map(msg => {
          const isUser = msg.role === "user";
          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}
            >
              {!isUser && (
                <button
                  type="button"
                  onClick={() => soundEngine.speakDialogue(msg.content, character.character_id)}
                  title="Replay in Master's deep voice"
                  className="w-6 h-6 rounded-full bg-zinc-900 border border-zinc-700 hover:border-amber-500/60 hover:text-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5 text-zinc-400 transition-colors group"
                >
                  <Volume2 className="w-3 h-3 group-hover:scale-110 transition-transform" />
                </button>
              )}

              <div
                className={`max-w-[84%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                  isUser
                    ? "bg-amber-500 text-zinc-950 font-medium rounded-br-none shadow-md shadow-amber-500/10"
                    : "bg-zinc-900/90 border border-zinc-800 text-zinc-200 rounded-bl-none shadow-sm"
                }`}
              >
                <p>{msg.content}</p>
                <div
                  className={`text-[8px] font-mono mt-1 text-right ${
                    isUser ? "text-zinc-800/80" : "text-zinc-500"
                  }`}
                >
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </div>
              </div>
            </motion.div>
          );
        })}

        {/* Evaluating Indicator */}
        {isEvaluating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-amber-400 text-xs font-mono p-2 rounded-xl bg-zinc-900/50 border border-zinc-800/50 w-fit"
          >
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
            <span>{character.display_name} is evaluating your discipline...</span>
          </motion.div>
        )}

        {/* WHEN NEGOTIATION SUCCEEDED: Prominently show App Icon & Open Button */}
        {decisionState.decision === "APPROVED" && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", damping: 20 }}
            className="my-3 p-4 rounded-2xl bg-zinc-900/95 border-2 border-emerald-500/80 shadow-2xl shadow-emerald-500/20 text-center space-y-3"
          >
            <div className="flex items-center justify-center gap-1.5 text-emerald-400 font-mono text-[11px] font-bold uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>NEGOTIATION SUCCEEDED • ACCESS UNLOCKED</span>
            </div>

            {/* Target App Icon with Glowing Halo */}
            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={handleOpenAppForSession}
                className="relative group cursor-pointer active:scale-95 transition-transform"
                title={`Tap to open ${app.app_name}`}
              >
                <div
                  className={`w-20 h-20 rounded-3xl bg-gradient-to-tr ${
                    app.color || "from-amber-500 to-amber-600"
                  } p-0.5 shadow-xl shadow-emerald-500/30 flex items-center justify-center relative group-hover:scale-105 transition-transform`}
                >
                  <div className="w-full h-full rounded-[22px] bg-zinc-950/40 backdrop-blur-sm flex items-center justify-center text-white">
                    <AppIcon iconName={app.icon_name} className="w-10 h-10" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-emerald-500 text-zinc-950 text-[10px] font-mono font-black uppercase shadow">
                    OPEN
                  </div>
                </div>
              </button>

              <div className="text-base font-bold text-zinc-100 mt-2">{app.app_name}</div>
              <div className="text-xs font-mono text-emerald-400 font-bold mt-0.5">
                Allotted Time: {formatSeconds(decisionState.duration)} ({decisionState.duration}s)
              </div>
              <div className="text-[10px] text-zinc-400 mt-1 max-w-[240px] mx-auto line-clamp-2 italic">
                "{decisionState.rationale}"
              </div>
            </div>

            {/* Tap to Open App Button */}
            <button
              type="button"
              onClick={handleOpenAppForSession}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-zinc-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 transition-all active:scale-98 animate-pulse"
            >
              <Clock className="w-4 h-4" />
              <span>Open {app.app_name} Now ({formatSeconds(decisionState.duration)})</span>
            </button>
          </motion.div>
        )}

        {/* Lockout Screen on Denial */}
        {fsmState === "COOLDOWN" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4 rounded-2xl bg-rose-950/60 border border-rose-800 text-center space-y-2"
          >
            <div className="w-10 h-10 rounded-full bg-rose-900/60 border border-rose-700 flex items-center justify-center mx-auto text-rose-300">
              <Lock className="w-5 h-5" />
            </div>
            <div className="text-xs font-bold text-rose-200 uppercase font-mono">
              SYSTEM LOCKOUT ACTIVE
            </div>
            <div className="text-2xl font-mono font-bold text-zinc-100">
              {formatSeconds(cooldownRemaining)}
            </div>
            <p className="text-[11px] text-zinc-400 leading-snug">
              Access denied. Practice mindfulness in stillness before seeking re-evaluation.
            </p>
            <button
              type="button"
              onClick={onDismiss}
              className="w-full py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-mono hover:bg-zinc-800 transition-colors"
            >
              Return to Launcher
            </button>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Test Scenarios Chips */}
      {fsmState !== "COOLDOWN" && fsmState !== "APPROVED" && (
        <div className="px-3 py-1 bg-zinc-950 border-t border-zinc-900 flex-shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar text-[10px]">
            <span className="text-[9px] font-mono text-zinc-500 uppercase flex-shrink-0">
              Quick:
            </span>
            <button
              type="button"
              onClick={() => handleSendMessage("Need 3 mins to check urgent client confirmation DM")}
              className="px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-emerald-300 hover:bg-zinc-800 flex-shrink-0 whitespace-nowrap transition-colors"
            >
              Client DM (3m)
            </button>
            <button
              type="button"
              onClick={() => handleSendMessage("Master, I'm stressed and struggling with focus. Be honest with me.")}
              className="px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-sky-300 hover:bg-zinc-800 flex-shrink-0 whitespace-nowrap transition-colors"
            >
              Struggling (Kindness)
            </button>
            <button
              type="button"
              onClick={() => handleSendMessage("Need 2 mins to verify urgent bank 2FA code")}
              className="px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-amber-300 hover:bg-zinc-800 flex-shrink-0 whitespace-nowrap transition-colors"
            >
              Bank 2FA (2m)
            </button>
            <button
              type="button"
              onClick={() => handleSendMessage("I'm bored and just want to scroll for 10 mins")}
              className="px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-rose-300 hover:bg-zinc-800 flex-shrink-0 whitespace-nowrap transition-colors"
            >
              Test Denial ("bored")
            </button>
          </div>
        </div>
      )}

      {/* Input & Voice Controls Section (Text or Talk with Bot) */}
      <div className="p-3 border-t border-zinc-800/80 bg-zinc-950/95 flex-shrink-0">
        {speechError && (
          <p className="text-[10px] text-rose-400 text-center mb-1.5 font-mono">
            {speechError}
          </p>
        )}

        {fsmState === "COOLDOWN" ? (
          <button
            type="button"
            onClick={onDismiss}
            className="w-full py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs font-semibold tracking-wider uppercase hover:bg-zinc-800 transition-all flex items-center justify-center gap-2"
          >
            <Lock className="w-4 h-4 text-rose-400" />
            Accept Cooldown & Return to Launcher
          </button>
        ) : decisionState.decision === "APPROVED" ? (
          <button
            type="button"
            onClick={handleOpenAppForSession}
            className="w-full py-2.5 rounded-xl bg-emerald-500 text-zinc-950 font-bold text-xs uppercase tracking-wider hover:bg-emerald-400 shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
          >
            <Clock className="w-4 h-4" />
            Launch {app.app_name} for {formatSeconds(decisionState.duration)}
          </button>
        ) : (
          <div className="flex items-center gap-2">
            {/* Talk Button (Microphone dictation) */}
            <button
              type="button"
              onClick={toggleSpeechRecognition}
              disabled={isEvaluating || fsmState === "APPROVED"}
              className={`p-2.5 rounded-xl border flex items-center justify-center transition-all ${
                isListening
                  ? "bg-cyan-500 text-zinc-950 border-cyan-400 shadow-lg shadow-cyan-500/20 animate-pulse"
                  : "bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700 hover:text-zinc-100"
              }`}
              title={isListening ? "Stop listening" : "Talk with Gatekeeper via voice"}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* Text Input */}
            <input
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && inputText.trim()) {
                  handleSendMessage();
                }
              }}
              disabled={isEvaluating || fsmState === "APPROVED"}
              placeholder="Text or talk with Gatekeeper..."
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-amber-500/80 transition-colors font-sans"
            />

            {/* Send Button */}
            <button
              type="button"
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim() || isEvaluating || fsmState === "APPROVED"}
              className={`p-2.5 rounded-xl border transition-all ${
                inputText.trim() && !isEvaluating
                  ? "bg-amber-500 text-zinc-950 border-amber-400 font-semibold shadow-md shadow-amber-500/20"
                  : "bg-zinc-900 text-zinc-600 border-zinc-800 cursor-not-allowed"
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Telemetry footer */}
        <div className="mt-2 flex items-center justify-between text-[9px] font-mono text-zinc-500">
          <span>15m Relapses: {relapseCount15m}</span>
          <span>1h Denials: {denialCount1h}/3 strikes</span>
          <span>Last session: {Math.round(secondsSinceLastSession / 60)}m ago</span>
        </div>
      </div>
    </motion.div>
  );
};
