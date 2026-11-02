-- Long-form product descriptions and product FAQs (SEO content).
-- Description format: "## " = heading, "- " = bullet, blank line = new paragraph.

update public.products set
description = $d$Say goodbye to a cluttered, soggy sink. The Homiqo Kitchen Sink Organizer gives your dish soap, sponges, scrubbers and brushes one tidy home right next to the sink — and its self-draining tray sends dripping water straight back into the basin, so nothing sits in a puddle or starts to smell.

## Why you'll love it
In most Pakistani kitchens the area around the sink is the busiest spot in the house. Sponges get left on the counter, soap bottles tip over and water collects everywhere. This caddy keeps everything upright, separated and dry, which means fresher sponges, a cleaner counter and less time wiping up after every meal.

- Self-draining tray keeps sponges and scrubbers dry between washes
- Separate slots for liquid soap, sponge and dish brush
- Rust-proof, food-safe material that handles daily splashes
- Fits single and double sinks and most countertops
- Wipes clean in seconds

## How to use it
Place the organizer beside your sink with the drain spout pointing into the basin. Put your soap bottle in the large slot, your sponge or scrubber on the raised rack and your brush in the side holder. Water drains away automatically after every wash.

## Care
Rinse the tray under running water once or twice a week and wipe with a soft cloth. Avoid harsh steel wool so the finish stays smooth.

## Delivery in Pakistan
Order online with cash on delivery anywhere in Pakistan. Most orders arrive in 2–5 working days, and damaged or faulty items can be replaced within 7 days.$d$,
faqs = '[
 {"q":"Will it fit my sink?","a":"Yes. It is designed to sit on the counter beside single and double sinks, with the drain spout pointing into the basin, so it works with most kitchen layouts."},
 {"q":"Does it really drain water?","a":"Yes. The tray is angled with a spout, so water from wet sponges and brushes runs back into the sink instead of pooling under them."},
 {"q":"Will it rust?","a":"No. It is made from rust-proof, food-safe material that is meant for wet areas."},
 {"q":"How do I clean it?","a":"Lift out the tray, rinse it under the tap and wipe with a soft cloth. A quick rinse once or twice a week is enough."}
]'::jsonb
where slug = 'kitchen-sink-organizer';

update public.products set
description = $d$Brew fresh, aromatic coffee at home without a trip to the café. The Homiqo Coffee Maker makes up to 6 cups in one go, so the whole family — or a room full of guests — can enjoy hot coffee in minutes with a single touch.

## Why you'll love it
Instant coffee is quick but never tastes the same. A drip coffee maker slowly passes hot water through ground coffee to bring out its full flavour and aroma. Add your favourite ground coffee and water, press the switch, and let the machine do the rest.

- Brews up to 6 cups at once — ideal for families and guests
- Pause & serve anti-drip system: pour a cup mid-brew without spills
- Keep-warm hot plate holds coffee at serving temperature
- Reusable, washable filter — no paper filters to buy
- Auto shut-off for safety and peace of mind

## How to use it
Fill the water tank to the cups you need, add ground coffee to the reusable filter (about one tablespoon per cup, adjusted to taste) and switch on. Coffee drips into the glass carafe, and the hot plate keeps it warm until you are ready to pour.

## Care
Wash the filter and carafe with warm soapy water after use. Every few weeks run a cycle with water and a little white vinegar, followed by two cycles of plain water, to remove limescale — especially useful with hard tap water.

## Delivery in Pakistan
Cash on delivery across Pakistan, with most orders delivered in 2–5 working days and free delivery on orders over Rs 5,000.$d$,
faqs = '[
 {"q":"How many cups does it make?","a":"Up to 6 cups in one brewing cycle. You can also brew fewer cups by adding less water and coffee."},
 {"q":"Do I need paper filters?","a":"No. It comes with a reusable, washable filter, so there are no paper filters to buy."},
 {"q":"Which coffee should I use?","a":"Use ground coffee (medium grind works best). Instant coffee is not needed for a drip coffee maker."},
 {"q":"Can I pour a cup before brewing finishes?","a":"Yes. The pause & serve anti-drip system stops the flow when you remove the carafe, so you can pour a cup and put it back."},
 {"q":"Does it turn off automatically?","a":"Yes, it has an auto shut-off feature for safety."}
]'::jsonb
where slug = 'coffee-maker';

update public.products set
description = $d$Prep salads, fries and garnishes like a pro. The Homiqo Vegetable Slicer Cutter uses interchangeable stainless-steel blades to slice, julienne, grate and shred vegetables with the same thickness every time — far faster and more even than a knife.

