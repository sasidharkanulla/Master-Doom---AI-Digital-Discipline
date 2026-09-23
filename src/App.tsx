import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Send,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  ShieldAlert,
  Mic,
  Globe,
  Volume2,
  ExternalLink,
  Flame,
  BookOpen,
  Zap,
  ChevronUp,
  Play,
  Lock,
  Layers,
  CornerDownRight
} from "lucide-react";
import { MasterSatoshiScene, MasterExpression } from "./components/MasterSatoshiScene";
import { LiveVoiceModal } from "./components/LiveVoiceModal";
import { AuthBar } from "./components/AuthBar";
import { DirectAccessDrawer } from "./components/DirectAccessDrawer";
import { ActiveAppSessionModal } from "./components/ActiveAppSessionModal";
import { SocialMediaUnlockModal } from "./components/SocialMediaUnlockModal";
import { auth, onAuthStateChanged, User } from "./firebase/config";
import {
  syncUserProfile,
  saveMessageToFirestore,
  loadRecentMessages,
  updateStoicScore,
  UserProfileData
} from "./firebase/userStore";
import { soundEngine } from "./utils/audio";
import { computeAnalyticsState } from "./utils/math";
import { SAMPLE_INITIAL_SESSIONS, DEFAULT_DIRECT_ACCESS_APPS } from "./data/initialData";
import { BargainSession, DirectAccessApp } from "./types";
import { AppIcon } from "./components/AppIcon";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  grounded?: boolean;
  sources?: Array<{ title: string; uri: string }>;
  modelUsed?: string;
  isStreaming?: boolean;
}

const GATEKEEPER_INTENTION_PROMPTS = [
  "I need 15 minutes of deep focus on Notion for my project",
  "Petition Master Satoshi for 3 minutes on Slack for urgent work",
  "Examine if my desire to open social media is genuine duty or impulse",
  "Master, my mind is restless—guide my focus back to what is in my control"
];

const STOIC_PROMPTS = [
  "Master, my mind is restless and wants to scroll.",
  "What is truly within my control right now?",
  "How did Marcus Aurelius handle overwhelming pressure?",
  "Teach me the practice of voluntary discomfort.",
  "I need 3 minutes for a work message."
];

