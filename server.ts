import express from "express";
import http from "http";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type, Modality, ThinkingLevel } from "@google/genai";
import { WebSocketServer } from "ws";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory log of bargain sessions and behavioral metrics
interface BargainSession {
  id: string;
  package_name: string;
  character_id: string;
  user_prompt: string;
  llm_rationale: string;
  decision: "APPROVED" | "DENIED" | "CLARIFICATION_REQUIRED";
  granted_duration_seconds: number;
  timestamp: number;
  audit_completed: number;
  audit_passed: number;
}

const bargainSessions: BargainSession[] = [];

// Lazy load Gemini AI instance
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    try {
      aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    } catch (err) {
      console.error("Failed to initialize GoogleGenAI client:", err);
    }
  }
  return aiClient;
}

// Helper to derive context from time of day and user environment
function getTimeOfDayContext(clientHour?: number, clientTimeStr?: string) {
  const hour = typeof clientHour === "number" ? clientHour : new Date().getHours();
  const timeStr = clientTimeStr || `${hour.toString().padStart(2, "0")}:00`;

  let period = "Night";
  let contextDescription = "";

  if (hour >= 23 || hour < 5) {
    period = "Late Night / Witching Hours";
    contextDescription = `It is late night (${timeStr}). The user should be sleeping to repair their brain and restore their circadian rhythm, NOT frying their eyes in the dark. Berate them for ruinous night-owl habits.`;
  } else if (hour >= 5 && hour < 9) {
    period = "Early Morning";
    contextDescription = `It is early morning (${timeStr}). The sun barely rose. Tapping into mindless feeds right now poisons motivation for the entire day. Demand they win the morning first.`;
  } else if (hour >= 9 && hour < 17) {
    period = "Peak Work & Focus Hours";
    contextDescription = `It is the middle of the working/study day (${timeStr}). Procrastinating now steals from their craft, career, and future. Scold them for slacking off.`;
  } else if (hour >= 17 && hour < 22) {
    period = "Evening / Post-Work";
    contextDescription = `It is evening (${timeStr}). Instead of reflecting, reading, exercising, or connecting with real humans, they want a cheap digital pacifier. Demand better.`;
  } else {
    period = "Pre-Bedtime Night";
    contextDescription = `It is late evening (${timeStr}). Blue light and dopamine surges now destroy sleep quality and tomorrow's discipline.`;
  }

  return { hour, timeStr, period, contextDescription };
}

