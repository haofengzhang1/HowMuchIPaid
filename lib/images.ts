export const AVATAR_MAX_BYTES = 200_000;
export const CHAT_BG_MAX_BYTES = 400_000;

const DATA_URL = /^data:(image\/jpeg|image\/png|image\/webp);base64,([A-Za-z0-9+/=\s]+)$/;

export function parseImageDataUrl(value: string, maxBytes: number) {
  const match = DATA_URL.exec(value.trim());
  if (!match) return null;
  const mime = match[1];
  const bytes = Buffer.from(match[2], "base64");
  if (bytes.length < 32 || bytes.length > maxBytes) return null;
  return { mime, bytes };
}

export const CHAT_BG_COLORS = [
  { id: "default", value: "" },
  { id: "paper", value: "#f4f4f1" },
  { id: "blue", value: "#d7e4f5" },
  { id: "green", value: "#e3eee4" },
  { id: "sand", value: "#f3e6d4" },
  { id: "lilac", value: "#ebe4f4" },
  { id: "night", value: "#1c2430" },
] as const;

export function isChatBgColor(value: string) {
  return CHAT_BG_COLORS.some((color) => color.value === value);
}
