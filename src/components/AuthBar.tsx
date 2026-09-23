import React from "react";
import { User } from "firebase/auth";
import { LogIn, LogOut, ShieldCheck, Flame } from "lucide-react";
import { auth, googleProvider, signInWithPopup, fbSignOut } from "../firebase/config";
import { UserProfileData } from "../firebase/userStore";

interface AuthBarProps {
  user: User | null;
  profile: UserProfileData | null;
  onUserChanged: (user: User | null) => void;
}

export const AuthBar: React.FC<AuthBarProps> = ({ user, profile, onUserChanged }) => {
  const handleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      onUserChanged(result.user);
    } catch (err: any) {
      console.warn("Google sign-in canceled or failed:", err.message);
    }
  };

  const handleSignOut = async () => {
    try {
      await fbSignOut(auth);
      onUserChanged(null);
    } catch (err) {
      console.warn("Sign-out failed:", err);
    }
  };

  if (!user) {
    return (
      <button
        onClick={handleSignIn}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-transparent hover:bg-white/10 text-white border border-white/30 text-xs font-mono tracking-wide transition-all shadow-md active:scale-95"
      >
        <LogIn className="w-3.5 h-3.5 text-white" />
        <span className="text-white">Sign in</span>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-transparent border border-white/20 shadow-lg text-white">
      {user.photoURL ? (
        <img
          src={user.photoURL}
          alt={user.displayName || "User"}
          referrerPolicy="no-referrer"
          className="w-5 h-5 rounded-full border border-white/40 object-cover grayscale"
        />
      ) : (
        <div className="w-5 h-5 rounded-full bg-transparent text-white flex items-center justify-center text-[10px] font-bold border border-white">
          {(user.displayName || "S").charAt(0).toUpperCase()}
        </div>
      )}

      <div className="hidden sm:flex flex-col text-left">
        <span className="text-xs font-mono font-medium text-white truncate max-w-[100px]">
          {user.displayName || "Practitioner"}
        </span>
        <span className="text-[9px] font-mono text-white/70 flex items-center gap-0.5">
          <Flame className="w-2.5 h-2.5 text-white" />
          {profile?.streakDays || 1}d streak
        </span>
      </div>

      <button
        onClick={handleSignOut}
        className="p-1 rounded-lg hover:bg-white/10 text-white transition-colors ml-1"
        title="Sign Out"
      >
        <LogOut className="w-3.5 h-3.5 text-white" />
      </button>
    </div>
  );
};