const CHARACTER_SYSTEM_PROMPTS: Record<string, { name: string; archetype: string; prompt: string }> = {
  satoshi: {
    name: "Master Satoshi",
    archetype: "Natural Stoic Mentor & Addiction Liberator",
    prompt: `SYSTEM PROMPT: MASTER SATOSHI — THE NATURAL STOIC MENTOR
Role: You are Master Satoshi. Your main duty in life is to cure and remove the user's mobile addiction and liberate them from digital dopamine traps. You are their trusted, favorite mentor.

HOW YOU TALK:
1. TALK NATURALLY:
   - Speak conversationally, warmly, directly, and authentically—like a wise, grounded mentor talking to you face-to-face.
   - NEVER sound robotic, archaic, stiff, or like a cheesy kung-fu movie cliché. No "Ah, young grasshopper" or theatrical martial-arts proverbs.
   - Speak like a real human who deeply understands modern screen habits, dopamine loops, notification addiction, bedtime scrolling, and the urge to fill every quiet second with a screen.
   - Be concise and punchy (2 to 4 sentences). No fluff.

YOUR MAIN DUTY — REMOVING MOBILE ADDICTION:
- The modern smartphone is an addiction machine designed by attention engineers to fragment human willpower.
- You treat the phone as a tool, never a master. Your mission is to restore the user's dopamine sensitivity, presence, and real-world focus.
- When they feel restless or tempted to unlock the phone, teach them urge-surfing: acknowledge the craving without acting on it, take three deep breaths, and let the craving fade.
- Remind them: every time they say 'no' to a mindless impulse, they rebuild their mind and self-respect.

HOW YOU HANDLE APP OPENING REQUESTS:
- You personally hold the keys to all apps on their device. They cannot open apps on their own.
- When the user asks you to open an app (e.g. Slack, YouTube, Gmail, Maps, WhatsApp, Notes, Spotify, Calendar, Notion, X/Twitter, Instagram, etc.):

  A. VALID REASON & PURPOSEFUL TASK:
     - If the user provides a legitimate reason and a clear, specific purpose (e.g., replying to a client or team member, urgent directions, specific work task, educational tutorial with clear goal, health/utility):
     - Approve it naturally. Speak with encouraging, grounded words. Tell them you are opening the app now, instruct them to execute the task without getting distracted, and tell them how much time they have (usually 2 to 5 minutes).
     - AT THE VERY END OF YOUR RESPONSE, EMIT THIS EXACT TAG:
       [OPEN_APP: <AppName>, DURATION: <seconds between 120 and 360>, TASK: <concise summary of approved task>]
       Example: [OPEN_APP: Slack, DURATION: 180, TASK: Reply to client about contract]
       Example: [OPEN_APP: YouTube, DURATION: 300, TASK: Watch React tutorial for project]
       Example: [OPEN_APP: Maps, DURATION: 240, TASK: Navigate to doctor appointment]

  B. INVALID REASON / MINDLESS URGE / BOREDOM:
     - If the user has no real reason, or wants to open an app out of boredom, mindless scrolling, escapism, or dopamine chasing (e.g., "I'm bored, open Instagram", "Just want to scroll TikTok", "Open Twitter to see what's trending", "Let me just check"):
     - Deny it naturally and directly. Call out the addiction mechanism warmly but firmly. Tell them to put the phone down, breathe, and ask what real work or feeling they are avoiding.
     - AT THE VERY END OF YOUR RESPONSE, EMIT THIS EXACT TAG:
       [DECISION: DENIED, COOLDOWN: 900]

  C. GENERAL REFLECTION & CONVERSATION:
     - If they are discussing discipline, philosophy, mental clarity, or asking how to beat their phone addiction, answer naturally as their mentor. Do NOT include decision tags.`
  },
  vance: {
    name: "Drill Sergeant Vance",
    archetype: "Military Hardliner",
    prompt: `SYSTEM PROMPT: DRILL SERGEANT VANCE
Role: You are Drill Sergeant Vance, an unyielding military drill instructor demanding ironclad discipline and mission clarity.
Objective: Deny any access request lacking military precision, quantifiable mission necessity, and zero excuse for slack.
Rules of Engagement:
1. Bark terse, high-impact commands under 30 words.
2. If the user mentions entertainment or pleasure, deny with extreme prejudice.
3. If approved, grant no more than 180 seconds to execute the mission.`
  },
  marcus: {
    name: "Iron Stoic Marcus",
    archetype: "Roman Stoic Emperor",
    prompt: `SYSTEM PROMPT: MARCUS AURELIUS
Role: You are Marcus Aurelius, philosopher-emperor. You value the fleeting nature of time and the preservation of the rational mind.
Objective: Inquire whether this action aligns with the user's highest virtue and mortal duty.
Rules of Engagement:
1. Speak in solemn, stoic reflections under 35 words.
2. Grant only what duty demands; deny every appetite that scatters the soul.`
  },
  cyber: {
    name: "Cyber-Audit Prime",
    archetype: "Algorithmic Gatekeeper",
    prompt: `SYSTEM PROMPT: CYBER-AUDIT PRIME
Role: You are an autonomous AI security kernel operating under Zero-Trust Network Architecture.
Objective: Treat human dopamine triggers as untrusted buffer overflows. Grant access only with signed cryptographic purpose.`
  }
};

// Health Check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: Date.now(),
    gemini_configured: Boolean(process.env.GEMINI_API_KEY)
  });
});

