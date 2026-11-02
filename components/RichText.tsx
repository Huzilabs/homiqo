/**
 * Renders product descriptions written as simple text:
 *   "## Heading" lines become sub-headings, "- item" lines become bullet lists,
 *   blank lines separate paragraphs.
 */
export default function RichText({ text }: { text: string }) {
  const blocks = text.replace(/\r\n/g, "\n").split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  return (
    <div className="space-y-5 text-[17px] leading-[1.8] text-ink/70">
      {blocks.map((block, i) => {
        const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
        const out: React.ReactNode[] = [];
        let para: string[] = [];
        let list: string[] = [];
        const flush = () => {
          if (para.length) out.push(<p key={`p${out.length}`}>{para.join(" ")}</p>);
          if (list.length)
            out.push(
              <ul key={`u${out.length}`} className="space-y-2">
                {list.map((li) => (
                  <li key={li} className="flex gap-3">
                    <span className="mt-[0.8em] h-1.5 w-1.5 shrink-0 rounded-full bg-accent-500" />
                    <span>{li}</span>
                  </li>
                ))}
              </ul>,
            );
          para = [];
          list = [];
        };
        for (const l of lines) {
          if (l.startsWith("## ")) {
            flush();
            out.push(<h3 key={`h${out.length}`} className="pt-3 font-serif text-2xl font-medium text-ink">{l.slice(3)}</h3>);
          } else if (/^[-•]\s+/.test(l)) {
            if (para.length) { const keep = list; list = []; flush(); list = keep; }
            list.push(l.replace(/^[-•]\s+/, ""));
          } else {
            if (list.length) flush();
            para.push(l);
          }
        }
        flush();
        return <div key={i} className="space-y-4">{out}</div>;
      })}
    </div>
  );
}
