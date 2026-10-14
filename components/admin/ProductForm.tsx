"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ExternalLink, Film, ImagePlus, LoaderCircle, Trash2, Youtube } from "lucide-react";
import VideoEmbed from "@/components/VideoEmbed";
import { createClient } from "@/lib/supabase/client";
import { MEDIA_BUCKET } from "@/lib/config";
import { slugify, youTubeId } from "@/lib/format";
import type { Product } from "@/lib/types";

const MAX_IMAGE_MB = 8;
const MAX_VIDEO_MB = 50; // Supabase free plan per-file limit

export default function ProductForm({ product, categories }: { product?: Product; categories: string[] }) {
  const router = useRouter();
  const supabase = createClient();
  const [name, setName] = useState(product?.name || "");
  const [slug, setSlug] = useState(product?.slug || "");
  const [slugTouched, setSlugTouched] = useState(Boolean(product));
  const [images, setImages] = useState<string[]>(product?.images || []);
  const [videos, setVideos] = useState<string[]>(product?.videos || []);
  const [uploading, setUploading] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const imgInput = useRef<HTMLInputElement>(null);
  const vidInput = useRef<HTMLInputElement>(null);

  async function upload(files: FileList | null, kind: "image" | "video") {
    if (!files?.length) return;
    setError(null);
    const limit = kind === "image" ? MAX_IMAGE_MB : MAX_VIDEO_MB;
    const urls: string[] = [];
    for (const file of Array.from(files)) {
      if (file.size > limit * 1024 * 1024) {
        setError(`${file.name} is larger than ${limit} MB.`);
        continue;
      }
      setUploading(`Uploading ${file.name}…`);
      const ext = file.name.split(".").pop()?.toLowerCase() || (kind === "image" ? "jpg" : "mp4");
      const path = `${kind}s/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, file, {
        cacheControl: "31536000",
        contentType: file.type,
      });
      if (error) {
        setError(`Upload failed for ${file.name}: ${error.message}`);
        continue;
      }
      urls.push(supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl);
    }
    setUploading(null);
    if (kind === "image") setImages((prev) => [...prev, ...urls]);
    else setVideos((prev) => [...prev, ...urls]);
    if (imgInput.current) imgInput.current.value = "";
    if (vidInput.current) vidInput.current.value = "";
  }

  const move = (i: number, d: number) =>
    setImages((prev) => {
      const next = [...prev];
      const j = i + d;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  function addVideoUrl() {
    const url = videoUrl.trim();
    if (!url) return;
    if (!/^https?:\/\//.test(url)) return setError("Enter a full video link starting with https://");
    setVideos((v) => [...v, url]);
    setVideoUrl("");
  }

  function addImageUrl() {
    const url = imageUrl.trim();
    if (!/^https:\/\//.test(url)) return setError("Enter a full image link starting with https://");
    setImages((v) => [...v, url]);
    setImageUrl("");
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const f = new FormData(e.currentTarget);
    const num = (k: string) => (f.get(k) === "" || f.get(k) == null ? null : Number(f.get(k)));
    const payload = {
      name: name.trim(),
      slug: slugify(slug || name),
      category: String(f.get("category") || "").trim() || "Kitchen",
      short_description: String(f.get("short_description") || "").trim(),
      description: String(f.get("description") || "").trim(),
      features: String(f.get("features") || "")
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      price: num("price") ?? 0,
      compare_at_price: num("compare_at_price"),
      stock: num("stock") ?? 0,
      sort_order: num("sort_order") ?? 0,
      is_active: f.get("is_active") === "on",
      is_featured: f.get("is_featured") === "on",
      images,
      videos,
    };
    if (!payload.slug) return setError("Please enter a product name.");
    if (payload.compare_at_price !== null && payload.compare_at_price <= payload.price) payload.compare_at_price = null;

    setSaving(true);
    const { error } = product
      ? await supabase.from("products").update(payload).eq("id", product.id)
      : await supabase.from("products").insert(payload);
    setSaving(false);
    if (error) {
      return setError(error.code === "23505" ? "Another product already uses this URL slug. Change the slug." : error.message);
    }
    router.push("/admin/products");
    router.refresh();
  }

  async function onDelete() {
    if (!product || !confirm(`Delete “${product.name}”? Past orders keep their details.`)) return;
    setSaving(true);
    const { error } = await supabase.from("products").delete().eq("id", product.id);
    setSaving(false);
    if (error) return setError(error.message);
    router.push("/admin/products");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <section className="card space-y-4 p-6">
          <div>
            <label className="label" htmlFor="name">Product name *</label>
            <input
              id="name"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!slugTouched) setSlug(slugify(e.target.value));
              }}
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="slug">URL slug</label>
            <div className="flex items-center rounded-xl border border-gray-200 bg-gray-50 pl-3 text-sm text-gray-500 focus-within:border-brand-500">
              /product/
              <input
                id="slug"
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(e.target.value);
                }}
                className="w-full bg-transparent px-1 py-2.5 text-ink outline-none"
              />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="short_description">Short description</label>
            <input id="short_description" name="short_description" defaultValue={product?.short_description} maxLength={200} className="input" placeholder="One line shown on product cards" />
          </div>
          <div>
            <label className="label" htmlFor="description">Full description</label>
            <textarea id="description" name="description" rows={6} defaultValue={product?.description} className="input" />
          </div>
          <div>
            <label className="label" htmlFor="features">Key features <span className="font-normal text-gray-400">(one per line)</span></label>
            <textarea id="features" name="features" rows={5} defaultValue={product?.features.join("\n")} className="input" />
          </div>
        </section>

        <section className="card p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">Photos</h2>
            <span className="text-xs text-gray-500">First photo is the main image</span>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
            {images.map((url, i) => (
              <div key={url + i} className="group relative aspect-square overflow-hidden rounded-xl border bg-gray-50">
                <Image src={url} alt="" fill sizes="160px" className="object-cover" />
                {i === 0 && <span className="absolute left-1.5 top-1.5 rounded bg-brand-600 px-1.5 py-0.5 text-[10px] font-bold text-white">MAIN</span>}
                <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/50 p-1 text-white opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                  <button type="button" onClick={() => move(i, -1)} aria-label="Move left" className="p-1"><ChevronLeft className="h-4 w-4" /></button>
                  <button type="button" onClick={() => setImages((p) => p.filter((_, j) => j !== i))} aria-label="Remove" className="p-1"><Trash2 className="h-4 w-4" /></button>
                  <button type="button" onClick={() => move(i, 1)} aria-label="Move right" className="p-1"><ChevronRight className="h-4 w-4" /></button>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => imgInput.current?.click()}
              disabled={!!uploading}
              className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-gray-300 text-sm text-gray-500 hover:border-brand-400 hover:text-brand-700"
            >
              <ImagePlus className="h-6 w-6" /> Upload
            </button>
          </div>
          <input ref={imgInput} type="file" accept="image/*" multiple hidden onChange={(e) => upload(e.target.files, "image")} />
          <div className="mt-3 flex gap-2">
            <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="…or paste an image URL" className="input" />
            <button type="button" onClick={addImageUrl} className="btn-secondary shrink-0 px-4">Add</button>
          </div>
        </section>

        <section className="card p-6">
          <h2 className="font-bold">Videos</h2>
          <p className="mt-1 text-sm text-gray-500">Upload MP4/WebM files (max {MAX_VIDEO_MB} MB) or add YouTube links. Videos appear in the product gallery and the homepage.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {videos.map((url, i) => (
              <div key={url + i} className="overflow-hidden rounded-xl border">
                <VideoEmbed url={url} title={`Video ${i + 1}`} />
                <div className="flex items-center justify-between gap-2 p-2 text-xs text-gray-500">
                  <span className="flex min-w-0 items-center gap-1 truncate">
                    {youTubeId(url) ? <Youtube className="h-4 w-4 shrink-0 text-red-600" /> : <Film className="h-4 w-4 shrink-0" />}
                    <span className="truncate">{url.split("/").pop()}</span>
                  </span>
                  <button type="button" onClick={() => setVideos((v) => v.filter((_, j) => j !== i))} className="p-1 text-gray-400 hover:text-rose-600" aria-label="Remove video">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button type="button" onClick={() => vidInput.current?.click()} disabled={!!uploading} className="btn-secondary shrink-0">
              <Film className="h-4 w-4" /> Upload video
            </button>
            <input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://youtube.com/watch?v=…" className="input" />
            <button type="button" onClick={addVideoUrl} className="btn-secondary shrink-0 px-4">Add link</button>
          </div>
          <input ref={vidInput} type="file" accept="video/mp4,video/webm,video/quicktime" hidden onChange={(e) => upload(e.target.files, "video")} />
        </section>
        {uploading && (
          <p className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm text-white shadow-lift">
            <LoaderCircle className="h-4 w-4 animate-spin" /> {uploading}
          </p>
        )}
      </div>

      <aside className="space-y-6 lg:sticky lg:top-8 lg:self-start">
        <section className="card space-y-4 p-6">
          <h2 className="font-bold">Pricing & stock</h2>
          <div>
            <label className="label" htmlFor="price">Price (Rs) *</label>
            <input id="price" name="price" type="number" min="0" step="1" required defaultValue={product?.price} className="input" />
          </div>
          <div>
            <label className="label" htmlFor="compare_at_price">Compare-at price (Rs)</label>
            <input id="compare_at_price" name="compare_at_price" type="number" min="0" step="1" defaultValue={product?.compare_at_price ?? ""} className="input" placeholder="Original price, shows discount" />
          </div>
          <div>
            <label className="label" htmlFor="stock">Stock quantity *</label>
            <input id="stock" name="stock" type="number" min="0" step="1" required defaultValue={product?.stock ?? 0} className="input" />
          </div>
        </section>
        <section className="card space-y-4 p-6">
          <h2 className="font-bold">Organization</h2>
          <div>
            <label className="label" htmlFor="category">Category</label>
            <input id="category" name="category" list="cat-list" defaultValue={product?.category} className="input" placeholder="e.g. Kitchen Tools" />
            <datalist id="cat-list">{categories.map((c) => <option key={c} value={c} />)}</datalist>
          </div>
          <div>
            <label className="label" htmlFor="sort_order">Display order</label>
            <input id="sort_order" name="sort_order" type="number" defaultValue={product?.sort_order ?? 0} className="input" />
          </div>
          <label className="flex items-center gap-3 text-sm">
            <input type="checkbox" name="is_active" defaultChecked={product?.is_active ?? true} className="h-4 w-4 accent-brand-600" />
            Visible in store
          </label>
          <label className="flex items-center gap-3 text-sm">
            <input type="checkbox" name="is_featured" defaultChecked={product?.is_featured ?? false} className="h-4 w-4 accent-brand-600" />
            Featured on homepage
          </label>
        </section>
        {error && <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700" role="alert">{error}</p>}
        <div className="flex flex-col gap-2">
          <button disabled={saving || !!uploading} className="btn-primary w-full">
            {saving && <LoaderCircle className="h-4 w-4 animate-spin" />} {product ? "Save changes" : "Create product"}
          </button>
          {product && (
            <Link href={`/product/${product.slug}`} target="_blank" className="btn-secondary w-full">
              <ExternalLink className="h-4 w-4" /> View in store
            </Link>
          )}
          <Link href="/admin/products" className="btn-secondary w-full">Cancel</Link>
          {product && (
            <button type="button" onClick={onDelete} disabled={saving} className="mt-2 text-sm font-medium text-rose-600 hover:underline">
              Delete product
            </button>
          )}
        </div>
      </aside>
    </form>
  );
}
