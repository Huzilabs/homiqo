/**
 * Category landing pages (/category/<slug>).
 * Copy is written for real shoppers and only describes what the store actually sells —
 * keep it accurate when products change.
 */
export interface CategoryInfo {
  name: string; // must match products.category
  slug: string;
  title: string; // <title> (brand suffix is added by the layout template)
  description: string; // meta description, ≤ ~155 chars
  h1: string;
  intro: string;
  sections: { heading: string; body: string }[];
}

export const CATEGORIES: CategoryInfo[] = [
  {
    name: "Kitchen Appliances",
    slug: "kitchen-appliances",
    title: "Kitchen Appliances in Pakistan — Electric Choppers & Coffee Beaters",
    description:
      "Shop compact kitchen appliances in Pakistan: rechargeable electric choppers and coffee beaters / milk frothers. Cash on delivery nationwide.",
    h1: "Small kitchen appliances",
    intro:
      "Compact, rechargeable helpers for everyday desi cooking — chop garlic, onion and chillies in seconds, or whip up frothy coffee without a bulky machine.",
    sections: [
      {
        heading: "Cordless and rechargeable",
        body: "Our electric appliances charge with a cable and work without a socket, so you can use them anywhere in the kitchen — including during load-shedding.",
      },
      {
        heading: "Choosing the right one",
        body: "Pick an electric chopper if you prepare garlic, ginger, onion, chillies or small portions of qeema every day. Pick a coffee beater / milk frother for cappuccinos, phenti hui coffee, beaten eggs and shakes.",
      },
    ],
  },
  {
    name: "Kitchen Tools",
    slug: "kitchen-tools",
    title: "Kitchen Tools in Pakistan — Vegetable Choppers, Slicers & Knife Sharpeners",
    description:
      "Buy vegetable choppers, mandoline slicers and knife sharpeners online in Pakistan. Faster, safer food prep. Cash on delivery & 7-day returns.",
    h1: "Kitchen tools for faster prep",
    intro:
      "Manual tools that take the slow, repetitive work out of cooking — even dicing, thin slicing and sharp knives, without electricity.",
    sections: [
      {
        heading: "Vegetable choppers vs slicers",
        body: "A press-down vegetable chopper dices onions, tomatoes and fruit into even cubes and collects them in a container. A mandoline slicer is better for thin, uniform slices, chips, julienne and grating.",
      },
      {
        heading: "Keep your knives sharp",
        body: "A dull knife slips instead of cutting. A 3-stage knife sharpener restores the edge at home in under a minute.",
      },
    ],
  },
  {
    name: "Kitchen Storage",
    slug: "kitchen-storage",
    title: "Kitchen Sink Organizers & Sink Racks in Pakistan",
    description:
      "Kitchen sink organizers, sink racks and sponge holders that keep your counter dry and tidy. Order online in Pakistan with cash on delivery.",
    h1: "Kitchen sink organizers & racks",
    intro:
      "The area around the sink is the busiest spot in most kitchens. These organizers give sponges, soap and brushes a home and let water drain straight back into the sink.",
    sections: [
      {
        heading: "Counter caddy or faucet rack?",
        body: "A sink organizer sits on the counter and holds soap, sponge and brush with a drip tray. A faucet sink rack clamps onto the tap, saving counter space and draining directly into the sink — no drilling needed.",
      },
    ],
  },
  {
    name: "Home Cleaning",
    slug: "home-cleaning",
    title: "Cordless Handheld Vacuum Cleaners in Pakistan — Car & Home",
    description:
      "Cordless handheld vacuum cleaners for car seats, sofas and quick clean-ups. USB rechargeable. Buy online in Pakistan with cash on delivery.",
    h1: "Home cleaning",
    intro:
      "Quick clean-ups without hunting for a socket — lightweight, rechargeable cleaning tools for the home and the car.",
    sections: [
      {
        heading: "Why a handheld vacuum?",
        body: "A full-size vacuum is overkill for crumbs, dust and pet hair on sofas, car seats and keyboards. A cordless handheld vacuum is always ready and works where there is no plug point.",
      },
    ],
  },
];

export const slugifyCategory = (name: string) =>
  name.toLowerCase().replace(/&/g, " ").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Known copy for a category, or a sensible generic entry for a new one added in admin. */
export function categoryInfo(name: string): CategoryInfo {
  return (
    CATEGORIES.find((c) => c.name === name) || {
      name,
      slug: slugifyCategory(name),
      title: `${name} — Buy Online in Pakistan`,
      description: `Shop ${name.toLowerCase()} online in Pakistan. Cash on delivery nationwide, 2–5 day delivery and 7-day returns.`,
      h1: name,
      intro: `Browse our ${name.toLowerCase()} range, delivered across Pakistan with cash on delivery.`,
      sections: [],
    }
  );
}

export const categoryPath = (name: string) => `/category/${categoryInfo(name).slug}`;
