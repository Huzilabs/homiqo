export const formatPrice = (n: number | string) =>
  "Rs " + Number(n).toLocaleString("en-PK", { maximumFractionDigits: 0 });

export const formatDate = (d: string) =>
  new Date(d).toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Karachi" });

export const discountPercent = (price: number, compareAt: number | null) =>
  compareAt && compareAt > price ? Math.round(((compareAt - price) / compareAt) * 100) : 0;

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** Returns the YouTube video id for youtube.com / youtu.be / shorts links, else null. */
export const youTubeId = (url: string): string | null => {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  return m ? m[1] : null;
};

export const STATUS_LABEL: Record<string, string> = {
  pending: "Order placed",
  confirmed: "Confirmed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 ring-amber-500/40",
  confirmed: "bg-blue-100 text-blue-800 ring-blue-500/40",
  shipped: "bg-purple-100 text-purple-800 ring-purple-500/40",
  delivered: "bg-emerald-100 text-emerald-800 ring-emerald-500/40",
  cancelled: "bg-rose-100 text-rose-800 ring-rose-500/40",
};

/** Light row tint + coloured left edge for whole order rows/cards, matching STATUS_STYLE. */
export const STATUS_ROW: Record<string, string> = {
  pending: "bg-amber-50 hover:bg-amber-100/70 border-l-4 border-l-amber-400",
  confirmed: "bg-blue-50 hover:bg-blue-100/70 border-l-4 border-l-blue-500",
  shipped: "bg-purple-50 hover:bg-purple-100/70 border-l-4 border-l-purple-500",
  delivered: "bg-emerald-50 hover:bg-emerald-100/70 border-l-4 border-l-emerald-500",
  cancelled: "bg-rose-50 hover:bg-rose-100/70 border-l-4 border-l-rose-500",
};

const isYouTube = (url: string) => youTubeId(url) !== null;
/** First uploaded video file (mp4/webm) — used for lightweight hover/inline previews. */
export const previewVideo = (videos: string[]) => videos.find((v) => !isYouTube(v));
/** YouTube links — shown as "Watch on YouTube". */
export const youTubeVideos = (videos: string[]) => videos.filter(isYouTube);
