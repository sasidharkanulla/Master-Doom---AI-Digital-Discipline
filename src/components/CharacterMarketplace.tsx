import React, { useState } from "react";
import { UserCheck, Lock, Unlock, Volume2, Sparkles, Check, Play } from "lucide-react";
import { CharacterProfile } from "../types";
import { MasterSatoshiVisual } from "./MasterSatoshiVisual";
import { soundEngine } from "../utils/audio";

interface CharacterMarketplaceProps {
  characters: CharacterProfile[];
  activeCharacterId: string;
  onSelectCharacter: (charId: string) => void;
  onUnlockCharacter: (charId: string) => void;
}

export const CharacterMarketplace: React.FC<CharacterMarketplaceProps> = ({
  characters,
  activeCharacterId,
  onSelectCharacter,
  onUnlockCharacter
}) => {
  const [previewCharId, setPreviewCharId] = useState<string>(activeCharacterId);

  const activeChar = characters.find(c => c.character_id === activeCharacterId) || characters[0];
  const previewChar = characters.find(c => c.character_id === previewCharId) || activeChar;

  const handleTestVoice = (char: CharacterProfile) => {
    soundEngine.speakDialogue(char.quote, char.character_id);
  };

  return (
    <div className="space-y-6 text-zinc-100 select-none pb-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono mb-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          SECTION 2 & 3: CHARACTER PROFILES & PERSONA PIPELINE
        </div>
        <h2 className="text-xl sm:text-2xl font-bold font-sans tracking-tight text-zinc-100">
          Gatekeeper Character Profiles & Marketplace
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
          Select or unlock specialized gatekeeper archetypes, each with distinct strict system prompts, SSML vocal timbres, and finite state behaviors.
        </p>
      </div>

      {/* Active Character Spotlight */}
      <div className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-2xl flex flex-col md:flex-row items-center gap-6">
        <div className="flex-shrink-0">
          <MasterSatoshiVisual state="IDLE" characterId={previewChar.character_id} />
        </div>

        <div className="flex-1 space-y-3 text-center md:text-left">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
            <h3 className="text-xl font-bold font-serif text-zinc-100">
              {previewChar.display_name}
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-mono">
              {previewChar.archetype}
            </span>
            {previewChar.character_id === activeCharacterId && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-mono font-bold flex items-center gap-1">
                <Check className="w-3 h-3" /> ACTIVE GATEKEEPER
              </span>
            )}
          </div>

          <p className="text-xs text-zinc-300 italic">
            "{previewChar.quote}"
          </p>

          <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-[11px] font-mono text-zinc-400 space-y-1.5">
            <div className="flex justify-between text-zinc-500">
              <span>VOICE SYNTHESIS PIPELINE</span>
              <span>VOCAL PROFILE</span>
            </div>
            <div className="flex justify-between text-zinc-200">
              <span>Engine: {previewChar.voice_id}</span>
              <span>Rate: {previewChar.ssml_rate} • Pitch: {previewChar.ssml_pitch}</span>
            </div>
            {previewChar.voice_traits && (
              <div className="pt-1 border-t border-zinc-900 text-[10px] text-amber-400/90 flex items-center gap-1">
                <Volume2 className="w-3 h-3 text-amber-400" />
                <span>{previewChar.voice_traits}</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-1">
            <button
              onClick={() => handleTestVoice(previewChar)}
              className="px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-xs font-medium text-amber-300 flex items-center gap-1.5 transition-colors"
              title="Test custom deep voice"
            >
              <Play className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              Test Voice Sample (Deep & Slow)
            </button>

            {previewChar.is_unlocked ? (
              <button
                onClick={() => onSelectCharacter(previewChar.character_id)}
                disabled={previewChar.character_id === activeCharacterId}
                className={`px-4 py-2 rounded-xl text-xs font-bold font-mono uppercase tracking-wider transition-all ${
                  previewChar.character_id === activeCharacterId
                    ? "bg-zinc-800 text-zinc-500 cursor-default"
                    : "bg-amber-500 text-zinc-950 hover:bg-amber-400 shadow-md shadow-amber-500/20"
                }`}
              >
                {previewChar.character_id === activeCharacterId ? "Active" : "Deploy Persona"}
              </button>
            ) : (
              <button
                onClick={() => onUnlockCharacter(previewChar.character_id)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-zinc-950 font-bold text-xs font-mono uppercase tracking-wider shadow-md hover:brightness-110 flex items-center gap-1.5"
              >
                <Unlock className="w-3.5 h-3.5" />
                Unlock Persona (${previewChar.price_usd.toFixed(2)})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Character Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {characters.map(char => {
          const isSelected = char.character_id === previewCharId;
          const isActive = char.character_id === activeCharacterId;

          return (
            <div
              key={char.character_id}
              onClick={() => setPreviewCharId(char.character_id)}
              className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                isSelected
                  ? "bg-zinc-900 border-amber-500/80 shadow-lg shadow-amber-500/10"
                  : "bg-zinc-900/60 border-zinc-800 hover:border-zinc-700"
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-200">{char.display_name}</span>
                  {char.is_unlocked ? (
                    isActive ? (
                      <span className="text-[10px] font-mono text-emerald-400 font-bold">DEPLOYED</span>
                    ) : (
                      <span className="text-[10px] font-mono text-zinc-500">UNLOCKED</span>
                    )
                  ) : (
                    <div className="flex items-center gap-1 text-[10px] font-mono text-amber-400">
                      <Lock className="w-3 h-3" />
                      <span>${char.price_usd.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                <div className="text-[11px] font-mono text-amber-500/80 uppercase">
                  {char.archetype}
                </div>

                <p className="text-[11px] text-zinc-400 line-clamp-3">
                  {char.quote}
                </p>
              </div>

              <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between mt-3 text-[10px] font-mono">
                <span className="text-zinc-500">Voice: {char.ssml_rate}</span>
                <span className="text-amber-400 underline">Inspect Details</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