## Why you'll love it
Cutting cucumbers for raita, potatoes for fries or cabbage for coleslaw by hand takes time and rarely gives even pieces. With this slicer you choose the blade, slide the vegetable across and get perfectly uniform cuts in seconds, which also helps food cook evenly.

- Multiple interchangeable stainless-steel blades
- Slice, julienne, grate and shred with one tool
- Hand guard keeps your fingers safe
- Non-slip base stays put while you work
- Dishwasher-safe parts for easy cleaning

## How to use it
Place the slicer on a flat surface or over a bowl, fit the blade you need and attach the vegetable to the hand guard. Slide it back and forth across the blade with gentle pressure. Swap blades in seconds for different cuts.

## Great for
- Potato chips and French fries
- Cucumber, onion and tomato slices for salads
- Julienned carrots for stir-fries and sushi
- Grated carrot, cabbage and cheese

## Care
Rinse blades immediately after use under running water and dry before storing. Always use the hand guard — the blades are very sharp.

## Delivery in Pakistan
Order with cash on delivery anywhere in Pakistan; most orders arrive in 2–5 working days.$d$,
faqs = '[
 {"q":"Is it safe to use?","a":"Yes, when you use the included hand guard. It holds the vegetable so your fingers stay away from the sharp blades."},
 {"q":"Which vegetables can I cut?","a":"Potatoes, cucumbers, carrots, onions, tomatoes, cabbage, zucchini and most firm fruits and vegetables."},
 {"q":"Are the blades dishwasher safe?","a":"Yes, the parts are dishwasher safe. You can also rinse them under running water straight after use."},
 {"q":"Can I make French fries with it?","a":"Yes. Use the julienne or strip blade to cut potatoes into even fries."}
]'::jsonb
where slug = 'vegetable-slicer-cutter';

update public.products set
description = $d$Clean anywhere without hunting for a socket. The Homiqo Cordless Handheld Vacuum Cleaner is light enough to use with one hand yet delivers strong cyclonic suction for crumbs, dust, sand and pet hair on sofas, car seats, curtains, beds and keyboards.

## Why you'll love it
A full-size vacuum is overkill for everyday mess — and useless during load-shedding. This rechargeable handheld vacuum is always ready: grab it, clean up the spill and put it back. It is perfect for the car, where there is no plug point at all.

- Strong cyclonic suction for dust, crumbs and hair
- USB rechargeable — no cord, works during load-shedding
- Washable, reusable HEPA filter
- Crevice and brush nozzles for corners, seats and fabric
- Lightweight, one-hand operation

## Where to use it
- Car seats, floor mats and boot
- Sofas, cushions and mattresses
- Curtains, carpets and rugs
- Keyboards, drawers and shelves
- Quick kitchen clean-ups after cooking

## How to use it
Charge with the USB cable until full, attach the nozzle you need and press the power button. Empty the dust container by pressing the release button after each use.

## Care
Empty the bin after every clean and rinse the HEPA filter in water every few uses. Let it dry completely before refitting.

## Delivery in Pakistan
Cash on delivery all over Pakistan with 2–5 working day delivery and 7-day replacement for damaged or faulty items.$d$,
faqs = '[
 {"q":"How is it charged?","a":"It charges with a USB cable, so you can use a mobile charger, a power bank, a laptop or a car USB port."},
 {"q":"Can I use it in my car?","a":"Yes. It is cordless and lightweight, which makes it ideal for car seats, mats and the boot."},
 {"q":"Is the filter washable?","a":"Yes. The HEPA filter can be rinsed with water, dried and reused."},
 {"q":"Which nozzles are included?","a":"A crevice nozzle for corners and gaps and a brush nozzle for sofas, fabric and keyboards."}
]'::jsonb
where slug = 'cordless-handheld-vacuum-cleaner';

update public.products set
description = $d$The everyday helper for desi kitchens. The Homiqo Electric Food Chopper turns meat into fine qeema, chops onions, tomatoes, garlic and ginger, and blends chutneys in seconds — no tears, no mess and no tired arms.

## Why you'll love it
From qeema and kebabs to salan masala, Pakistani cooking needs a lot of chopping. Doing it by hand takes ages and onions always make your eyes water. Add the ingredients, press the top and in a few seconds everything is chopped exactly as fine as you want.

