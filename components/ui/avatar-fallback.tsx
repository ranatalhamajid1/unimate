import React from "react";

interface AvatarFallbackProps {
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const GRADIENT_PALETTES = [
  "from-blue-600 to-indigo-600",
  "from-indigo-600 to-violet-600",
  "from-violet-600 to-purple-600",
  "from-emerald-600 to-teal-600",
  "from-teal-600 to-cyan-600",
  "from-amber-600 to-orange-600",
  "from-rose-600 to-pink-600",
];

export function AvatarFallback({ name, size = "md", className = "" }: AvatarFallbackProps) {
  // Deterministic initials extraction
  const cleanName = name?.trim() || "User";
  const parts = cleanName.split(/\s+/).filter(Boolean);
  let initials = "U";
  if (parts.length >= 2) {
    initials = `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  } else if (parts.length === 1 && parts[0].length > 0) {
    initials = parts[0].slice(0, 2).toUpperCase();
  }

  // Deterministic palette index based on name hash
  let hash = 0;
  for (let i = 0; i < cleanName.length; i++) {
    hash = (hash << 5) - hash + cleanName.charCodeAt(i);
    hash |= 0;
  }
  const paletteIndex = Math.abs(hash) % GRADIENT_PALETTES.length;
  const gradient = GRADIENT_PALETTES[paletteIndex];

  const sizeClasses = {
    sm: "h-8 w-8 text-xs font-semibold rounded-lg",
    md: "h-11 w-11 text-sm font-bold rounded-xl",
    lg: "h-16 w-16 text-xl font-bold rounded-2xl",
    xl: "h-24 w-24 text-3xl font-extrabold rounded-3xl",
  }[size];

  return (
    <div
      className={`inline-flex shrink-0 items-center justify-center bg-gradient-to-br ${gradient} text-white shadow-xs select-none ${sizeClasses} ${className}`}
      aria-label={`${name}'s avatar`}
    >
      <span>{initials}</span>
    </div>
  );
}
