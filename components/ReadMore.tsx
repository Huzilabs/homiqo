"use client";
import { useState } from "react";

/** On mobile, shows the first few lines with a "Read more" toggle; always fully open on desktop. */
export default function ReadMore({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <div className={`relative overflow-hidden lg:max-h-none ${open ? "" : "max-h-[8.5rem]"}`}>
        {children}
        {!open && <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-sand to-transparent lg:hidden" />}
      </div>
      <button type="button" onClick={() => setOpen((v) => !v)} className="mt-3 text-sm font-semibold text-brand-700 underline underline-offset-4 lg:hidden">
        {open ? "Show less" : "Read full description"}
      </button>
    </div>
  );
}