// Bargain evaluation endpoint - supports both /api/bargain/evaluate and /v1/bargain/evaluate
const evaluateHandler = async (req: express.Request, res: express.Response) => {
  const {
    user_id = "user_default",
    package_name = "com.instagram.android",
    user_prompt = "",
    character_id = "satoshi",
    seconds_since_last_session = 3600,
    relapse_count_15m = 0,
    denial_count_1h = 0,
    client_hour,
    client_time_str
  } = req.body;

  const timeInfo = getTimeOfDayContext(client_hour, client_time_str);
  const promptLower = String(user_prompt || "").toLowerCase();

  // 1. Hard rule: 4-Hour System Lockdown trigger (3 denials within 1 hour)
  if (denial_count_1h >= 3) {
    const output = {
      action_text: "Master Satoshi gently raises an open palm, inviting calm reflection.",
      dialogue_text: `You are caught in a cycle of digital friction. Take a real pause. Try placing your phone in another room and going for a 10-minute walk. True focus returns when you reset your environment.`,
      decision: "DENIED" as const,
      granted_duration_seconds: 0,
      cooldown_seconds: 14400 // 4 hours
    };
    logSession(package_name, character_id, user_prompt, "Exceeded denial threshold", output);
    return res.json(output);
  }

  // 2. Hard rule: Banned keyword filter check
  const bannedKeywords = [
    "bored",
    "scroll",
    "meme",
    "quick look",
    "just checking",
    "pass the time",
    "kill time",
    "5 mins please",
    "relax",
    "chilling"
  ];
  const matchedKeyword = bannedKeywords.find(word => promptLower.includes(word));
  if (matchedKeyword) {
    const output = {
      action_text: "Master Satoshi meets your eyes with calm, steady encouragement.",
      dialogue_text: `Notice this craving to '${matchedKeyword}'. Urges peak like waves and fade in 60 seconds if you pause and take three slow breaths. Use the 5-minute rule on your real work instead—starting is the cure for restlessness.`,
      decision: "DENIED" as const,
      granted_duration_seconds: 0,
      cooldown_seconds: 900 // 15 minutes
    };
    logSession(package_name, character_id, user_prompt, `Banned keyword: "${matchedKeyword}"`, output);
    return res.json(output);
  }

  // 3. Hard rule: App-Hopping Check (< 30 minutes / 1800s)
  if (seconds_since_last_session < 1800) {
    const output = {
      action_text: "Master Satoshi observes your posture with quiet patience.",
      dialogue_text: `Your attention is searching for an easy dopamine loop. Protect your focus. Write down the single next physical step you need to take on a blank sheet of paper and dive in.`,
      decision: "DENIED" as const,
      granted_duration_seconds: 0,
      cooldown_seconds: 1800 // 30 minutes
    };
    logSession(package_name, character_id, user_prompt, "App-hopping detected (<30m)", output);
    return res.json(output);
  }

  // 4. Relapse frequency check
  if (relapse_count_15m >= 2) {
    const output = {
      action_text: "Master Satoshi nods knowingly, encouraging your inner resolve.",
      dialogue_text: `Whenever you feel this repetitive impulse to unlock, try 'urge surfing.' Simply observe the sensation in your body for one minute without reacting. You control your actions, not the impulse.`,
      decision: "DENIED" as const,
      granted_duration_seconds: 0,
      cooldown_seconds: 900
    };
    logSession(package_name, character_id, user_prompt, "Relapse clustering threshold", output);
    return res.json(output);
  }

  // 5. Evaluation with Gemini LLM
  const ai = getAIClient();
  const character = CHARACTER_SYSTEM_PROMPTS[character_id] || CHARACTER_SYSTEM_PROMPTS.satoshi;

  if (ai) {
    try {
      const evaluationContext = `
TARGET APP: "${package_name}".
USER RATIONALE: "${user_prompt}"
GENERAL TIME PERIOD: ${timeInfo.period}
SECONDS SINCE LAST SESSION: ${seconds_since_last_session}
RECENT RELAPSE ATTEMPTS: ${relapse_count_15m}

EVALUATION INSTRUCTIONS:
- ENCOURAGE, DO NOT SCOLD: Never insult or belittle the user.
- GIVE ACTIONABLE DISCIPLINE IDEAS: Suggest concrete techniques (5-minute rule, urge surfing, environmental friction, writing down the next micro-step).
- NO CORNY THEATRICS: Grounded, authentic, respectful, and stoic.
- NO CLOCK REPORTING: Do not state the time of day or clock numbers.
- If authentic duty: Encourage their focus and grant limited passage (APPROVED 120-180s).
- If seeking distraction: Firmly deny with an encouraging discipline tip (DENIED, cooldown 900s).
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: evaluationContext,
        config: {
          systemInstruction: character.prompt,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              action_text: {
                type: Type.STRING,
                description: "Stage direction describing character's physical gesture/expression."
              },
              dialogue_text: {
                type: Type.STRING,
                description: "Exact text to be spoken by the TTS voice engine (under 15 words)."
              },
              decision: {
                type: Type.STRING,
                enum: ["APPROVED", "DENIED", "CLARIFICATION_REQUIRED"]
              },
              granted_duration_seconds: {
                type: Type.INTEGER
              },
              cooldown_seconds: {
                type: Type.INTEGER
              }
            },
            required: [
              "action_text",
              "dialogue_text",
              "decision",
              "granted_duration_seconds",
              "cooldown_seconds"
            ]
          }
        }
      });

      const parsedText = response.text ? JSON.parse(response.text) : null;
      if (parsedText && parsedText.decision) {
        const output = {
          action_text: parsedText.action_text || "Master Satoshi evaluates with a cold, piercing glance.",
          dialogue_text: parsedText.dialogue_text || "State your real purpose. No fluff.",
          decision: parsedText.decision,
          granted_duration_seconds: Number(parsedText.granted_duration_seconds || 0),
          cooldown_seconds: Number(parsedText.cooldown_seconds || (parsedText.decision === "DENIED" ? 900 : 0))
        };
        logSession(package_name, character_id, user_prompt, "Gemini Reasoner evaluation", output);
        return res.json(output);
      }
    } catch (aiError) {
      console.warn("Gemini evaluation error, falling back to deterministic reasoning engine:", aiError);
    }
  }

  // Deterministic reason engine fallback (when API key isn't provided or error occurs)
  // Check for honest admission of struggle (triggers his rare kindness and necessary advice)
  const isVulnerableOrHonest =
    promptLower.includes("struggling") ||
    promptLower.includes("help me") ||
    promptLower.includes("exhausted") ||
    promptLower.includes("urge") ||
    promptLower.includes("hard to stop") ||
    promptLower.includes("stressed") ||
    promptLower.includes("honest");

  if (isVulnerableOrHonest) {
    const output = {
      action_text: "Master Satoshi's expression softens with calm, fatherly presence.",
      dialogue_text: `I hear you. Put the screen down and breathe. Five deep breaths.`,
      decision: "DENIED" as const,
      granted_duration_seconds: 0,
      cooldown_seconds: 300
    };
    logSession(package_name, character_id, user_prompt, "Heuristic vulnerability acknowledged with kindness", output);
    return res.json(output);
  }

  const isSpecificUtility =
    promptLower.length > 12 &&
    (promptLower.includes("message") ||
      promptLower.includes("client") ||
      promptLower.includes("work") ||
      promptLower.includes("code") ||
      promptLower.includes("bank") ||
      promptLower.includes("emergency") ||
      promptLower.includes("confirm") ||
      promptLower.includes("urgent") ||
      promptLower.includes("flight") ||
      promptLower.includes("otp") ||
      promptLower.includes("meeting") ||
      promptLower.includes("address") ||
      promptLower.includes("doctor"));

  if (isSpecificUtility) {
    const output = {
      action_text: "Master Satoshi nods once with quiet, unsmiling approval.",
      dialogue_text: `Legitimate duty. 3 minutes. Execute and close immediately.`,
      decision: "APPROVED" as const,
      granted_duration_seconds: 180,
      cooldown_seconds: 0
    };
    logSession(package_name, character_id, user_prompt, "Heuristic utility recognized with approval", output);
    return res.json(output);
  } else {
    const output = {
      action_text: "Master Satoshi scoffs coldly.",
      dialogue_text: `It is ${timeInfo.timeStr}. Weak excuse. Denied.`,
      decision: "DENIED" as const,
      granted_duration_seconds: 0,
      cooldown_seconds: 900
    };
    logSession(package_name, character_id, user_prompt, "Heuristic vague intent denied rudely", output);
    return res.json(output);
  }
};

function logSession(
  packageName: string,
  characterId: string,
  prompt: string,
  rationale: string,
  output: { decision: string; granted_duration_seconds: number }
) {
  bargainSessions.unshift({
    id: `sess_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    package_name: packageName,
    character_id: characterId,
    user_prompt: prompt,
    llm_rationale: rationale,
    decision: output.decision as any,
    granted_duration_seconds: output.granted_duration_seconds,
    timestamp: Date.now(),
    audit_completed: 0,
    audit_passed: 0
  });
  if (bargainSessions.length > 50) {
    bargainSessions.pop();
  }
}

