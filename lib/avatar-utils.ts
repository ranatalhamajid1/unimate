/**
 * Avatar utility helpers for deterministic initials and color generation.
 */

const PALETTES = [
  "#2563EB", // Blue
  "#4F46E5", // Indigo
  "#7C3AED", // Violet
  "#059669", // Emerald
  "#0891B2", // Cyan
  "#D97706", // Amber
  "#E11D48", // Rose
  "#9333EA", // Purple
];

export function getInitials(name?: string | null): string {
  if (!name || !name.trim()) return "U";
  const cleanName = name.trim();
  const parts = cleanName.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  if (parts.length === 1 && parts[0].length > 0) {
    return parts[0].slice(0, Math.min(2, parts[0].length)).toUpperCase();
  }
  return "U";
}

export function getAvatarColor(name?: string | null): string {
  const cleanName = (name || "").trim() || "User";
  let hash = 0;
  for (let i = 0; i < cleanName.length; i++) {
    hash = (hash << 5) - hash + cleanName.charCodeAt(i);
    hash |= 0;
  }
  return PALETTES[Math.abs(hash) % PALETTES.length];
}
