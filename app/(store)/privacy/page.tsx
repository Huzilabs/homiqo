import type { Metadata } from "next";
import Link from "next/link";
import { BANK, STORE } from "@/lib/config";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "How Homiqo collects, uses and protects your personal information when you browse our website and place an order.",
  alternates: { canonical: "/privacy" },
};

const UPDATED = "3 November 2026";

export default function PrivacyPage() {
  const whatsapp = STORE.whatsapp ? `+${STORE.whatsapp.replace(/^92/, "92 ").replace(/^(92 \d{3})(\d{7})$/, "$1 $2")}` : BANK.whatsappDisplay;
  return (
    <div className="container-x max-w-3xl py-12">
      <h1 className="font-serif text-4xl font-medium sm:text-5xl">Privacy policy</h1>
      <p className="mt-3 text-sm text-ink/55">Last updated: {UPDATED}</p>

      <div className="mt-8 space-y-8 leading-relaxed text-ink/75">
        <section>
          <p>
            This policy explains what personal information {STORE.name} (“we”, “us”) collects when you visit {STORE.siteUrl.replace(/^https?:\/\//, "")} or place
            an order, how we use it and the choices you have. {STORE.name} is an online retailer delivering across Pakistan.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-ink">Information we collect</h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li><b>Order details you give us at checkout:</b> your name, phone number, delivery address, city, postal code, email address (optional) and any order notes, together with the products you order.</li>
            <li><b>Payment:</b> for Cash on Delivery we do not collect any payment details online. If you choose Bank Transfer, you send us a screenshot of your transfer on WhatsApp so we can confirm the payment. We never ask for card numbers or online banking passwords.</li>
            <li><b>Messages:</b> anything you send us on WhatsApp, phone or email.</li>
            <li><b>Browsing information:</b> pages visited, products viewed, device and browser type, approximate location (country/city from your IP address) and how you arrived at our site (for example from an ad). See “Cookies and tracking” below.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-ink">How we use your information</h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>To process, confirm and deliver your order, including calling or messaging you to confirm it.</li>
            <li>To send you order updates (for example confirmation, shipping and tracking details) if you give us your email address.</li>
            <li>To answer your questions and handle returns, replacements and refunds.</li>
            <li>To prevent fake or fraudulent orders.</li>
            <li>To understand how our website is used and improve it, and to measure how well our advertising works.</li>
            <li>To keep business and accounting records.</li>
          </ul>
          <p className="mt-2">We do not sell your personal information.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-ink">Who we share it with</h2>
          <p className="mt-2">We share only what is needed with the service providers that help us run the store:</p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li><b>PostEx</b> (courier): your name, phone number, delivery address, city and the amount to collect, so your parcel can be delivered.</li>
            <li><b>Supabase</b> and <b>Vercel</b>: secure hosting for our website and order database.</li>
            <li><b>Google</b> (Gmail): to send order emails.</li>
            <li><b>Google Analytics</b>, <b>Meta (Facebook &amp; Instagram)</b> and <b>Microsoft Clarity</b>: website analytics and advertising measurement (see below).</li>
          </ul>
          <p className="mt-2">We may also disclose information if required by law.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-ink">Cookies and tracking</h2>
          <p className="mt-2">Our website uses cookies and similar technologies:</p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li><b>Essential storage:</b> your browser stores your cart so it is still there when you come back.</li>
            <li><b>Google Analytics:</b> to count visitors and understand which pages and products are popular.</li>
            <li><b>Meta Pixel:</b> to measure the results of our Facebook and Instagram ads and show relevant ads. When you place an order, Meta may receive order information such as the order value and, in a hashed (scrambled) form, contact details used to match the order to an ad.</li>
            <li><b>Microsoft Clarity:</b> heatmaps and session recordings that show how visitors use our pages, so we can fix problems. Form inputs such as your address are masked.</li>
            <li><b>Our own visit statistics:</b> anonymous page-view and session counts.</li>
          </ul>
          <p className="mt-2">
            You can block or delete cookies in your browser settings, and you can manage ad preferences in your Facebook/Instagram settings. The store still works without
            analytics cookies.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-ink">How long we keep it</h2>
          <p className="mt-2">We keep order records for as long as needed to deliver your order, handle returns and meet our business and accounting obligations. Analytics data is kept according to each provider’s retention settings.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-ink">Your choices</h2>
          <p className="mt-2">
            You can ask us to show you, correct or delete the personal information we hold about you. Contact us on WhatsApp at <b>{whatsapp}</b>
            {STORE.email ? <> or by email at <b>{STORE.email}</b></> : null}. We may need to keep some information where we are required to by law or for an
            open order.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-ink">Security</h2>
          <p className="mt-2">Our website uses HTTPS encryption, and access to order information is limited to the people who need it to run the store.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-ink">Changes to this policy</h2>
          <p className="mt-2">We may update this policy from time to time. The latest version will always be on this page with the date it was last updated.</p>
        </section>

        <p className="border-t border-ink/10 pt-6 text-sm">
          See also our <Link href="/policies" className="underline">shipping &amp; returns policy</Link>.
        </p>
      </div>
    </div>
  );
}
