import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Page not found", robots: { index: false } };

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <p className="text-6xl font-semibold text-brand-600">404</p>
      <h1 className="mt-4 text-2xl font-bold">Page not found</h1>
      <p className="mt-2 text-ink/55">The page you’re looking for doesn’t exist or has moved.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/shop" className="btn-primary">Shop all products</Link>
        <Link href="/" className="btn-secondary">Back to home</Link>
      </div>
    </div>
  );
}
