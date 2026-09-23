import React from "react";
import {
  Instagram,
  Video,
  Twitter,
  Youtube,
  MessageSquare,
  MessageCircle,
  Phone,
  Camera,
  Calendar,
  ShieldCheck,
  Sparkles
} from "lucide-react";

interface AppIconProps {
  iconName: string;
  className?: string;
}

export const AppIcon: React.FC<AppIconProps> = ({ iconName, className = "w-6 h-6" }) => {
  switch (iconName) {
    case "Instagram":
      return <Instagram className={className} />;
    case "Video":
      return <Video className={className} />;
    case "Twitter":
      return <Twitter className={className} />;
    case "Youtube":
      return <Youtube className={className} />;
    case "MessageSquare":
      return <MessageSquare className={className} />;
    case "MessageCircle":
      return <MessageCircle className={className} />;
    case "Phone":
      return <Phone className={className} />;
    case "Camera":
      return <Camera className={className} />;
    case "Calendar":
      return <Calendar className={className} />;
    case "ShieldCheck":
      return <ShieldCheck className={className} />;
    default:
      return <Sparkles className={className} />;
  }
};