- Minces meat into qeema in seconds
- 4 sharp stainless-steel blades
- Large bowl for family-size portions
- One-press operation — press longer for finer results
- Safety lock lid: runs only when properly closed

## What you can make
- Beef, mutton and chicken qeema
- Chopped onion, tomato, garlic and ginger for masala
- Green chutney, imli chutney and dips
- Chopped nuts, salad and baby food

## How to use it
Cut meat or vegetables into small cubes, place them in the bowl and fit the blade and lid. Press the top in short pulses for a coarse chop or hold longer for a fine mince. For meat, remove bones and keep it slightly chilled for the best texture.

## Care
Remove the blade carefully, wash the bowl and blades in warm soapy water and dry. Never put the motor unit in water — just wipe it with a damp cloth.

## Delivery in Pakistan
Order online with cash on delivery anywhere in Pakistan. Most orders are delivered in 2–5 working days.$d$,
faqs = '[
 {"q":"Can it make qeema from raw meat?","a":"Yes. Cut boneless meat into small cubes and pulse until you reach the qeema texture you like."},
 {"q":"Can I chop onions without them turning watery?","a":"Yes — use short pulses instead of holding the button down, and stop as soon as the onion is chopped."},
 {"q":"How many blades does it have?","a":"It has 4 sharp stainless-steel blades for fast, even chopping."},
 {"q":"Is it safe to use?","a":"Yes. The safety lock lid means it only runs when the lid is properly closed."},
 {"q":"How do I clean it?","a":"Wash the bowl, lid and blades with warm soapy water. Wipe the motor unit with a damp cloth only."}
]'::jsonb
where slug = 'electric-food-chopper-qeema-maker';

update public.products set
description = $d$Cut your prep time in half. With the Homiqo Multifunction Vegetable Chopper you simply place the vegetable on the blade grid, press the lid down and get perfectly diced pieces — collected neatly in the built-in container instead of all over your counter.

## Why you'll love it
Dicing onions, tomatoes and cucumbers for salads, raita and salan is one of the most repetitive jobs in the kitchen. This chopper does it in one press, gives you even cubes every time and keeps your hands away from knives and onion juice.

- Dice, slice and chop with one press
- Built-in collection container — no mess
- Multiple blade inserts for different cut sizes
- Cleaning tool included to clear the grid
- BPA-free, food-grade plastic

## Perfect for
- Onions and tomatoes for daily cooking
- Cucumber and onion for raita and kachumber salad
- Fruit chaat and fruit salad
- Potatoes, carrots and capsicum for curries and fried rice

## How to use it
Choose the blade insert, cut the vegetable to fit the grid, place it on top and press the lid down firmly. The pieces drop straight into the container. Use the cleaning tool to push out any pieces left in the grid.

## Care
Rinse the blades and container right after use and use the cleaning tool on the grid. Dry before storing.

## Delivery in Pakistan
Cash on delivery all over Pakistan, delivered in 2–5 working days.$d$,
faqs = '[
 {"q":"Do I need to cut vegetables before chopping?","a":"Large vegetables should be halved or cut into pieces that fit the blade grid. Then one press dices them."},
 {"q":"Is the plastic food safe?","a":"Yes, it is made from BPA-free, food-grade plastic."},
 {"q":"How do I clean the blade grid?","a":"Use the included cleaning tool to push out any stuck pieces, then rinse under running water."},
 {"q":"Can I choose the size of the pieces?","a":"Yes. It comes with multiple blade inserts for different cut sizes."}
]'::jsonb
where slug = 'multifunction-vegetable-chopper';

update public.products set
description = $d$Bring your kitchen knives back to life. The Homiqo Knife Sharpener uses a 3-stage system to repair, sharpen and polish the blade, restoring a clean, sharp edge in just a few strokes.

## Why you'll love it
A dull knife is slower and actually more dangerous because it slips instead of cutting. Instead of buying new knives or waiting for the sharpening man, you can sharpen your knives at home in under a minute.

- 3 stages: repair, sharpen and polish
- Non-slip base keeps it steady on the counter
- Ergonomic handle for a safe, firm grip
- Works on most steel kitchen knives
- Compact and easy to store in a drawer

## How to use it
Place the sharpener on a flat surface and hold the handle firmly. Pull the knife through each slot from heel to tip with light pressure, a few times per stage:
- Stage 1 (coarse): repairs very dull or damaged edges
- Stage 2 (medium): sharpens the edge
- Stage 3 (fine): polishes for a smooth, razor-sharp finish

For knives that are only slightly dull, stages 2 and 3 are enough.

