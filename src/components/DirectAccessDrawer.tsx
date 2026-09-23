import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Plus,
  Trash2,
  Play,
  Lock,
  Search,
  ShieldAlert,
  Sparkles,
  Info,
  Clock,
  ExternalLink,
  ChevronDown,
  AlertCircle
} from "lucide-react";
import { DirectAccessApp } from "../types";
import { AVAILABLE_CATALOG_APPS } from "../data/initialData";
import { AppIcon } from "./AppIcon";
import { AuthBar } from "./AuthBar";
import { User } from "../firebase/config";
import { UserProfileData } from "../firebase/userStore";

interface DirectAccessDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  directApps: DirectAccessApp[];
  user?: User | null;
  profile?: UserProfileData | null;
  stoicScore?: number;
  onUserChanged?: (user: User | null) => void;
  onAddDirectApp: (app: {
    package_name: string;
    app_name: string;
    category: "Productivity" | "Utility" | "Reading" | "Tools" | "Health" | "Work";
    icon_name: string;
  }) => void;
  onRemoveDirectApp: (packageName: string) => void;
  onLaunchDirectApp: (app: DirectAccessApp) => void;
  onRequestSocialMediaUnlock: (app: {
    package_name: string;
    app_name: string;
    icon_name: string;
    category: string;
  }) => void;
}

