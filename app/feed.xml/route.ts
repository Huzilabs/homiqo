import { getProducts } from "@/lib/products";
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE, STORE } from "@/lib/config";
import { abs } from "@/lib/seo";

// Google Merchant Center product feed (RSS 2.0). Submit https://www.homiqoofficial.site/feed.xml in Merchant Center.
export const revalidate = 3600;

const x = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c]!);
const plain = (s: string) => s.replace(/^##\s+/gm, "").replace(/^[-•]\s+/gm, "• ").replace(/\n{2,}/g, "\n").trim();

export async function GET() {
  const products = await getProducts();
  const items = products
    .map((p) => {
      const imgs = p.images.map(abs);
      return `    <item>
      <g:id>${x(p.slug)}</g:id>
      <title>${x(p.name)}</title>
      <description>${x(plain(p.description || p.short_description).slice(0, 4900))}</description>
      <link>${x(abs(`/product/${p.slug}`))}</link>
      ${imgs[0] ? `<g:image_link>${x(imgs[0])}</g:image_link>` : ""}
      ${imgs.slice(1, 10).map((u) => `<g:additional_image_link>${x(u)}</g:additional_image_link>`).join("\n      ")}
      <g:availability>${p.stock > 0 ? "in_stock" : "out_of_stock"}</g:availability>
      <g:price>${Number(p.price).toFixed(2)} ${STORE.currency}</g:price>
      <g:condition>new</g:condition>
      <g:brand>${x(STORE.name)}</g:brand>
      <g:identifier_exists>no</g:identifier_exists>
      <g:product_type>${x(p.category)}</g:product_type>
      <g:shipping>
        <g:country>PK</g:country>
        <g:service>Standard (2–5 working days)</g:service>
        <g:price>${(Number(p.price) >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE).toFixed(2)} ${STORE.currency}</g:price>
      </g:shipping>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${x(STORE.name)}</title>
    <link>${x(abs("/"))}</link>
    <description>${x(STORE.tagline)}</description>
${items}
  </channel>
</rss>`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=0, s-maxage=3600" } });
}
