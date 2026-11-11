"use client";
import { Fragment, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { LoaderCircle, Send, Sparkles, X } from "lucide-react";
import { BANK, STORE } from "@/lib/config";

type Msg = { role: "user" | "assistant"; content: string };
const KEY = "hq.chat";
const GREETING: Msg = {
  role: "assistant",
  content: `Assalam o Alaikum! 👋 I'm the ${STORE.name} assistant. Ask me anything — products, prices, delivery or cash on delivery.`,
};
const SUGGESTIONS = ["Delivery kitne din mein hogi?", "Cash on delivery hai?", "Best product for kitchen?", "Combo deal kya hai?"];

/** Turns [text](url) and bare links into clickable links; everything else stays plain text. */
function Rich({ text }: { text: string }) {
  const parts = text.split(/(\[[^\]]+\]\([^)\s]+\)|https?:\/\/[^\s)]+|\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) => {
        const md = p.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/);
        const url = md ? md[2] : /^https?:\/\//.test(p) ? p.replace(/[.,]+$/, "") : null;
        if (url) {
          return (
            <a key={i} href={url} className="font-medium text-brand-700 underline underline-offset-2" target={url.includes(STORE.siteUrl.replace(/^https?:\/\/(www\.)?/, "")) ? undefined : "_blank"} rel="noopener noreferrer">
              {md ? md[1] : url.replace(/^https?:\/\/(www\.)?/, "")}
            </a>
          );
        }
        const bold = p.match(/^\*\*([^*]+)\*\*$/);
        if (bold) return <b key={i}>{bold[1]}</b>;
        return <Fragment key={i}>{p}</Fragment>;
      })}
    </>
  );
}

export default function AIChat() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(KEY) || "null");
      if (Array.isArray(saved) && saved.length) setMsgs(saved);
    } catch {}
  }, []);
  useEffect(() => {
    try {
      sessionStorage.setItem(KEY, JSON.stringify(msgs.slice(-20)));
    } catch {}
    end.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, open]);

  if (pathname === "/cart" || pathname === "/checkout") return null;
  const onProduct = pathname.startsWith("/product/");

  async function send(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    const next = [...msgs, { role: "user" as const, content: q }];
    setMsgs(next);
    setInput("");
    setBusy(true);
    try {
      (window as unknown as { gtag?: (...a: unknown[]) => void }).gtag?.("event", "ai_chat_message");
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.filter((m) => m !== GREETING).slice(-10), page: pathname }),
      });
      const data = await res.json().catch(() => ({}));
      setMsgs((m) => [...m, { role: "assistant", content: data.reply || data.error || "Sorry, something went wrong. Please WhatsApp us." }]);
    } catch {
      setMsgs((m) => [...m, { role: "assistant", content: "Sorry, something went wrong. Please WhatsApp us." }]);
    }
    setBusy(false);
  }

  return (
    <>
      {!open && (
        <button
          onClick={() => {
            setOpen(true);
            (window as unknown as { gtag?: (...a: unknown[]) => void }).gtag?.("event", "ai_chat_open");
          }}
          aria-label="Ask our assistant"
          className={`fixed left-4 z-30 flex h-12 items-center gap-2 rounded-full bg-ink px-4 text-sm font-semibold text-white shadow-lift transition hover:scale-105 lg:left-auto lg:right-6 lg:bottom-24 lg:h-14 lg:w-14 lg:justify-center lg:px-0 ${
            onProduct ? "bottom-[5.5rem]" : "bottom-6"
          }`}
        >
          <Sparkles className="h-5 w-5 text-accent-400 lg:h-6 lg:w-6" /> <span className="lg:hidden">Ask us</span>
        </button>
      )}

      {open && (
        <div className="fixed inset-x-0 bottom-0 z-50 flex max-h-[85svh] flex-col border-t border-ink/10 bg-white shadow-2xl sm:inset-x-auto sm:bottom-6 sm:left-6 lg:left-auto lg:right-6 sm:h-[560px] sm:w-[380px] sm:border">
          <div className="flex items-center justify-between bg-ink px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-accent-400" />
              <div>
                <p className="text-sm font-semibold leading-tight">{STORE.name} Assistant</p>
                <p className="text-[11px] text-white/60">AI · usually replies instantly</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close chat" className="p-1 hover:opacity-80">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-paper px-4 py-4 text-sm">
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <p className={`max-w-[85%] whitespace-pre-wrap break-words px-3 py-2 leading-relaxed ${m.role === "user" ? "bg-brand-600 text-white" : "border border-ink/10 bg-white text-ink"}`}>
                  {m.role === "assistant" ? <Rich text={m.content} /> : m.content}
                </p>
              </div>
            ))}
            {busy && (
              <div className="flex items-center gap-2 text-xs text-ink/50">
                <LoaderCircle className="h-4 w-4 animate-spin" /> Typing…
              </div>
            )}
            {msgs.length === 1 && !busy && (
              <div className="flex flex-wrap gap-2 pt-1">
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => send(s)} className="border border-brand-600/30 bg-white px-3 py-1.5 text-xs text-brand-700 hover:border-brand-600">
                    {s}
                  </button>
                ))}
              </div>
            )}
            <div ref={end} />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 border-t border-ink/10 bg-white p-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your question…"
              maxLength={500}
              className="input flex-1 py-2.5 text-sm"
              aria-label="Your question"
            />
            <button type="submit" disabled={busy || !input.trim()} aria-label="Send" className="bg-ink p-2.5 text-white disabled:opacity-40">
              <Send className="h-4 w-4" />
            </button>
          </form>
          <p className="bg-white px-3 pb-2 text-center text-[10px] text-ink/40">
            AI answers can be wrong — for orders, WhatsApp {BANK.whatsappDisplay}.
          </p>
        </div>
      )}
    </>
  );
}
