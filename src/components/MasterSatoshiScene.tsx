import React, { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import masterSatoshiImg from "../assets/images/master_satoshi_portrait_1790108678855.jpg";

export type MasterExpression = "idle" | "listening" | "evaluating" | "speaking" | "denied" | "approved";

interface MasterSatoshiSceneProps {
  expression: MasterExpression;
}

export const MasterSatoshiScene: React.FC<MasterSatoshiSceneProps> = ({ expression }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoLoaded, setVideoLoaded] = useState<boolean>(false);

  // Sync video playback based on expression
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Ensure video is playing
    video.play().catch(() => {
      // Autoplay with audio muted is allowed by all modern browsers
    });

    if (expression === "speaking") {
      video.playbackRate = 1.15;
    } else if (expression === "evaluating") {
      video.playbackRate = 0.85;
    } else {
      video.playbackRate = 1.0;
    }
  }, [expression]);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden select-none pointer-events-none bg-black">
      {/* 1. Base Static Image Fallback (Instantly Visible) */}
      <div
        className="absolute inset-0 w-full h-full bg-cover bg-no-repeat grayscale contrast-110 brightness-100"
        style={{
          backgroundImage: `url(${masterSatoshiImg})`,
          backgroundPosition: "center 22%"
        }}
      />

      {/* 2. Character Animation Video in the Dark (Looping MP4) */}
      <motion.div
        className="absolute inset-0 w-full h-full"
        animate={{
          scale:
            expression === "evaluating"
              ? 1.02
              : expression === "speaking"
              ? 1.015
              : expression === "denied"
              ? 1.03
              : expression === "approved"
              ? 1.008
              : 1,
          y: expression === "speaking" ? [0, -2, 0] : 0
        }}
        transition={{
          scale: { duration: 0.5, ease: "easeInOut" },
          y: { duration: 0.7, repeat: expression === "speaking" ? Infinity : 0, ease: "easeInOut" }
        }}
      >
        <video
          ref={videoRef}
          src="/satoshi_dark_animation.mp4"
          autoPlay
          loop
          muted
          playsInline
          poster={masterSatoshiImg}
          onLoadedData={() => setVideoLoaded(true)}
          className={`absolute inset-0 w-full h-full object-cover grayscale contrast-110 brightness-100 transition-opacity duration-700 ${
            videoLoaded ? "opacity-100" : "opacity-90"
          }`}
          style={{
            objectPosition: "center 22%"
          }}
        />
      </motion.div>

      {/* 3. Atmospheric Dark Room Vignette: Soft at top and bottom to frame character */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/85 via-black/35 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black via-black/70 to-transparent pointer-events-none" />
      <div className="absolute inset-0 shadow-[inset_0_0_80px_rgba(0,0,0,0.65)] pointer-events-none" />

      {/* 4. Subtle Expression Atmosphere Reactivity */}
      <motion.div
        className="absolute inset-0 pointer-events-none transition-opacity duration-700"
        animate={{
          opacity: expression === "denied" ? 0.3 : expression === "approved" ? 0.05 : 0
        }}
        style={{ backgroundColor: "#000000" }}
      />

      {/* 5. Ambient Floating Dust Motes in the Dark */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <span className="absolute top-1/4 left-1/3 w-1 h-1 rounded-full bg-white/40 blur-[0.5px] animate-pulse" />
        <span className="absolute top-1/3 right-1/4 w-1.5 h-1.5 rounded-full bg-white/30 blur-[0.5px] animate-pulse [animation-delay:1.5s]" />
        <span className="absolute top-1/2 left-1/5 w-1 h-1 rounded-full bg-white/40 blur-[0.5px] animate-pulse [animation-delay:3s]" />
        <span className="absolute top-2/3 right-1/3 w-1.5 h-1.5 rounded-full bg-white/30 blur-[0.5px] animate-pulse [animation-delay:2.2s]" />
      </div>
    </div>
  );
};