export const DirectAccessDrawer: React.FC<DirectAccessDrawerProps> = ({
  isOpen,
  onClose,
  directApps,
  user,
  profile,
  stoicScore,
  onUserChanged,
  onAddDirectApp,
  onRemoveDirectApp,
  onLaunchDirectApp,
  onRequestSocialMediaUnlock
}) => {
  const [activeTab, setActiveTab] = useState<"my_apps" | "add_app">("my_apps");
  const [searchQuery, setSearchQuery] = useState("");
  const [customAppName, setCustomAppName] = useState("");
  const [customCategory, setCustomCategory] = useState<
    "Productivity" | "Utility" | "Reading" | "Tools" | "Health" | "Work"
  >("Productivity");
  const [socialMediaWarning, setSocialMediaWarning] = useState<string | null>(null);

  const directPackageSet = new Set(directApps.map((a) => a.package_name));

  // Catalog items filtered
  const filteredCatalog = AVAILABLE_CATALOG_APPS.filter((item) =>
    item.app_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCatalogAdd = (item: typeof AVAILABLE_CATALOG_APPS[0]) => {
    if (item.is_social_media) {
      setSocialMediaWarning(
        `"${item.app_name}" is a Social Media application. Under Master Satoshi's discipline rules, social media cannot be added to direct access. You must state a valid reason to unlock it.`
      );
      return;
    }

    if (directPackageSet.has(item.package_name)) {
      return;
    }

    onAddDirectApp({
      package_name: item.package_name,
      app_name: item.app_name,
      category: item.category as any,
      icon_name: item.icon_name
    });
    setSocialMediaWarning(null);
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customAppName.trim();
    if (!trimmed) return;

    // Check if custom app is a social media app
    const lower = trimmed.toLowerCase();
    const socialKeywords = ["instagram", "tiktok", "twitter", "x", "reddit", "facebook", "snapchat", "youtube shorts"];
    const isSocial = socialKeywords.some((kw) => lower.includes(kw));

    if (isSocial) {
      setSocialMediaWarning(
        `"${trimmed}" appears to be a Social Media platform. Social media apps are strictly restricted and cannot bypass Master Satoshi with direct access. State a valid reason to request timed access.`
      );
      return;
    }

    const pkg = `custom.${trimmed.toLowerCase().replace(/\s+/g, ".")}`;
    onAddDirectApp({
      package_name: pkg,
      app_name: trimmed,
      category: customCategory,
      icon_name: "Zap"
    });

    setCustomAppName("");
    setSocialMediaWarning(null);
    setActiveTab("my_apps");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Drawer Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="relative z-10 w-full max-w-2xl mx-auto rounded-t-3xl bg-black/95 border-t border-x border-white/30 p-5 sm:p-6 shadow-2xl flex flex-col max-h-[85vh] text-white backdrop-blur-2xl"
          >
            {/* Top Drag Handle & Close */}
            <div className="flex items-center justify-between pb-3 border-b border-white/20 gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-2 h-2 rounded-full bg-white animate-pulse flex-shrink-0" />
                <span className="text-xs font-mono uppercase tracking-widest text-white font-semibold truncate">
                  Direct Apps
                </span>
                {typeof stoicScore === "number" && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-white/30 text-white/80 hidden sm:inline">
                    Score: {stoicScore}/100
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {user !== undefined && onUserChanged && (
                  <AuthBar user={user} profile={profile || null} onUserChanged={onUserChanged} />
                )}
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-xl bg-transparent hover:bg-white/10 text-white border border-white/20 transition-colors"
                  title="Close drawer"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>

            {/* Philosophy Explainer Banner */}
            <div className="mt-3 p-3 rounded-xl bg-transparent border border-white/20 text-xs font-serif leading-relaxed text-white flex items-start gap-2.5">
              <Info className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
              <div className="text-white">
                <p className="text-white">
                  <strong>Direct Access:</strong> Use productive & utility apps immediately without upfront permission.
                  If your session extends past <strong>15 minutes</strong>, you will simply be asked to state your ongoing purpose (no rigid denial).
                </p>
                <p className="text-white/80 mt-1 font-sans text-[11px]">
                  <strong>Strict Social Media Rule:</strong> Social media platforms are locked and require stating a verified reason to Master Satoshi.
                </p>
              </div>
            </div>

            {/* Warning Banner if user tries to bypass social media */}
            {socialMediaWarning && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 p-3 rounded-xl bg-transparent border border-white/60 text-xs font-mono text-white flex items-start justify-between gap-3"
              >
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                  <span className="text-white">{socialMediaWarning}</span>
                </div>
                <button
                  onClick={() => setSocialMediaWarning(null)}
                  className="p-1 rounded text-white hover:bg-white/10"
                >
                  <X className="w-3.5 h-3.5 text-white" />
                </button>
              </motion.div>
            )}

            {/* Tabs Header */}
            <div className="flex items-center gap-2 mt-4 pb-1 border-b border-white/20 text-xs font-mono">
              <button
                onClick={() => {
                  setActiveTab("my_apps");
                  setSocialMediaWarning(null);
                }}
                className={`px-3 py-1.5 rounded-xl border transition-colors flex items-center gap-1.5 ${
                  activeTab === "my_apps"
                    ? "bg-transparent text-white font-bold border-white"
                    : "bg-transparent text-white/60 hover:text-white border-transparent"
                }`}
              >
                <span>My Direct Apps</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full border border-white/30">
                  {directApps.length}
                </span>
              </button>

              <button
                onClick={() => {
                  setActiveTab("add_app");
                  setSocialMediaWarning(null);
                }}
                className={`px-3 py-1.5 rounded-xl border transition-colors flex items-center gap-1.5 ${
                  activeTab === "add_app"
                    ? "bg-transparent text-white font-bold border-white"
                    : "bg-transparent text-white/60 hover:text-white border-transparent"
                }`}
              >
                <Plus className="w-3.5 h-3.5 text-white" />
                <span>Add App to Direct Access</span>
              </button>
            </div>

            {/* TAB 1: MY DIRECT APPS & RESTRICTED SOCIAL MEDIA */}
            {activeTab === "my_apps" && (
              <div className="overflow-y-auto mt-4 space-y-5 pr-1 flex-1">
                {/* Section A: Direct Access Apps */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono uppercase tracking-wider text-white">
                      Direct Access Apps (No Upfront Permission)
                    </span>
                    <span className="text-[10px] font-mono text-white/60">
                      15m session threshold
                    </span>
                  </div>

                  {directApps.length === 0 ? (
                    <div className="p-6 text-center border border-white/20 rounded-2xl bg-transparent">
                      <p className="text-sm font-serif text-white">
                        No direct access apps configured yet.
                      </p>
                      <button
                        onClick={() => setActiveTab("add_app")}
                        className="mt-3 px-4 py-1.5 rounded-xl bg-transparent hover:bg-white/10 text-white border border-white/40 text-xs font-mono"
                      >
                        + Add Your First App
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {directApps.map((app) => (
                        <div
                          key={app.package_name}
                          className="flex items-center justify-between p-3 rounded-2xl bg-transparent border border-white/30 hover:border-white/60 transition-all text-white group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-transparent border border-white/30 flex items-center justify-center text-white">
                              <AppIcon iconName={app.icon_name} className="w-4 h-4 text-white" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-sans font-semibold text-white truncate">
                                {app.app_name}
                              </div>
                              <div className="text-[10px] font-mono text-white/60">
                                {app.category} • Direct
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <button
                              onClick={() => onLaunchDirectApp(app)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-transparent hover:bg-white/10 text-white border border-white/50 hover:border-white text-xs font-mono transition-colors font-medium"
                              title="Launch without permission"
                            >
                              <Play className="w-3 h-3 text-white fill-white" />
                              <span>Launch</span>
                            </button>

                            <button
                              onClick={() => onRemoveDirectApp(app.package_name)}
                              className="p-1.5 rounded-xl bg-transparent hover:bg-white/10 text-white/60 hover:text-white border border-transparent hover:border-white/20 transition-colors"
                              title="Remove from direct access"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-white" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Section B: Restricted Social Media Apps */}
                <div className="pt-2 border-t border-white/20">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5 text-white" />
                      <span className="text-xs font-mono uppercase tracking-wider text-white">
                        Restricted: Social Media
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-white/70">
                      Requires Valid Reason
                    </span>
                  </div>

                  <p className="text-[11px] font-serif text-white/70 mb-3">
                    Social media platforms cannot be used without permission. Master Satoshi requires a verified, valid duty before unlocking.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {AVAILABLE_CATALOG_APPS.filter((a) => a.is_social_media).map((socialApp) => (
                      <div
                        key={socialApp.package_name}
                        className="flex items-center justify-between p-3 rounded-2xl bg-transparent border border-white/30 text-white"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-transparent border border-white/30 flex items-center justify-center text-white">
                            <AppIcon iconName={socialApp.icon_name} className="w-4 h-4 text-white" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-sans font-semibold text-white truncate">
                              {socialApp.app_name}
                            </div>
                            <div className="text-[10px] font-mono text-white/60 flex items-center gap-1">
                              <Lock className="w-2.5 h-2.5 text-white" />
                              <span>Restricted</span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => onRequestSocialMediaUnlock(socialApp)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-transparent hover:bg-white/10 text-white border border-white/60 hover:border-white text-xs font-mono transition-colors font-semibold"
                        >
                          <Sparkles className="w-3 h-3 text-white" />
                          <span>Unlock</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: ADD APP FROM CATALOG OR CUSTOM */}
            {activeTab === "add_app" && (
              <div className="overflow-y-auto mt-4 space-y-4 pr-1 flex-1">
                {/* Search in Catalog */}
                <div className="relative">
                  <Search className="w-4 h-4 text-white/50 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search apps (Notion, Slack, Books, Maps...)"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-transparent border border-white/30 text-xs font-serif text-white placeholder-white/40 focus:outline-none focus:border-white"
                  />
                </div>

                {/* Catalog App Grid */}
                <div>
                  <span className="text-xs font-mono uppercase tracking-wider text-white block mb-2">
                    Popular Productive Apps
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {filteredCatalog.map((item) => {
                      const isAdded = directPackageSet.has(item.package_name);
                      const isSocial = Boolean(item.is_social_media);

                      return (
                        <div
                          key={item.package_name}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-transparent border border-white/20 text-white"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-transparent border border-white/30 flex items-center justify-center text-white">
                              <AppIcon iconName={item.icon_name} className="w-4 h-4 text-white" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-sans font-medium text-white truncate">
                                {item.app_name}
                              </div>
                              <div className="text-[10px] font-mono text-white/60">
                                {item.category} {isSocial && "• Locked"}
                              </div>
                            </div>
                          </div>

                          {isSocial ? (
                            <button
                              onClick={() => handleCatalogAdd(item)}
                              className="px-2.5 py-1 rounded-lg bg-transparent hover:bg-white/10 text-white/70 hover:text-white border border-white/20 text-[10px] font-mono flex items-center gap-1"
                              title="Social media is restricted"
                            >
                              <Lock className="w-2.5 h-2.5 text-white" />
                              <span>Restricted</span>
                            </button>
                          ) : isAdded ? (
                            <span className="text-[10px] font-mono text-white/50 px-2 py-1">
                              Added
                            </span>
                          ) : (
                            <button
                              onClick={() => handleCatalogAdd(item)}
                              className="px-2.5 py-1 rounded-lg bg-transparent hover:bg-white/10 text-white border border-white/40 hover:border-white text-[10px] font-mono flex items-center gap-1 transition-colors"
                            >
                              <Plus className="w-3 h-3 text-white" />
                              <span>Add</span>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Add Custom App Form */}
                <div className="pt-3 border-t border-white/20">
                  <span className="text-xs font-mono uppercase tracking-wider text-white block mb-2">
                    Add Any Custom App Name
                  </span>
                  <form onSubmit={handleAddCustom} className="space-y-2.5">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={customAppName}
                        onChange={(e) => setCustomAppName(e.target.value)}
                        placeholder="e.g. Duolingo, Anki, Obsidian, Figma..."
                        className="flex-1 px-3 py-2 rounded-xl bg-transparent border border-white/30 text-xs font-serif text-white placeholder-white/40 focus:outline-none focus:border-white"
                      />
                      <select
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value as any)}
                        className="px-3 py-2 rounded-xl bg-black border border-white/30 text-xs font-mono text-white focus:outline-none"
                      >
                        <option value="Productivity" className="bg-black text-white">Productivity</option>
                        <option value="Work" className="bg-black text-white">Work</option>
                        <option value="Reading" className="bg-black text-white">Reading</option>
                        <option value="Tools" className="bg-black text-white">Tools</option>
                        <option value="Utility" className="bg-black text-white">Utility</option>
                        <option value="Health" className="bg-black text-white">Health</option>
                      </select>
                      <button
                        type="submit"
                        disabled={!customAppName.trim()}
                        className="px-4 py-2 rounded-xl bg-transparent hover:bg-white/10 disabled:opacity-30 text-white border border-white font-mono text-xs font-semibold transition-colors"
                      >
                        Add App
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
