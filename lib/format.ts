export const formatPrice = (n: number | string) =>
  "Rs " + Number(n).toLocaleString("en-PK", { maximumFractionDigits: 0 });

export const formatDate = (d: string) =>
  new Date(d).toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" });

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
  pending: "bg-amber-50 text-amber-700 ring-amber-600/20",
  confirmed: "bg-sky-50 text-sky-700 ring-sky-600/20",
  shipped: "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
  delivered: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  cancelled: "bg-rose-50 text-rose-700 ring-rose-600/20",
};

const isYouTube = (url: string) => youTubeId(url) !== null;
/** First uploaded video file (mp4/webm) — used for lightweight hover/inline previews. */
export const previewVideo = (videos: string[]) => videos.find((v) => !isYouTube(v));
/** YouTube links — shown as "Watch on YouTube". */
export const youTubeVideos = (videos: string[]) => videos.filter(isYouTube);
