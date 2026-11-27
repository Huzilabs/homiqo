import { PDFDocument, rgb } from "pdf-lib";

/**
 * PostEx returns one airway bill per A4 page, with the label only in the top third
 * (about 23–253 pt from the top). This crops each label and puts 3 on one A4 page, with cut lines.
 */
export async function airwayBills3PerPage(pdfs: Uint8Array[]): Promise<Uint8Array> {
  const out = await PDFDocument.create();
  const W = 595.28, H = 841.89, SLOT = H / 3;
  const CROP_TOP = 12, CROP_BOTTOM = 266; // pt from the top of the PostEx page

  const labels: Awaited<ReturnType<PDFDocument["embedPage"]>>[] = [];
  for (const bytes of pdfs) {
    try {
      const src = await PDFDocument.load(bytes);
      for (const p of src.getPages()) {
        const { width, height } = p.getSize();
        labels.push(await out.embedPage(p, { left: 0, right: width, top: height - CROP_TOP, bottom: height - CROP_BOTTOM }));
      }
    } catch { /* skip a broken PDF */ }
  }

  for (let i = 0; i < labels.length; i += 3) {
    const page = out.addPage([W, H]);
    labels.slice(i, i + 3).forEach((lab, k) => {
      const scale = Math.min(W / lab.width, (SLOT - 6) / lab.height, 1);
      const w = lab.width * scale, h = lab.height * scale;
      const slotTop = H - k * SLOT;
      page.drawPage(lab, { x: (W - w) / 2, y: slotTop - (SLOT - h) / 2 - h, width: w, height: h });
      if (k > 0) page.drawLine({ start: { x: 14, y: slotTop }, end: { x: W - 14, y: slotTop }, thickness: 0.6, color: rgb(0.6, 0.6, 0.6), dashArray: [5, 4] });
    });
  }
  return out.save();
}