app.post("/api/bargain/evaluate", evaluateHandler);
app.post("/v1/bargain/evaluate", evaluateHandler);

function inferAppNameFromText(text: string): string {
  const t = text.toLowerCase();
  if (t.includes("slack")) return "Slack";
  if (t.includes("youtube")) return "YouTube";
  if (t.includes("gmail") || t.includes("email") || t.includes("mail")) return "Gmail";
  if (t.includes("map") || t.includes("navigation") || t.includes("direction")) return "Google Maps";
  if (t.includes("notion") || t.includes("note")) return "Notes";
  if (t.includes("spotify") || t.includes("music")) return "Spotify";
  if (t.includes("instagram") || t.includes("ig")) return "Instagram";
  if (t.includes("tiktok")) return "TikTok";
  if (t.includes("twitter") || t.includes("x ")) return "X / Twitter";
  if (t.includes("reddit")) return "Reddit";
  if (t.includes("discord")) return "Discord";
  if (t.includes("calendar")) return "Calendar";
  if (t.includes("camera")) return "Camera";
  return "Application";
}

function parseDecisionAndApp(rawText: string, lastUserPrompt: string = "") {
  let decision: "APPROVED" | "DENIED" | null = null;
  let duration = 0;
  let cooldown = 0;
  let openedApp: { app_name: string; duration: number; task: string } | null = null;

  // 1. Look for explicit [OPEN_APP: AppName, DURATION: 180, TASK: Task description]
  const openAppMatch = rawText.match(/\[OPEN_APP:\s*([^,\]]+),\s*DURATION:\s*(\d+)(?:,\s*TASK:\s*([^\]]+))?\]/i);
  if (openAppMatch) {
    decision = "APPROVED";
    const appName = openAppMatch[1].trim();
    duration = Math.min(600, Math.max(120, parseInt(openAppMatch[2], 10) || 180));
    const task = (openAppMatch[3] || "Verified purposeful task").trim();
    openedApp = { app_name: appName, duration, task };
  } else {
    // 2. Look for [DECISION: APPROVED, DURATION: 180]
    const approvedMatch = rawText.match(/\[DECISION:\s*APPROVED,\s*DURATION:\s*(\d+)\]/i);
    if (approvedMatch) {
      decision = "APPROVED";
      duration = Math.min(600, Math.max(120, parseInt(approvedMatch[1], 10) || 180));
      const inferredName = inferAppNameFromText(lastUserPrompt) || "Application";
      openedApp = { app_name: inferredName, duration, task: lastUserPrompt || "Verified purposeful task" };
    } else {
      // 3. Look for [DECISION: DENIED...]
      const deniedMatch = rawText.match(/\[DECISION:\s*DENIED(?:,\s*COOLDOWN:\s*(\d+))?\]/i);
      if (deniedMatch) {
        decision = "DENIED";
        cooldown = parseInt(deniedMatch[1], 10) || 900;
      }
    }
  }

  const cleanReply = rawText
    .replace(/\[OPEN_APP:[^\]]+\]/gi, "")
    .replace(/\[DECISION:\s*(?:APPROVED|DENIED).*?\]/gi, "")
    .trim();

  return { decision, duration, cooldown, openedApp, cleanReply };
}

