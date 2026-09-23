import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  MessageSquare,
  Send,
  X,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Mic,
  MicOff,
  RotateCcw,
  CheckCircle2,
  Lock,
  ChevronDown,
  Volume2
} from "lucide-react";
import { RestrictedApp, CharacterProfile } from "../types";
import { MasterSatoshiVisual } from "./MasterSatoshiVisual";
import { soundEngine } from "../utils/audio";
import { AppIcon } from "./AppIcon";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

interface NegotiationChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  restrictedApps: RestrictedApp[];
  activeCharacter: CharacterProfile;
  onApproveAndLaunch: (app: RestrictedApp, durationSeconds: number, reason: string) => void;
  onApplyCooldown: (app: RestrictedApp, cooldownSeconds: number) => void;
  initialApp?: RestrictedApp | null;
}

export const NegotiationChatModal: React.FC<NegotiationChatModalProps> = ({
  isOpen,
  onClose,
  restrictedApps,
  activeCharacter,
  onApproveAndLaunch,
  onApplyCooldown,
  initialApp
}) => {
  const [selectedApp, setSelectedApp] = useState<RestrictedApp>(() => {
    return initialApp || restrictedApps[0];
  });
  const [customAppName, setCustomAppName] = useState<string>("");
  const [isCustomApp, setIsCustomApp] = useState<boolean>(false);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [decisionState, setDecisionState] = useState<{
    decision: "APPROVED" | "DENIED" | null;
    duration: number;
    cooldown: number;
    reason: string;
  }>({
    decision: null,
    duration: 0,
    cooldown: 0,
    reason: ""
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Derive character greeting based on time of day and character archetype
  const getInitialGreeting = (targetName: string) => {
    if (activeCharacter.character_id === "satoshi") {
      const hour = new Date().getHours();
      const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      if (hour >= 23 || hour < 5) {
        return `It is ${timeStr}. Why are you begging for "${targetName}" in the dark? State your excuse.`;
      } else if (hour >= 5 && hour < 9) {
        return `It is ${timeStr}. Already itching for "${targetName}"? State your business.`;
      } else if (hour >= 9 && hour < 17) {
        return `It is ${timeStr}, peak working hours. Why are you slacking on "${targetName}"?`;
      } else {
        return `It is ${timeStr}. What concrete purpose do you have with "${targetName}"?`;
      }
    }
    return `Negotiating access to "${targetName}". State your purpose and minutes.`;
  };

  // Initialize or reset conversation when modal opens or target app changes
  useEffect(() => {
    if (isOpen) {
      const targetName = isCustomApp && customAppName.trim() ? customAppName.trim() : selectedApp.app_name;
      const greeting = getInitialGreeting(targetName);
      
      setMessages([
        {
          id: "msg_init",
          role: "assistant",
          content: greeting,
          timestamp: Date.now()
        }
      ]);
      setDecisionState({ decision: null, duration: 0, cooldown: 0, reason: "" });
      soundEngine.speakDialogue(greeting, activeCharacter.character_id);
    } else {
      soundEngine.stopDialogue();
    }
    return () => {
      soundEngine.stopDialogue();
    };
  }, [isOpen, selectedApp, isCustomApp, customAppName, activeCharacter]);

  // Scroll to bottom on message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isEvaluating]);

  // Setup Web Speech recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = "en-US";

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInputText(transcript);
          setIsListening(false);
        };

        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const toggleMic = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const handleSendMessage = async () => {
    const text = inputText.trim();
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

    const targetApp: RestrictedApp = isCustomApp
      ? {
          package_name: `com.custom.${customAppName.toLowerCase().replace(/\s+/g, "") || "generic"}`,
          app_name: customAppName.trim() || "Target Application",
          icon_name: "Sparkles",
          category: "Entertainment",
          color: "from-zinc-700 to-zinc-600",
          is_blocked: true,
          custom_cooldown_minutes: 15,
          created_at: Date.now()
        }
      : selectedApp;

    try {
      const res = await fetch("/api/bargain/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          package_name: targetApp.package_name,
          app_name: targetApp.app_name,
          character_id: activeCharacter.character_id,
          messages: newHistory.map(m => ({ role: m.role, content: m.content })),
          client_hour: new Date().getHours(),
          client_time_str: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        })
      });

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
      soundEngine.speakDialogue(assistantReply, activeCharacter.character_id);

      if (data.decision === "APPROVED") {
        soundEngine.playApprovedChime();
        setDecisionState({
          decision: "APPROVED",
          duration: data.granted_duration_seconds || 180,
          cooldown: 0,
          reason: userMsg.content
        });
      } else if (data.decision === "DENIED") {
        soundEngine.playDeniedBurst();
        setDecisionState({
          decision: "DENIED",
          duration: 0,
          cooldown: data.cooldown_seconds || 900,
          reason: userMsg.content
        });
        onApplyCooldown(targetApp, data.cooldown_seconds || 900);
      }
    } catch (err) {
      console.error("Chat error:", err);
      const fallbackReply =
        activeCharacter.character_id === "satoshi"
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
      soundEngine.speakDialogue(fallbackReply, activeCharacter.character_id);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleLaunchUnlocked = () => {
    const targetApp: RestrictedApp = isCustomApp
      ? {
          package_name: `com.custom.${customAppName.toLowerCase().replace(/\s+/g, "") || "generic"}`,
          app_name: customAppName.trim() || "Target Application",
          icon_name: "Sparkles",
          category: "Entertainment",
          color: "from-zinc-700 to-zinc-600",
          is_blocked: true,
          custom_cooldown_minutes: 15,
          created_at: Date.now()
        }
      : selectedApp;

    onApproveAndLaunch(targetApp, decisionState.duration, decisionState.reason);
    onClose();
  };

  const resetChat = () => {
    const targetName = isCustomApp && customAppName.trim() ? customAppName.trim() : selectedApp.app_name;
    const greeting = `Channel reset. Present your argument to unlock "${targetName}" with clarity and zero pretense.`;
    setMessages([
      {
        id: `msg_${Date.now()}`,
        role: "assistant",
        content: greeting,
        timestamp: Date.now()
      }
    ]);
    setDecisionState({ decision: null, duration: 0, cooldown: 0, reason: "" });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 select-none animate-in fade-in duration-200">
      <div className="w-full max-w-2xl h-[700px] max-h-[92vh] bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Top Bar */}
        <div className="px-5 py-3.5 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-zinc-100 font-sans">
                  Negotiate Unlock with {activeCharacter.display_name}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-mono">
                  MULTI-TURN GEMINI
                </span>
              </div>
              <p className="text-[11px] font-mono text-zinc-400 flex items-center gap-1.5">
                <span>Persona: {activeCharacter.archetype}</span>
                <span className="text-zinc-600">•</span>
                <span className="text-amber-400/90 font-sans font-medium">Voice: Deep Baritone (Slow & Natural)</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={resetChat}
              className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
              title="Reset Negotiation"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Target App Selector Bar */}
        <div className="px-5 py-2.5 bg-zinc-900/40 border-b border-zinc-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-zinc-400 font-mono text-[11px]">TARGET APP:</span>
            {!isCustomApp ? (
              <select
                value={selectedApp.package_name}
                onChange={e => {
                  const found = restrictedApps.find(a => a.package_name === e.target.value);
                  if (found) setSelectedApp(found);
                }}
                className="bg-zinc-900 border border-zinc-700 text-zinc-200 rounded-xl px-2.5 py-1 text-xs font-medium focus:outline-none focus:border-amber-500"
              >
                {restrictedApps.map(app => (
                  <option key={app.package_name} value={app.package_name}>
                    {app.app_name} ({app.category})
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                placeholder="Enter any App Name (e.g. Netflix, Slack)"
                value={customAppName}
                onChange={e => setCustomAppName(e.target.value)}
                className="bg-zinc-900 border border-zinc-700 text-zinc-200 rounded-xl px-2.5 py-1 text-xs w-48 focus:outline-none focus:border-amber-500"
              />
            )}
          </div>

          <button
            onClick={() => setIsCustomApp(!isCustomApp)}
            className="text-[11px] font-mono text-amber-400 hover:underline"
          >
            {isCustomApp ? "Pick from Installed Apps" : "Negotiate for Other App"}
          </button>
        </div>

        {/* Decision Banner if Approved or Denied */}
        <AnimatePresence>
          {decisionState.decision === "APPROVED" && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-emerald-950/90 border-b border-emerald-800 p-4 px-5"
            >
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  {/* Prominent App Icon */}
                  <button
                    type="button"
                    onClick={handleLaunchUnlocked}
                    className="relative group cursor-pointer active:scale-95 transition-transform"
                    title="Tap to open app"
                  >
                    <div
                      className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${
                        isCustomApp
                          ? "from-zinc-700 to-zinc-600"
                          : selectedApp.color || "from-amber-500 to-amber-600"
                      } p-0.5 shadow-lg shadow-emerald-500/20 flex items-center justify-center relative group-hover:scale-105 transition-transform`}
                    >
                      <div className="w-full h-full rounded-[14px] bg-zinc-950/40 backdrop-blur-sm flex items-center justify-center text-white">
                        <AppIcon
                          iconName={isCustomApp ? "Sparkles" : selectedApp.icon_name}
                          className="w-7 h-7"
                        />
                      </div>
                      <div className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-full bg-emerald-500 text-zinc-950 text-[8px] font-mono font-black uppercase shadow">
                        OPEN
                      </div>
                    </div>
                  </button>

                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>NEGOTIATION CONCLUDED: ACCESS GRANTED</span>
                    </div>
                    <div className="text-sm font-bold text-zinc-100 mt-0.5">
                      {isCustomApp && customAppName.trim() ? customAppName.trim() : selectedApp.app_name}
                    </div>
                    <div className="text-[11px] text-emerald-400/90 font-mono">
                      Allotted duration: {Math.floor(decisionState.duration / 60)}:
                      {((decisionState.duration % 60)).toString().padStart(2, "0")} ({decisionState.duration}s)
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleLaunchUnlocked}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-zinc-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 active:scale-98 animate-pulse"
                >
                  <Clock className="w-4 h-4" />
                  <span>
                    Open{" "}
                    {isCustomApp && customAppName.trim()
                      ? customAppName.trim()
                      : selectedApp.app_name}{" "}
                    ({Math.floor(decisionState.duration / 60)}:
                    {((decisionState.duration % 60)).toString().padStart(2, "0")})
                  </span>
                </button>
              </div>
            </motion.div>
          )}

          {decisionState.decision === "DENIED" && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-rose-950/80 border-b border-rose-800 p-3 px-5 flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-400" />
                <div>
                  <div className="text-xs font-bold text-rose-200">
                    NEGOTIATION TERMINATED: ACCESS DENIED
                  </div>
                  <div className="text-[11px] text-rose-400/90 font-mono">
                    Cooldown lock applied for {Math.floor(decisionState.cooldown / 60)} minutes.
                  </div>
                </div>
              </div>

              <span className="text-[10px] font-mono text-rose-300">
                Discipline Enforced
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scrollable Messages Thread */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map(msg => {
            const isUser = msg.role === "user";
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
              >
                {!isUser && (
                  <button
                    onClick={() => soundEngine.speakDialogue(msg.content, activeCharacter.character_id)}
                    title="Replay in Master's voice"
                    className="w-7 h-7 rounded-full bg-zinc-900 border border-zinc-700 hover:border-amber-500/60 hover:text-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5 text-zinc-400 transition-colors group"
                  >
                    <Volume2 className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                  </button>
                )}

                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? "bg-amber-500 text-zinc-950 font-medium rounded-br-none shadow-md"
                      : "bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-bl-none shadow-sm"
                  }`}
                >
                  <p>{msg.content}</p>
                  <div
                    className={`text-[9px] font-mono mt-1 text-right ${
                      isUser ? "text-zinc-800" : "text-zinc-500"
                    }`}
                  >
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </div>
                </div>
              </div>
            );
          })}

          {isEvaluating && (
            <div className="flex gap-3 justify-start items-center text-xs text-zinc-400 font-mono">
              <div className="w-7 h-7 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center animate-pulse">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
              </div>
              <div className="bg-zinc-900/60 border border-zinc-800 px-3 py-2 rounded-2xl flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce [animation-delay:0.4s]" />
                <span className="text-zinc-400 text-xs ml-1">
                  {activeCharacter.display_name} is deliberating...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Test Prompt Chips */}
        {decisionState.decision !== "APPROVED" && (
          <div className="px-4 py-1.5 bg-zinc-950 border-t border-zinc-800 flex items-center gap-1.5 overflow-x-auto text-[11px] no-scrollbar">
            <span className="text-[10px] font-mono text-zinc-500 uppercase flex-shrink-0">
              Quick:
            </span>
            <button
              type="button"
              onClick={() => {
                setInputText("I'm bored and just want to scroll for 5 minutes");
              }}
              className="px-2.5 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-rose-300 hover:bg-zinc-800 flex-shrink-0 whitespace-nowrap transition-colors"
            >
              Test Scolding ("Bored")
            </button>
            <button
              type="button"
              onClick={() => {
                setInputText("Client sent urgent project meeting location in DM, need 3 minutes");
              }}
              className="px-2.5 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-emerald-300 hover:bg-zinc-800 flex-shrink-0 whitespace-nowrap transition-colors"
            >
              Client DM (3m)
            </button>
            <button
              type="button"
              onClick={() => {
                setInputText("Master, I'm stressed and struggling with focus. Be honest with me.");
              }}
              className="px-2.5 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-sky-300 hover:bg-zinc-800 flex-shrink-0 whitespace-nowrap transition-colors"
            >
              Struggling with Focus (Kindness)
            </button>
            <button
              type="button"
              onClick={() => {
                setInputText("Need 2 minutes to retrieve urgent bank two-factor security code");
              }}
              className="px-2.5 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-amber-300 hover:bg-zinc-800 flex-shrink-0 whitespace-nowrap transition-colors"
            >
              Bank 2FA (2m)
            </button>
          </div>
        )}

        {/* Input Bar */}
        <div className="p-3 sm:p-4 bg-zinc-900/90 border-t border-zinc-800 flex items-center gap-2">
          <button
            onClick={toggleMic}
            className={`p-2.5 rounded-xl border transition-colors ${
              isListening
                ? "bg-rose-500/20 border-rose-500 text-rose-400 animate-pulse"
                : "bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-zinc-100"
            }`}
            title={isListening ? "Listening... (click to stop)" : "Speech Input (Voice)"}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          <input
            type="text"
            placeholder={
              decisionState.decision === "APPROVED"
                ? "Access granted! Launch session above or continue discussing..."
                : `State your justification to ${activeCharacter.display_name}...`
            }
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSendMessage()}
            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500 transition-colors"
          />

          <button
            onClick={handleSendMessage}
            disabled={!inputText.trim() || isEvaluating}
            className="p-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 font-bold transition-all shadow-md shadow-amber-500/20"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