## Care
Wipe the slots with a dry brush or cloth to remove metal dust and wash and dry your knife after sharpening.

## Delivery in Pakistan
Cash on delivery anywhere in Pakistan, usually delivered in 2–5 working days.$d$,
faqs = '[
 {"q":"Which knives can I sharpen?","a":"Most steel kitchen knives. It is not suitable for ceramic knives or scissors."},
 {"q":"How often should I sharpen my knives?","a":"For home use, a few strokes in the fine stage every one to two weeks keeps knives sharp. Use the coarse stage only when the edge is very dull."},
 {"q":"Is it safe?","a":"Yes. The non-slip base and ergonomic handle keep the sharpener steady while you pull the knife through."},
 {"q":"Do I need water or oil?","a":"No. It is used dry."}
]'::jsonb
where slug = 'knife-sharpener';

update public.products set
description = $d$Turn ordinary milk into rich, velvety foam for cappuccinos, lattes and hot chocolate in under 20 seconds. The Homiqo Electric Milk Frother & Egg Beater is a handheld whisk that also beats eggs, mixes protein shakes and whips cream — no bulky machine and no mess.

## Why you'll love it
Café coffee is expensive, and a full coffee machine takes up half the counter. This compact frother gives you the same frothy cappuccino or "beaten coffee" at home in seconds. It is just as handy for omelettes, cake batter and shakes.

- Froths milk in 15–20 seconds
- Also beats eggs, whips cream and mixes shakes
- Stainless steel whisk head
- One-button operation
- Compact, lightweight and easy to rinse clean

## What you can make
- Cappuccino, latte and hot chocolate
- Pakistani-style beaten (phenti hui) coffee
- Fluffy omelettes and scrambled eggs
- Protein shakes, lassi and cold coffee
- Whipped cream and light batters

## How to use it
Fill a mug or jug no more than one-third with milk (warm milk froths best). Dip the whisk head just below the surface, switch on and move it gently up and down for 15–20 seconds until the milk doubles in volume.

## Care
Run the whisk in a cup of warm water for a few seconds after use, then wipe dry. Do not put the handle in water.

## Delivery in Pakistan
Cash on delivery across Pakistan, with most orders arriving in 2–5 working days.$d$,
faqs = '[
 {"q":"Can I make beaten coffee (phenti hui coffee) with it?","a":"Yes. Add instant coffee, sugar and a little water to a cup and whisk for a few seconds until it turns light and creamy."},
 {"q":"Does it work with cold milk?","a":"Yes, but warm milk makes thicker, longer-lasting foam. Cold milk froth is great for iced coffee."},
 {"q":"Can I beat eggs with it?","a":"Yes. It beats eggs for omelettes and scrambled eggs, and whips cream and shakes."},
 {"q":"How do I clean it?","a":"Run the whisk in warm water for a few seconds and wipe it dry. Keep the handle away from water."}
]'::jsonb
where slug = 'electric-milk-frother-egg-beater';

update public.products set
description = $d$One tool for all your daily prep. The Homiqo 16-in-1 Vegetable Chopper & Slicer dices onions, tomatoes and fruit into perfect cubes with one press, and with a quick blade swap it slices, juliennes, grates and shreds too. Everything falls straight into the large clear container, so your counter stays clean.

## Why you'll love it
Instead of a drawer full of separate gadgets, this 16-piece set covers almost every cutting job in a Pakistani kitchen — from onions for salan to cucumber for raita and carrots for gajar halwa.

- 16-piece set with interchangeable stainless-steel blades
- Dices, slices, juliennes and grates
- Large clear collection container
- Includes peeler, egg separator and cleaning brush
- Hand guard for safe slicing
- Non-slip base, food-grade BPA-free plastic

## What's in the box
- Chopper base with large container and lid
- Interchangeable dicing, slicing, julienne and grating blades
- Hand guard (food holder)
- Peeler and egg separator
- Cleaning brush

## How to use it
Choose a blade and fit it on the container. For dicing, place the vegetable on the grid and press the lid down. For slicing and grating, use the hand guard and slide the vegetable across the blade. Swap blades in seconds.

## Care
Rinse blades straight after use and use the cleaning brush on the grid. Dry before storing and always handle blades carefully.