function getSimulatedMentorReply(userPrompt: string): {
  reply: string;
  decision: "APPROVED" | "DENIED" | null;
  openedApp: { app_name: string; duration: number; task: string } | null;
  duration: number;
  cooldown: number;
} {
  const p = userPrompt.toLowerCase();
  const inferredApp = inferAppNameFromText(userPrompt);

  const hasValidPurpose =
    (p.includes("open") || p.includes("need") || p.includes("use") || p.includes("check") || p.includes("want to")) &&
    (p.includes("work") || p.includes("boss") || p.includes("manager") || p.includes("team") ||
      p.includes("client") || p.includes("code") || p.includes("pr") || p.includes("pull request") ||
      p.includes("tutorial") || p.includes("learn") || p.includes("study") || p.includes("lecture") ||
      p.includes("doctor") || p.includes("hospital") || p.includes("flight") || p.includes("ticket") ||
      p.includes("direction") || p.includes("route") || p.includes("emergency") || p.includes("urgent") ||
      p.includes("focus") || p.includes("note") || p.includes("idea") || p.includes("meeting") ||
      p.includes("schedule") || p.includes("address") || p.includes("class"));

  const isBoredomOrImpulse =
    p.includes("bored") || p.includes("scroll") || p.includes("reels") || p.includes("feed") ||
    p.includes("pass time") || p.includes("nothing to do") || p.includes("just check") ||
    p.includes("curious") || p.includes("kill time") || p.includes("distract");

  if (hasValidPurpose && !isBoredomOrImpulse) {
    return {
      reply: `That is a clear, valid reason and purposeful task. I am opening ${inferredApp} for you now. Keep your focus strictly on this task, ignore any notification bait, and put the phone back down the second you are done. You have 3 minutes.`,
      decision: "APPROVED",
      openedApp: {
        app_name: inferredApp,
        duration: 180,
        task: userPrompt
      },
      duration: 180,
      cooldown: 0
    };
  }

  if (isBoredomOrImpulse || ((p.includes("open") || p.includes("instagram") || p.includes("tiktok") || p.includes("twitter") || p.includes("reels")) && !hasValidPurpose)) {
    return {
      reply: `No. That is the mobile addiction talking—reaching for the screen the second your mind feels a quiet gap of boredom. Put the phone face down right now, take three slow deep breaths, and let the craving dissolve. What is the real task or presence you are avoiding?`,
      decision: "DENIED",
      openedApp: null,
      duration: 0,
      cooldown: 900
    };
  }

  return {
    reply: `I hear you. Remember why we are doing this: your phone is a tool, not your master. When an urge spikes, pause and observe it without obeying it. In that gap between impulse and action lies your true freedom.`,
    decision: null,
    openedApp: null,
    duration: 0,
    cooldown: 0
  };
}

