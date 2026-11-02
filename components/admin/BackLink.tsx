import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-gray-900">
      <ArrowLeft className="h-4 w-4" /> {label}
    </Link>
  );
}