## Delivery in Pakistan
Order with cash on delivery anywhere in Pakistan. Most orders arrive in 2–5 working days.$d$,
faqs = '[
 {"q":"What does 16-in-1 mean?","a":"The set has 16 pieces, including interchangeable blades for dicing, slicing, julienne and grating, plus a peeler, egg separator, hand guard and cleaning brush."},
 {"q":"Can I grate carrots for gajar halwa?","a":"Yes. Use the grating blade with the hand guard to grate carrots quickly and evenly."},
 {"q":"Is the plastic safe for food?","a":"Yes. It is made from food-grade, BPA-free plastic."},
 {"q":"How do I store all the blades?","a":"The blades fit inside or alongside the container, so the whole set stores together in one cupboard space."}
]'::jsonb
where slug = 'vegetable-chopper-16-in-1';

update public.products set
description = $d$A clever rack that clamps straight onto your kitchen tap — no drilling, no glue. The Homiqo Faucet Sink Rack Organizer holds your sponge, scrubber and soap bar, with a rail for your dishcloth, so water drips straight into the sink and your counter stays clean and dry.

## Why you'll love it
Counter space next to the sink is always wet and crowded. This rack uses the space around your tap instead, keeping your washing-up essentials within reach while they drain and dry naturally.

- Mounts on the faucet — no drilling or adhesive
- Rust-resistant stainless steel basket
- Holds sponge, scrubber and soap bar
- Built-in rail to hang a dishcloth
- Drains straight into the sink
- Adjustable to fit most faucets

## How to install
Open the clamp, place it around the base or neck of your tap and tighten until it holds firmly. Adjust the basket so it sits over the sink. It takes less than a minute and can be removed anytime without leaving marks.

## Care
Rinse the basket every few days and wipe the clamp to prevent soap build-up. Remove and wash thoroughly once a month.

## Delivery in Pakistan
Cash on delivery all over Pakistan, delivered in 2–5 working days, with 7-day replacement for damaged or faulty items.$d$,
faqs = '[
 {"q":"Will it fit my tap?","a":"It adjusts to fit most standard kitchen faucets. It clamps around the tap base or neck."},
 {"q":"Do I need to drill or use glue?","a":"No. It clamps onto the tap, so there is no drilling or adhesive and nothing is damaged."},
 {"q":"Will it rust?","a":"The basket is made from rust-resistant stainless steel designed for wet areas."},
 {"q":"What can it hold?","a":"A sponge, scrubber and soap bar in the basket, plus a dishcloth on the built-in rail."}
]'::jsonb
where slug = 'faucet-sink-rack';

update public.products set
description = $d$A compact, near-silent mesh nebulizer that fits in your hand or bag. The Homiqo Portable Mesh Nebulizer turns liquid medication into a fine mist for comfortable inhalation, at home or on the go, with adult and child masks included.

## Why you'll love it
Traditional compressor nebulizers are bulky, noisy and need a plug point — difficult with small children, at night or during load-shedding. A mesh nebulizer is quiet, light and rechargeable, so treatment can happen wherever it is needed.

- Whisper-quiet mesh technology — suitable for use while children rest
- Handheld and portable — use at home, at work or while travelling
- Adult mask, child mask and mouthpiece included
- USB rechargeable with one-button operation
- Easy-to-clean medicine cup

## How to use it
Charge the device with the USB cable. Fill the medicine cup with the medication and dose prescribed by your doctor, attach the mask or mouthpiece, hold the nebulizer upright and press the power button. Breathe normally until the mist stops.

## Care
After every use, empty the medicine cup, rinse it and the mask with clean water and let them air-dry. Do not put the main unit in water.

## Important
This device delivers medication — it does not treat any condition by itself. Use it only with medication prescribed by your doctor and follow your doctor's instructions for dose and frequency.

## Delivery in Pakistan
Cash on delivery across Pakistan, usually delivered in 2–5 working days.$d$,
faqs = '[
 {"q":"Is it suitable for children?","a":"It includes a child mask as well as an adult mask and a mouthpiece. Always use it under your doctor''s guidance, especially for children."},
 {"q":"How is it charged?","a":"It charges with a USB cable, so it works with a phone charger, power bank or laptop — useful during load-shedding."},
 {"q":"Is it noisy?","a":"No. Mesh nebulizers are near-silent compared to traditional compressor nebulizers."},
 {"q":"Which medicine can I use?","a":"Only the medication and dose prescribed by your doctor. Ask your doctor or pharmacist if you are unsure."},
 {"q":"How do I clean it?","a":"Rinse the medicine cup, mask and mouthpiece with clean water after every use and let them air-dry. Keep the main unit dry."}
]'::jsonb
where slug = 'portable-mesh-nebulizer';
