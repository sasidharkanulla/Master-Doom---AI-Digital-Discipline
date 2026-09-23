import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  serverTimestamp,
  updateDoc
} from "firebase/firestore";
import { db, User } from "./config";

export interface UserProfileData {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  stoicScore: number;
  streakDays: number;
  totalReflections: number;
  createdAt: string;
  lastActive: string;
}

export interface StoredMessage {
  id: string;
  userId: string;
  role: "user" | "model" | "master";
  content: string;
  timestamp: string;
  mode?: string;
  grounded?: boolean;
  sources?: string;
}

export async function syncUserProfile(user: User): Promise<UserProfileData> {
  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);

  if (snap.exists()) {
    const data = snap.data() as UserProfileData;
    const now = new Date().toISOString();
    await updateDoc(userRef, {
      lastActive: now,
      displayName: user.displayName || data.displayName || "Stoic Practitioner",
      photoURL: user.photoURL || data.photoURL || ""
    });
    return {
      ...data,
      lastActive: now
    };
  } else {
    const now = new Date().toISOString();
    const newProfile: UserProfileData = {
      id: user.uid,
      email: user.email || "",
      displayName: user.displayName || "Stoic Practitioner",
      photoURL: user.photoURL || "",
      stoicScore: 85,
      streakDays: 1,
      totalReflections: 0,
      createdAt: now,
      lastActive: now
    };
    await setDoc(userRef, newProfile);
    return newProfile;
  }
}

export async function updateStoicScore(userId: string, newScore: number): Promise<void> {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      stoicScore: Math.min(100, Math.max(0, Math.round(newScore))),
      lastActive: new Date().toISOString()
    });
  } catch (err) {
    console.warn("Failed to persist stoic score to Firestore:", err);
  }
}

export async function saveMessageToFirestore(userId: string, message: StoredMessage): Promise<void> {
  try {
    const msgRef = doc(db, "users", userId, "messages", message.id);
    await setDoc(msgRef, {
      id: message.id,
      userId,
      role: message.role,
      content: message.content,
      timestamp: message.timestamp || new Date().toISOString(),
      mode: message.mode || "chat",
      grounded: Boolean(message.grounded),
      sources: message.sources || ""
    });
  } catch (err) {
    console.warn("Failed to save message to Firestore:", err);
  }
}

export async function loadRecentMessages(userId: string, max: number = 30): Promise<StoredMessage[]> {
  try {
    const messagesRef = collection(db, "users", userId, "messages");
    const q = query(messagesRef, orderBy("timestamp", "asc"), limit(max));
    const snapshot = await getDocs(q);
    const msgs: StoredMessage[] = [];
    snapshot.forEach(docSnap => {
      msgs.push(docSnap.data() as StoredMessage);
    });
    return msgs;
  } catch (err) {
    console.warn("Failed to load messages from Firestore:", err);
    return [];
  }
}