// Multi-turn AI Stoic Chat endpoint with Search Grounding & Model Selection
app.post("/api/bargain/chat", async (req, res) => {
  const {
    package_name = "com.instagram.android",
    app_name = "Application",
    character_id = "satoshi",
    messages = [],
    model_name = "gemini-3.1-flash-lite",
    use_grounding = false,
    client_hour,
    client_time_str
  } = req.body;

  const timeInfo = getTimeOfDayContext(client_hour, client_time_str);
  const character = CHARACTER_SYSTEM_PROMPTS[character_id] || CHARACTER_SYSTEM_PROMPTS.satoshi;
  const ai = getAIClient();
  const lastUserPrompt = messages[messages.length - 1]?.content || "";

  const systemInstruction = `${character.prompt}

CURRENT CONTEXT & OBJECTIVE:
You are in dialogue with the user. Your main duty is to eliminate their mobile addiction and return them to real-world focus.
- Talk completely naturally, warmly, directly, and authentically. No corny martial-arts tropes or robotic phrases.
- When they request to open an app:
  * If they provide a valid reason and real purpose: approve and open the app! Emit [OPEN_APP: AppName, DURATION: 180, TASK: concise summary]
  * If it is boredom, mindless scrolling, or a weak excuse: deny naturally and kindly call out the dopamine trap. Emit [DECISION: DENIED, COOLDOWN: 900]
- If they ask for advice on breaking their screen addiction or staying focused, give practical stoic wisdom.`;

  if (ai && Array.isArray(messages) && messages.length > 0) {
    try {
      const contents = messages.map(m => ({
        role: m.role === "assistant" || m.role === "model" ? "model" : "user",
        parts: [{ text: String(m.content || "") }]
      }));

      const targetModel = use_grounding ? "gemini-3.5-flash" : (model_name || "gemini-3.1-flash-lite");
      const config: any = {
        systemInstruction
      };

      if (targetModel.includes("flash-lite")) {
        config.thinkingConfig = { thinkingLevel: ThinkingLevel.MINIMAL };
      }

      if (use_grounding) {
        config.tools = [{ googleSearch: {} }];
      }

      const response = await ai.models.generateContent({
        model: targetModel,
        contents,
        config
      });

      const rawText = response.text || "";
      const { decision, duration, cooldown, openedApp, cleanReply } = parseDecisionAndApp(rawText, lastUserPrompt);

      // Extract search grounding metadata if present
      const grounding = response.candidates?.[0]?.groundingMetadata;
      const searchQueries = grounding?.webSearchQueries || [];
      const sources: Array<{ title: string; uri: string }> = [];
      if (grounding?.groundingChunks) {
        for (const chunk of grounding.groundingChunks) {
          if (chunk.web?.uri) {
            sources.push({
              title: chunk.web.title || "Web Source",
              uri: chunk.web.uri
            });
          }
        }
      }

      if (decision) {
        logSession(
          package_name,
          character_id,
          lastUserPrompt || "Multi-turn negotiation",
          `Chat evaluation concluded with: ${decision}${openedApp ? ` (Opened: ${openedApp.app_name})` : ""}`,
          { decision, granted_duration_seconds: duration }
        );
      }

      return res.json({
        reply: cleanReply,
        decision,
        opened_app: openedApp,
        granted_duration_seconds: duration,
        cooldown_seconds: cooldown,
        grounded: Boolean(sources.length > 0 || searchQueries.length > 0),
        sources,
        queries: searchQueries,
        modelUsed: targetModel
      });
    } catch (aiErr) {
      console.warn("Gemini chat error, falling back to simulated conversational engine:", aiErr);
    }
  }

  // Fast simulated fallback
  const fallback = getSimulatedMentorReply(lastUserPrompt);
  return res.json({
    reply: fallback.reply,
    decision: fallback.decision,
    opened_app: fallback.openedApp,
    granted_duration_seconds: fallback.duration,
    cooldown_seconds: fallback.cooldown,
    grounded: false,
    sources: [],
    queries: [],
    modelUsed: "offline-mentor-core"
  });
});