export default function App() {
  // Live Date & Time
  const [currentDateStr, setCurrentDateStr] = useState<string>("");
  const [currentTimeStr, setCurrentTimeStr] = useState<string>("");
  const [displayTimeStr, setDisplayTimeStr] = useState<string>("");
  const [displayPeriodStr, setDisplayPeriodStr] = useState<string>("");
  const [fullDateStr, setFullDateStr] = useState<string>("");

  // Firebase User & Profile State
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfileData | null>(null);

  // Derive greeting name (e.g., "Ancient")
  const userGreetingName = useMemo(() => {
    if (user?.displayName) {
      return user.displayName.split(" ")[0];
    }
    if (user?.email) {
      const raw = user.email.split("@")[0].split(".")[0];
      return raw.charAt(0).toUpperCase() + raw.slice(1);
    }
    return "Ancient";
  }, [user]);

  // Speech Recognition dictation state
  const [isDictating, setIsDictating] = useState<boolean>(false);
  const recognitionRef = useRef<any>(null);

  const handleToggleDictation = () => {
    const SpeechRec =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      setIsLiveVoiceOpen(true);
      return;
    }

    if (isDictating && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      setIsDictating(false);
      return;
    }

    try {
      const recog = new SpeechRec();
      recog.continuous = false;
      recog.interimResults = true;
      recog.lang = "en-US";

      recog.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((r: any) => r[0].transcript)
          .join("");
        setInputText(transcript);
      };

      recog.onend = () => {
        setIsDictating(false);
      };

      recog.onerror = () => {
        setIsDictating(false);
      };

      recognitionRef.current = recog;
      recog.start();
      setIsDictating(true);
    } catch (err) {
      console.warn("Speech recognition error:", err);
      setIsLiveVoiceOpen(true);
    }
  };

  // Master Satoshi's Contextual Animated Expression
  const [expression, setExpression] = useState<MasterExpression>("idle");

  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState<string>("");
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [isLiveVoiceOpen, setIsLiveVoiceOpen] = useState<boolean>(false);
  const [isSpeakingAudio, setIsSpeakingAudio] = useState<string | null>(null);

  // Gemini Model & Grounding Controls (Default to gemini-3.1-flash-lite for ultra-fast responses)
  const [selectedModel, setSelectedModel] = useState<"gemini-3.1-flash-lite" | "gemini-3.5-flash">("gemini-3.1-flash-lite");
  const [useGrounding, setUseGrounding] = useState<boolean>(false);

  // Decision state for app requests
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

  // Direct Access Apps State (Swipe Up to configure)
  const [directApps, setDirectApps] = useState<DirectAccessApp[]>(() => {
    try {
      const saved = localStorage.getItem("gk_direct_apps");
      return saved ? JSON.parse(saved) : DEFAULT_DIRECT_ACCESS_APPS;
    } catch {
      return DEFAULT_DIRECT_ACCESS_APPS;
    }
  });
  const [isDirectDrawerOpen, setIsDirectDrawerOpen] = useState<boolean>(false);
  const [activeSessionApp, setActiveSessionApp] = useState<{
    package_name: string;
    app_name: string;
    category: string;
    icon_name: string;
    is_social_media?: boolean;
    granted_duration_seconds?: number;
  } | null>(null);
  const [activeSessionReason, setActiveSessionReason] = useState<string | undefined>(undefined);
  const [socialPetitionApp, setSocialPetitionApp] = useState<{
    package_name: string;
    app_name: string;
    icon_name: string;
    category: string;
  } | null>(null);

  const touchStartYRef = useRef<number>(0);

  // Sync direct apps to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("gk_direct_apps", JSON.stringify(directApps));
    } catch {}
  }, [directApps]);

  // Keyboard shortcut: ArrowUp opens direct access drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "ArrowUp" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        setIsDirectDrawerOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const deltaY = touchStartYRef.current - e.changedTouches[0].clientY;
    // Upward swipe by > 40px opens drawer
    if (deltaY > 40) {
      setIsDirectDrawerOpen(true);
    }
  };

  const handleAddDirectApp = (app: {
    package_name: string;
    app_name: string;
    category: "Productivity" | "Utility" | "Reading" | "Tools" | "Health" | "Work";
    icon_name: string;
  }) => {
    setDirectApps((prev) => {
      if (prev.some((a) => a.package_name === app.package_name)) return prev;
      return [...prev, { ...app, added_at: Date.now() }];
    });
  };

  const handleRemoveDirectApp = (pkgName: string) => {
    setDirectApps((prev) => prev.filter((a) => a.package_name !== pkgName));
  };

  const handleLaunchDirectApp = (app: DirectAccessApp) => {
    setIsDirectDrawerOpen(false);
    setActiveSessionReason(undefined);
    setActiveSessionApp({
      package_name: app.package_name,
      app_name: app.app_name,
      category: app.category,
      icon_name: app.icon_name,
      is_social_media: false
    });
  };

  const handleLaunchSocialMediaSuccess = (
    app: any,
    reason: string,
    durationSeconds: number
  ) => {
    setSocialPetitionApp(null);
    setIsDirectDrawerOpen(false);
    setActiveSessionReason(reason);
    setActiveSessionApp({
      package_name: app.package_name,
      app_name: app.app_name,
      category: app.category,
      icon_name: app.icon_name,
      is_social_media: true,
      granted_duration_seconds: durationSeconds
    });
  };

  // Persistent Sessions & Discipline Analytics
  const [sessions, setSessions] = useState<BargainSession[]>(() => {
    try {
      const saved = localStorage.getItem("gk_sessions");
      return saved ? JSON.parse(saved) : SAMPLE_INITIAL_SESSIONS;
    } catch {
      return SAMPLE_INITIAL_SESSIONS;
    }
  });

  const [attemptTimestamps] = useState<number[]>([
    Date.now() - 3600000 * 2,
    Date.now() - 3600000 * 1.2
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Firebase Auth Listener & Firestore Sync
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userProf = await syncUserProfile(currentUser);
          setProfile(userProf);

          // Load past conversations from Firestore
          const history = await loadRecentMessages(currentUser.uid, 20);
          if (history.length > 0) {
            setMessages(
              history.map((m) => ({
                id: m.id,
                role: m.role === "user" ? "user" : "assistant",
                content: m.content,
                timestamp: new Date(m.timestamp).getTime(),
                grounded: m.grounded,
                sources: m.sources ? JSON.parse(m.sources) : undefined
              }))
            );
          }
        } catch (err) {
          console.warn("Firestore sync error:", err);
        }
      } else {
        setProfile(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // Sync sessions to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("gk_sessions", JSON.stringify(sessions));
    } catch {}
  }, [sessions]);

  // Clock Ticker
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentDateStr(
        now.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric"
        })
      );
      setFullDateStr(
        now.toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric"
        })
      );
      const timeFormatted = now.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true
      });
      const parts = timeFormatted.split(" ");
      setDisplayTimeStr(parts[0]);
      setDisplayPeriodStr(parts[1] || "");
      setCurrentTimeStr(timeFormatted);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Compute live discipline score (DDS)
  const analytics = useMemo(() => {
    return computeAnalyticsState(
      sessions,
      attemptTimestamps,
      Date.now() - 120000,
      Date.now() - 118000,
      1
    );
  }, [sessions, attemptTimestamps]);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isEvaluating]);

  // Play Master Satoshi Voice TTS
  const handlePlayVoice = async (text: string, msgId: string) => {
    if (isSpeakingAudio === msgId) {
      setIsSpeakingAudio(null);
      return;
    }

    try {
      setIsSpeakingAudio(msgId);
      setExpression("speaking");

      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          character_id: "satoshi"
        })
      });

      if (!res.ok) throw new Error("TTS request failed");
      const data = await res.json();

      if (data.audioBase64) {
        // Decode and play PCM / audio
        const binary = atob(data.audioBase64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }

        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
          sampleRate: data.sampleRate || 24000
        });

        // Convert 16-bit PCM to Float32
        const int16 = new Int16Array(bytes.buffer);
        const float32 = new Float32Array(int16.length);
        for (let i = 0; i < int16.length; i++) {
          float32[i] = int16[i] / 32768;
        }

        const audioBuffer = audioCtx.createBuffer(1, float32.length, data.sampleRate || 24000);
        audioBuffer.copyToChannel(float32, 0);

        const source = audioCtx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioCtx.destination);
        source.onended = () => {
          setIsSpeakingAudio(null);
          setExpression("idle");
        };
        source.start();
      } else {
        setIsSpeakingAudio(null);
        setExpression("idle");
      }
    } catch (err) {
      console.warn("TTS playback note:", err);
      setIsSpeakingAudio(null);
      setExpression("idle");
    }
  };

  // Send message in Multi-turn Chat with real-time SSE streaming for instant speed
  const handleSendMessage = async (customText?: string) => {
    const text = (customText || inputText).trim();
    if (!text || isEvaluating) return;

    soundEngine.playHapticTick();
    setInputText("");

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}_u`,
      role: "user",
      content: text,
      timestamp: Date.now()
    };

    const assistantMsgId = `msg_${Date.now()}_a`;
    const initialAssistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: "assistant",
      content: "",
      timestamp: Date.now(),
      isStreaming: true
    };

    const newHistory = [...messages, userMsg];
    // Add placeholder immediately so the UI responds with zero delay
    setMessages([...newHistory, initialAssistantMsg]);
    setIsEvaluating(true);
    setExpression("evaluating");

    // Persist user message to Firestore if signed in
    if (user) {
      saveMessageToFirestore(user.uid, {
        id: userMsg.id,
        userId: user.uid,
        role: "user",
        content: userMsg.content,
        timestamp: new Date(userMsg.timestamp).toISOString(),
        mode: "chat"
      });
    }

    const now = new Date();
    const payload = {
      package_name: "com.stoic.practice",
      app_name: "Digital Life",
      character_id: "satoshi",
      messages: newHistory.map((m) => ({
        role: m.role,
        content: m.content
      })),
      model_name: selectedModel,
      use_grounding: useGrounding,
      client_hour: now.getHours(),
      client_time_str: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    try {
      // 1. Try real-time streaming endpoint for immediate token delivery
      const res = await fetch("/api/bargain/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok || !res.body) {
        throw new Error("Stream endpoint unavailable, falling back");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";
      let accumulated = "";
      let streamDoneData: any = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const jsonStr = trimmed.slice(5).trim();
          if (!jsonStr) continue;

          try {
            const parsed = JSON.parse(jsonStr);
            if (parsed.type === "chunk" && parsed.text) {
              accumulated += parsed.text;
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMsgId
                    ? { ...msg, content: accumulated, isStreaming: true }
                    : msg
                )
              );
            } else if (parsed.type === "done") {
              streamDoneData = parsed;
            }
          } catch {
            // ignore partial JSON in stream
          }
        }
      }

      const finalReply =
        streamDoneData?.reply ||
        accumulated ||
        "Discipline is remembering what you want most over what you want right now.";

      // Finalize assistant message
      const finalizedAssistantMsg: ChatMessage = {
        id: assistantMsgId,
        role: "assistant",
        content: finalReply,
        timestamp: Date.now(),
        grounded: streamDoneData?.grounded,
        sources: streamDoneData?.sources,
        modelUsed: streamDoneData?.modelUsed || selectedModel,
        isStreaming: false
      };

      setMessages((prev) =>
        prev.map((msg) => (msg.id === assistantMsgId ? finalizedAssistantMsg : msg))
      );

      // Persist master message to Firestore
      if (user) {
        saveMessageToFirestore(user.uid, {
          id: assistantMsgId,
          userId: user.uid,
          role: "master",
          content: finalReply,
          timestamp: new Date(finalizedAssistantMsg.timestamp).toISOString(),
          grounded: streamDoneData?.grounded,
          sources: streamDoneData?.sources ? JSON.stringify(streamDoneData.sources) : ""
        });
      }

      // Handle decision verdicts
      const decision = streamDoneData?.decision;
      if (decision === "APPROVED") {
        setExpression("approved");
        setDecisionState({
          decision: "APPROVED",
          duration: streamDoneData?.granted_duration_seconds || 180,
          cooldown: 0,
          reason: text
        });

        if (user && profile) {
          const nextScore = Math.min(100, profile.stoicScore + 1);
          setProfile({ ...profile, stoicScore: nextScore });
          updateStoicScore(user.uid, nextScore);
        }

        setSessions((prev) => [
          {
            id: `sess_${Date.now()}`,
            package_name: "com.custom.app",
            character_id: "satoshi",
            user_prompt: text,
            llm_rationale: finalReply,
            decision: "APPROVED",
            granted_duration_seconds: streamDoneData?.granted_duration_seconds || 180,
            timestamp: Date.now(),
            audit_completed: 0,
            audit_passed: 0,
            cooldown_seconds: 0
          },
          ...prev
        ]);
      } else if (decision === "DENIED") {
        setExpression("denied");
        setDecisionState({
          decision: "DENIED",
          duration: 0,
          cooldown: streamDoneData?.cooldown_seconds || 900,
          reason: text
        });

        if (user && profile) {
          const nextScore = Math.min(100, profile.stoicScore + 2);
          setProfile({ ...profile, stoicScore: nextScore });
          updateStoicScore(user.uid, nextScore);
        }

        setSessions((prev) => [
          {
            id: `sess_${Date.now()}`,
            package_name: "com.custom.app",
            character_id: "satoshi",
            user_prompt: text,
            llm_rationale: finalReply,
            decision: "DENIED",
            granted_duration_seconds: 0,
            timestamp: Date.now(),
            audit_completed: 0,
            audit_passed: 0,
            cooldown_seconds: streamDoneData?.cooldown_seconds || 900
          },
          ...prev
        ]);
      } else {
        setExpression("speaking");
        setTimeout(() => setExpression("idle"), 3000);
      }
    } catch {
      // 2. Direct fallback to standard fast endpoint
      try {
        const fallbackRes = await fetch("/api/bargain/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const data = await fallbackRes.json();
        const reply = data.reply || "Observe the restless urge without obeying it.";

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? {
                  ...msg,
                  content: reply,
                  grounded: data.grounded,
                  sources: data.sources,
                  modelUsed: data.modelUsed,
                  isStreaming: false
                }
              : msg
          )
        );
        setExpression("idle");
      } catch {
        const offlineReply =
          "The obstacle is the way. Observe your restless urge without obeying it, and your power returns.";
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? {
                  ...msg,
                  content: offlineReply,
                  isStreaming: false
                }
              : msg
          )
        );
        setExpression("idle");
      }
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleResetChat = () => {
    soundEngine.playHapticTick();
    setMessages([]);
    setDecisionState({ decision: null, duration: 0, cooldown: 0, reason: "" });
    setExpression("idle");
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="relative w-screen h-screen overflow-hidden bg-black text-white flex flex-col justify-between select-none font-sans"
    >
      {/* 1. MASTER SATOSHI ANIMATED BACKGROUND (MONOCHROME) */}
      <MasterSatoshiScene expression={expression} />

      {/* 2. MAIN VIEWPORT: TIME, DATE, AND CONVERSATION */}
      <main className="relative z-20 w-full max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col justify-between min-h-0 flex-1">
        {/* Decision Banner (If Approved or Denied) */}
        <AnimatePresence>
          {decisionState.decision === "APPROVED" && (
            <motion.div
              initial={{ opacity: 0, y: -15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 px-4 py-3 rounded-2xl bg-black/80 text-white border border-white/40 backdrop-blur-xl shadow-2xl flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-white flex-shrink-0" />
                <div>
                  <div className="text-xs font-bold uppercase tracking-wide text-white">
                    Passage Granted by Master Satoshi
                  </div>
                  <div className="text-[11px] font-mono text-white/80">
                    Allotted time: {Math.floor(decisionState.duration / 60)}m {decisionState.duration % 60}s
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-white px-2.5 py-1 rounded-lg border border-white/40">
                Duty Verified
              </span>
            </motion.div>
          )}

          {decisionState.decision === "DENIED" && (
            <motion.div
              initial={{ opacity: 0, y: -15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 px-4 py-3 rounded-2xl bg-black/80 text-white border border-white/40 backdrop-blur-xl shadow-2xl flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="w-5 h-5 text-white flex-shrink-0" />
                <div>
                  <div className="text-xs font-bold uppercase tracking-wide text-white">
                    Impulse Denied — Embrace Stillness
                  </div>
                  <div className="text-[11px] font-mono text-white/80">
                    Restraint cooldown: {Math.floor(decisionState.cooldown / 60)}m
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-white px-2.5 py-1 rounded-lg border border-white/40">
                Fortitude Built
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* SMALL, ELEGANT TIME & DATE (UNOBTRUSIVE TO KEEP CHARACTER VISIBLE) */}
        <div className="w-full flex justify-center items-center select-none pt-1 sm:pt-3">
          <div className="px-3.5 py-1.5 rounded-full bg-black/40 border border-white/20 backdrop-blur-md flex items-center gap-2.5 text-xs font-mono text-white/90 shadow-md">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span className="font-semibold text-white tracking-wide text-xs sm:text-sm">
              {currentTimeStr}
            </span>
            <span className="text-white/30">•</span>
            <span className="text-white/70 uppercase tracking-widest text-[10px] sm:text-[11px]">
              {fullDateStr || "Today"}
            </span>
          </div>
        </div>

        {/* Clear center viewport so Master Satoshi is unobstructed */}
        {messages.length === 0 && (
          <div className="flex-1 select-none pointer-events-none" />
        )}

        {/* Scrollable Conversation Thread (When Active) */}
        {messages.length > 0 && (
          <div className="overflow-y-auto mb-4 px-1 space-y-3 no-scrollbar max-h-[42vh]">
            {messages.map((msg) => {
              const isUser = msg.role === "user";
              return (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed shadow-md bg-black/70 text-white border backdrop-blur-md ${
                      isUser
                        ? "border-white/50 font-sans font-medium rounded-br-none"
                        : "border-white/25 rounded-bl-none font-serif tracking-wide"
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-white">
                      {msg.content || (msg.isStreaming ? (
                        <span className="text-white/70 italic font-mono text-[11px] animate-pulse">
                          Master Satoshi is speaking...
                        </span>
                      ) : "")}
                      {msg.isStreaming && (
                        <span className="inline-block w-1.5 h-3.5 bg-white ml-1 translate-y-0.5 animate-pulse" />
                      )}
                    </p>

                    {/* Google Search Grounding Sources */}
                    {msg.grounded && msg.sources && msg.sources.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-white/20">
                        <div className="flex items-center gap-1.5 text-[10px] font-mono text-white mb-1">
                          <Globe className="w-3 h-3 text-white" />
                          <span className="text-white">Google Search Grounded:</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.sources.slice(0, 3).map((src, sIdx) => (
                            <a
                              key={sIdx}
                              href={src.uri}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-transparent hover:bg-white/10 text-white text-[10px] border border-white/30 transition-colors"
                            >
                              <span className="truncate max-w-[140px] text-white">{src.title}</span>
                              <ExternalLink className="w-2.5 h-2.5 text-white opacity-60" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Bottom row: TTS voice button & timestamp */}
                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-white/15 text-[9px] font-mono text-white/70">
                      {!isUser ? (
                        <button
                          onClick={() => handlePlayVoice(msg.content, msg.id)}
                          className={`flex items-center gap-1 px-2 py-0.5 rounded-md border text-white transition-colors ${
                            isSpeakingAudio === msg.id
                              ? "bg-transparent border-white underline"
                              : "bg-transparent hover:bg-white/10 border-white/30"
                          }`}
                          title="Listen to Master Satoshi's voice"
                        >
                          <Volume2 className="w-3 h-3 text-white" />
                          <span className="text-white">{isSpeakingAudio === msg.id ? "Speaking..." : "Voice"}</span>
                        </button>
                      ) : (
                        <span />
                      )}

                      <span className="text-white/60">
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {isEvaluating && !messages.some((m) => m.isStreaming) && (
              <div className="flex gap-2.5 justify-start items-center text-xs font-mono text-white">
                <div className="w-7 h-7 rounded-xl bg-transparent border border-white/30 flex items-center justify-center animate-pulse text-white">
                  <Sparkles className="w-3.5 h-3.5 text-white animate-spin" />
                </div>
                <div className="bg-black/70 border border-white/30 px-3.5 py-2 rounded-2xl flex items-center gap-1.5 text-white">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce [animation-delay:0.4s]" />
                  <span className="text-white text-xs ml-1">
                    Master Satoshi is reflecting...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}

        {/* CHAT INPUT CAPSULE (CLEAN & MODERN WITH INTEGRATED LIVE VOICE) */}
        <div className="w-full rounded-full bg-black/80 border border-white/30 backdrop-blur-2xl pl-4 sm:pl-5 pr-2 sm:pr-2.5 py-2 sm:py-2.5 shadow-2xl flex items-center gap-2 sm:gap-3 text-white">
          {/* Text Input: Clean, modern input */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Ask anything or state intention..."
            className="flex-1 bg-transparent px-1 py-1 text-sm sm:text-base text-white placeholder-white/40 focus:outline-none font-sans"
            disabled={isEvaluating}
          />

          {/* Reset / Clear Button if messages exist */}
          {messages.length > 0 && (
            <button
              onClick={handleResetChat}
              className="p-1.5 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors flex-shrink-0"
              title="Clear dialogue and return to stillness"
            >
              <RotateCcw className="w-4 h-4 text-white" />
            </button>
          )}

          {/* Send Button (Visible when typing) */}
          {inputText.trim().length > 0 && (
            <button
              onClick={() => handleSendMessage()}
              disabled={isEvaluating}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all flex-shrink-0 active:scale-95"
              title="Submit message"
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          )}

          {/* Microphone Icon for Voice Dictation */}
          <button
            type="button"
            onClick={handleToggleDictation}
            className={`p-2 rounded-full hover:bg-white/10 text-white transition-colors flex-shrink-0 ${
              isDictating ? "bg-white/20 text-white animate-pulse" : "text-white/80 hover:text-white"
            }`}
            title={isDictating ? "Listening... tap to stop" : "Voice dictation"}
          >
            <Mic className="w-5 h-5 text-white" />
          </button>

          {/* Integrated Live Voice Button (Master Satoshi Live Audio Waveform) */}
          <button
            type="button"
            onClick={() => setIsLiveVoiceOpen(true)}
            className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 border border-white/40 flex items-center justify-center text-white transition-all shadow-md active:scale-95 group flex-shrink-0"
            title="Consult Master Satoshi via Live Voice"
          >
            <div className="flex items-center justify-center gap-[2.5px] h-5">
              <span className="w-[2.5px] h-2.5 bg-white/70 rounded-full group-hover:h-3.5 transition-all" />
              <span className="w-[2.5px] h-4.5 bg-white rounded-full group-hover:h-5 transition-all" />
              <span className="w-[2.5px] h-3 bg-white/80 rounded-full group-hover:h-4 transition-all" />
              <span className="w-[2.5px] h-1.5 bg-white/60 rounded-full group-hover:h-2.5 transition-all" />
            </div>
          </button>
        </div>
      </main>

      {/* 4. REAL-TIME LIVE VOICE MODAL (gemini-3.8-live) */}
      <LiveVoiceModal
        isOpen={isLiveVoiceOpen}
        onClose={() => setIsLiveVoiceOpen(false)}
      />

      {/* 5. DIRECT ACCESS APPS DRAWER (SWIPE UP OR TAP +) */}
      <DirectAccessDrawer
        isOpen={isDirectDrawerOpen}
        onClose={() => setIsDirectDrawerOpen(false)}
        directApps={directApps}
        user={user}
        profile={profile}
        onUserChanged={setUser}
        stoicScore={profile ? profile.stoicScore : Number(analytics.dds_score.toFixed(0))}
        onAddDirectApp={handleAddDirectApp}
        onRemoveDirectApp={handleRemoveDirectApp}
        onLaunchDirectApp={handleLaunchDirectApp}
        onRequestSocialMediaUnlock={(app) => {
          setIsDirectDrawerOpen(false);
          setSocialPetitionApp(app);
        }}
      />

      {/* 6. ACTIVE APP SESSION MODAL (WITH 15-MINUTE THRESHOLD CHECK) */}
      <ActiveAppSessionModal
        isOpen={Boolean(activeSessionApp)}
        onClose={() => {
          setActiveSessionApp(null);
          setActiveSessionReason(undefined);
        }}
        app={activeSessionApp}
        initialGrantedSeconds={activeSessionApp?.granted_duration_seconds}
        verifiedReason={activeSessionReason}
        onSessionExtended={(purpose) => {
          if (user && profile) {
            const nextScore = Math.min(100, profile.stoicScore + 1);
            setProfile({ ...profile, stoicScore: nextScore });
            updateStoicScore(user.uid, nextScore);
          }
        }}
      />

      {/* 7. SOCIAL MEDIA STRICT RESTRICTION UNLOCK MODAL */}
      <SocialMediaUnlockModal
        isOpen={Boolean(socialPetitionApp)}
        onClose={() => setSocialPetitionApp(null)}
        app={socialPetitionApp}
        onUnlockSuccess={handleLaunchSocialMediaSuccess}
      />
    </div>
  );
}
