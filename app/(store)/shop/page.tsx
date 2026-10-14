import Link from "next/link";
import type { Metadata } from "next";
import ProductCard from "@/components/ProductCard";
import SetupNotice from "@/components/SetupNotice";
import SortSelect from "@/components/SortSelect";
import { getCategories, getProducts } from "@/lib/products";
import { supabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Shop all products" };

type Params = Promise<{ category?: string; q?: string; sort?: string }>;

export default async function ShopPage({ searchParams }: { searchParams: Params }) {
  if (!supabaseConfigured) return <SetupNotice />;
  const { category, q, sort } = await searchParams;
  const [products, categories] = await Promise.all([getProducts({ category, q, sort }), getCategories()]);

  const href = (c?: string) => {
    const sp = new URLSearchParams();
    if (c) sp.set("category", c);
    if (q) sp.set("q", q);
    if (sort) sp.set("sort", sort);
    const s = sp.toString();
    return s ? `/shop?${s}` : "/shop";
  };

  return (
    <div className="container-x py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">{q ? `Results for “${q}”` : category || "All products"}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {products.length} product{products.length === 1 ? "" : "s"}
          </p>
        </div>
        <SortSelect value={sort || ""} />
      </div>

      <div className="-mx-4 mt-6 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:px-0">
        <Chip href={href()} active={!category}>All</Chip>
        {categories.map((c) => (
          <Chip key={c} href={href(c)} active={category === c}>
            {c}
          </Chip>
        ))}
      </div>

      {products.length > 0 ? (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
          {products.map((p, i) => (
            <ProductCard key={p.id} product={p} priority={i < 4} />
          ))}
        </div>
      ) : (
        <div className="card mt-6 p-12 text-center">
          <p className="font-semibold">No products found</p>
          <p className="mt-1 text-sm text-gray-500">Try a different search or category.</p>
          <Link href="/shop" className="btn-primary mt-5">
            Clear filters
          </Link>
        </div>
      )}
    </div>
  );
}

function Chip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
        active ? "bg-ink text-white" : "border border-gray-200 bg-white text-gray-700 hover:border-brand-300"
      }`}
    >
      {children}
    </Link>
  );
}