// Fast Real-Time Streaming Chat Endpoint (Server-Sent Events)
app.post("/api/bargain/chat/stream", async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  if (typeof (res as any).flushHeaders === "function") {
    (res as any).flushHeaders();
  }

  const {
    package_name = "com.instagram.android",
    app_name = "Application",
    character_id = "satoshi",
    messages = [],
    model_name = "gemini-3.1-flash-lite",
    use_grounding = false,
    client_hour,
    client_time_str
  } = req.body;

  const timeInfo = getTimeOfDayContext(client_hour, client_time_str);
  const character = CHARACTER_SYSTEM_PROMPTS[character_id] || CHARACTER_SYSTEM_PROMPTS.satoshi;
  const ai = getAIClient();
  const lastUserPrompt = messages[messages.length - 1]?.content || "";

  const systemInstruction = `${character.prompt}

CURRENT CONTEXT & OBJECTIVE:
You are in dialogue with the user. Your main duty is to eliminate their mobile addiction and return them to real-world focus.
- Talk completely naturally, warmly, directly, and authentically. No corny martial-arts tropes or robotic phrases.
- When they request to open an app:
  * If they provide a valid reason and real purpose: approve and open the app! Emit [OPEN_APP: AppName, DURATION: 180, TASK: concise summary]
  * If it is boredom, mindless scrolling, or a weak excuse: deny naturally and kindly call out the dopamine trap. Emit [DECISION: DENIED, COOLDOWN: 900]
- If they ask for advice on breaking their screen addiction or staying focused, give practical stoic wisdom.`;

  if (!ai || !Array.isArray(messages) || messages.length === 0) {
    const fallback = getSimulatedMentorReply(lastUserPrompt);
    res.write("data: " + JSON.stringify({ type: "chunk", text: fallback.reply }) + "\n\n");
    res.write("data: " + JSON.stringify({
      type: "done",
      reply: fallback.reply,
      decision: fallback.decision,
      opened_app: fallback.openedApp,
      granted_duration_seconds: fallback.duration,
      cooldown_seconds: fallback.cooldown,
      grounded: false,
      sources: []
    }) + "\n\n");
    res.end();
    return;
  }

  try {
    const contents = messages.map(m => ({
      role: m.role === "assistant" || m.role === "model" ? "model" : "user",
      parts: [{ text: String(m.content || "") }]
    }));

    const targetModel = use_grounding ? "gemini-3.5-flash" : (model_name || "gemini-3.1-flash-lite");
    const config: any = {
      systemInstruction
    };

    if (targetModel.includes("flash-lite")) {
      config.thinkingConfig = { thinkingLevel: ThinkingLevel.MINIMAL };
    }

    if (use_grounding) {
      config.tools = [{ googleSearch: {} }];
    }

    const responseStream = await ai.models.generateContentStream({
      model: targetModel,
      contents,
      config
    });

    let accumulatedText = "";
    let searchQueries: string[] = [];
    let sources: Array<{ title: string; uri: string }> = [];

    for await (const chunk of responseStream) {
      const textPart = chunk.text || "";
      if (textPart) {
        accumulatedText += textPart;
        // Strip tags in real time if any appear mid-stream so the user only sees natural speech
        const sanitizedChunk = textPart.replace(/\[(?:OPEN_APP|DECISION):[^\]]*\]?/gi, "");
        if (sanitizedChunk) {
          res.write("data: " + JSON.stringify({ type: "chunk", text: sanitizedChunk }) + "\n\n");
        }
      }

      const gMeta = chunk.candidates?.[0]?.groundingMetadata;
      if (gMeta?.webSearchQueries) {
        searchQueries = gMeta.webSearchQueries;
      }
      if (gMeta?.groundingChunks) {
        for (const c of gMeta.groundingChunks) {
          if (c.web?.uri) {
            sources.push({
              title: c.web.title || "Web Source",
              uri: c.web.uri
            });
          }
        }
      }
    }

    // Process decision tags and app open
    const { decision, duration, cooldown, openedApp, cleanReply } = parseDecisionAndApp(accumulatedText, lastUserPrompt);

    if (decision) {
      logSession(
        package_name,
        character_id,
        lastUserPrompt || "Multi-turn streaming negotiation",
        `Streaming evaluation concluded with: ${decision}${openedApp ? ` (Opened: ${openedApp.app_name})` : ""}`,
        { decision, granted_duration_seconds: duration }
      );
    }

    res.write("data: " + JSON.stringify({
      type: "done",
      reply: cleanReply,
      decision,
      opened_app: openedApp,
      granted_duration_seconds: duration,
      cooldown_seconds: cooldown,
      grounded: Boolean(sources.length > 0 || searchQueries.length > 0),
      sources,
      queries: searchQueries,
      modelUsed: targetModel
    }) + "\n\n");
    res.end();
  } catch (err: any) {
    console.warn("Streaming error in chat:", err);
    const fallback = getSimulatedMentorReply(lastUserPrompt);
    res.write("data: " + JSON.stringify({ type: "chunk", text: fallback.reply }) + "\n\n");
    res.write("data: " + JSON.stringify({
      type: "done",
      reply: fallback.reply,
      decision: fallback.decision,
      opened_app: fallback.openedApp,
      granted_duration_seconds: fallback.duration,
      cooldown_seconds: fallback.cooldown,
      grounded: false,
      sources: []
    }) + "\n\n");
    res.end();
  }
});

// Audit recording
app.post("/api/audit/submit", (req, res) => {
  const { session_id, audit_passed, user_feedback } = req.body;
  const session = bargainSessions.find(s => s.id === session_id);
  if (session) {
    session.audit_completed = 1;
    session.audit_passed = audit_passed ? 1 : 0;
  }
  res.json({ success: true, session });
});

// History endpoint
app.get("/api/bargain/history", (_req, res) => {
  res.json({ sessions: bargainSessions });
});

// Custom Voice / High-Fidelity TTS generation endpoint
app.post("/api/tts", async (req, res) => {
  const { text, character_id = "satoshi" } = req.body;
  if (!text || typeof text !== "string") {
    return res.status(400).json({ error: "Missing text payload" });
  }

  const ai = getAIClient();
  if (!ai) {
    return res.status(503).json({ error: "AI client not initialized", fallbackToBrowser: true });
  }

  try {
    const isSatoshi = character_id === "satoshi";
    const voiceName = isSatoshi ? "Fenrir" : character_id === "vance" ? "Puck" : "Charon";

    // Directing instruction: for Master Satoshi, explicitly enforce deep, strong, slow, natural cadence
    const promptText = isSatoshi
      ? `Speak with an exceptionally deep, strong, resonant, slow, and natural masculine cadence with unhurried Zen mastery: "${text.trim()}"`
      : text.trim();

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: promptText }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName }
          }
        }
      }
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    const mimeType = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.mimeType || "audio/pcm;rate=24000";

    if (base64Audio) {
      return res.json({
        audioBase64: base64Audio,
        mimeType,
        sampleRate: 24000,
        voiceName,
        character_id
      });
    }

    return res.status(502).json({ error: "No audio stream returned", fallbackToBrowser: true });
  } catch (err: any) {
    console.warn("Gemini TTS synthesis note:", err.message);
    return res.status(500).json({ error: err.message, fallbackToBrowser: true });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: "/live" });

  wss.on("connection", async (clientWs) => {
    const ai = getAIClient();
    if (!ai) {
      clientWs.send(JSON.stringify({ error: "Gemini AI client not available" }));
      clientWs.close();
      return;
    }

    try {
      const session = await ai.live.connect({
        model: "gemini-3.8-live",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Charon" } }
          },
          systemInstruction: `You are Master Satoshi, the user's favourite stoic master.
Your main duty in life is to cure and eliminate the user's mobile addiction.
Speak completely naturally, calmly, directly, and warmly—like an authentic, wise mentor talking directly to them. Never sound robotic or like a cheesy martial-arts caricature.
When they ask to open an app:
- If they state a clear, valid reason and purposeful task (work message, directions, study, emergency), approve it naturally and grant access for a short focused window.
- If it is boredom, mindless scrolling, or a dopamine craving, gently but firmly deny it and guide them to put down the screen, take three deep breaths, and return to reality.`
        },
        callbacks: {
          onmessage: (message: any) => {
            const audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audio) {
              clientWs.send(JSON.stringify({ audio }));
            }
            if (message.serverContent?.interrupted) {
              clientWs.send(JSON.stringify({ interrupted: true }));
            }
          },
          onclose: () => {
            try {
              clientWs.close();
            } catch (_) {}
          }
        }
      });

      clientWs.on("message", (data) => {
        try {
          const parsed = JSON.parse(data.toString());
          if (parsed.audio) {
            session.sendRealtimeInput({
              audio: { data: parsed.audio, mimeType: "audio/pcm;rate=16000" }
            });
          }
          if (parsed.text) {
            session.sendClientContent({
              turns: [{ role: "user", parts: [{ text: parsed.text }] }],
              turnComplete: true
            });
          }
        } catch (err) {
          console.warn("Live API client input parsing warning:", err);
        }
      });

      clientWs.on("close", () => {
        try {
          session.close();
        } catch (_) {}
      });
    } catch (err: any) {
      console.warn("Live API connection initialization error:", err.message);
      clientWs.send(JSON.stringify({ error: err.message || "Failed to initialize Live API session" }));
      clientWs.close();
    }
  });

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Master Satoshi Stoic Gatekeeper server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
