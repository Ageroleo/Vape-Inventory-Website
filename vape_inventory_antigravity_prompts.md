# Vape Inventory Showcase: Antigravity Agent Prompt Playbook

## Recommended Tech Stack Maximizes UI Polish and Agent Speed

Fast coding models in agentic IDEs like Antigravity perform best when given a strongly typed, component-driven stack with utility-first styling. This stack requires zero complex CSS file switching and allows the agent to build, preview, and iterate in single-file or modular increments.

| Layer | Chosen Technology | Why It Works Best for Antigravity + Flash Models |
| :--- | :--- | :--- |
| **Framework** | **Next.js 15 (App Router) + TypeScript** | Strict types catch data mismatches immediately; file-based routing keeps context small per prompt. |
| **Styling & UI** | **Tailwind CSS + shadcn/ui + Radix Primitives** | Utility classes stay inline with markup so the agent styles components accurately in one pass. |
| **Animations** | **Framer Motion** | Declarative layout animations (`layout`, `AnimatePresence`) make filtering and modals feel premium. |
| **Icons** | **Lucide React** | Clean, consistent vector icons for battery capacity, puff counts, airflow, and stock status. |
| **State & Data** | **Supabase (Free Tier) or Local TypeScript Store** | Start with a typed JSON/TypeScript dataset for instant UI preview, then swap in Supabase for live stock toggling. |
| **Deployment** | **Vercel** | Zero-config deployment with instant mobile preview links for customers. |

## Visual Direction Uses an Obsidian Glass & Flavor-Accented Palette

Vape hardware and flavor catalogs look sharpest in a high-contrast dark mode interface where each product's flavor profile provides the color pop.

| Design Token | Value / Specification | UI Application |
| :--- | :--- | :--- |
| **Primary Canvas** | `#090A0F` (Deep Obsidian) | Main page background to make product renders and neon badges stand out. |
| **Card Surface** | `rgba(24, 26, 36, 0.72)` + `backdrop-blur-md` | Frosted glass product cards with `1px solid rgba(255, 255, 255, 0.08)` borders. |
| **Primary Accent** | `#00F5D4` (Electric Mint) / `#8B5CF6` (Vapor Violet) | Active filter pills, primary CTA buttons, and interactive focus rings. |
| **Stock Status Badges** | Emerald `#10B981` / Amber `#F59E0B` / Rose `#F43F5E` | Glowing dot indicators for **In Stock**, **Low Stock (<5 left)**, and **Out of Stock**. |
| **Typography** | `Space Grotesk` (Headings) + `Plus Jakarta Sans` (Body) + `JetBrains Mono` (Specs) | Monospace numbers for puff count (`25,000 Puffs`), battery (`850mAh`), and nicotine (`5% / 50mg`). |

## How to Use These Prompts in Antigravity

Feed the prompts below **one step at a time** into your Antigravity agent. Waiting for the agent to complete and verify each milestone before sending the next prompt keeps the context window clean and prevents UI regressions.

### Step 0: System Rules & Workspace Context (Paste Once at Session Start)

```text
You are an expert Frontend Architect and UI/UX Designer building a modern, high-converting "Vape In-Stock Showcase" web application.

Tech Stack Constraints:
- Framework: Next.js (App Router) with TypeScript
- Styling: Tailwind CSS (dark-first theme)
- Icons: lucide-react
- Animations: framer-motion

Design System Rules:
- Theme: "Obsidian Glass & Neon Vapor" (#090A0F background, bg-zinc-900/70 backdrop-blur-md cards, border-white/10 subtle borders, hover:border-teal-400/50 transitions).
- Typography: Use Space Grotesk for headings, Inter/Plus Jakarta Sans for body, and JetBrains Mono for technical specs (puff count, nicotine mg, battery mAh, coil resistance, price).
- Stock Visibility First: Every product card must prominently display real-time stock status ("In Stock" with pulsing emerald dot, "Low Stock" with amber dot and unit count, or "Sold Out" with muted grayscale overlay).
- Mobile-First Ergonomics: 85%+ of customers browse vape stock on mobile phones. All filter bars must be horizontally scrollable with touch-friendly tap targets, and cards must look sharp on 375px–430px viewports.
- Code Quality: Write modular, strictly typed TypeScript components. Never leave placeholder comments like "// TODO" or truncated code.

Acknowledge these rules and wait for Step 1.
```

### Step 1: Project Scaffolding, Data Schema & Mock Inventory

```text
Step 1: Initialize the project structure, global dark theme, and a comprehensive TypeScript inventory schema.

1. Create `src/types/vape.ts` with the following interfaces:
   - `ProductCategory`: 'disposable' | 'pod_kit' | 'cartridge_pod' | 'e_liquid' | 'mod_device'
   - `StockStatus`: 'in_stock' | 'low_stock' | 'out_of_stock'
   - `FlavorVariant`:
     - `id`: string
     - `name`: string (e.g., "Watermelon Ice", "Blue Razz Lemon", "Yakult Frost")
     - `colorHex`: string (accent color for the flavor pill and card glow)
     - `coolingLevel`: 1 | 2 | 3 | 4 | 5 (ice/menthol rating)
     - `sweetnessLevel`: 1 | 2 | 3 | 4 | 5
     - `stockCount`: number
     - `status`: StockStatus
   - `VapeProduct`:
     - `id`: string
     - `slug`: string
     - `name`: string
     - `brand`: string
     - `category`: ProductCategory
     - `price`: number
     - `compareAtPrice`?: number
     - `nicotineStrength`: string (e.g., "3% (30mg)" or "5% (50mg)")
     - `puffCount`?: number (e.g., 15000, 25000)
     - `batteryCapacity`?: string (e.g., "800mAh Type-C")
     - `coilType`?: string (e.g., "Dual Mesh Coil")
     - `isFeatured`?: boolean
     - `isNewArrival`?: boolean
     - `image`: string
     - `description`: string
     - `flavors`: FlavorVariant[]

2. Create `src/data/inventory.ts` containing 10 realistic, rich mock products across Disposables, Pod Kits, Pods/Cartridges, and E-Liquids, each with 3 to 6 flavor variants, varied stock counts (including some low stock and sold out flavors), and high-contrast SVG/gradient placeholder visuals so the UI looks complete immediately.

3. Configure `src/app/layout.tsx` and `src/app/globals.css` with Google Fonts (`Space Grotesk`, `Plus Jakarta Sans`, `JetBrains Mono`), a `#090A0F` dark background, custom scrollbar hiding utilities (`no-scrollbar`), and subtle radial background glow gradients.
```

### Step 2: 21+ Age Verification Gate & Glassmorphic Sticky Header

```text
Step 2: Build the Age Verification Modal and the Sticky Navigation Header.

1. Create `src/components/AgeVerificationModal.tsx`:
   - Checks `localStorage` for `vape_age_verified === 'true'`.
   - If not verified, displays a full-screen blurred overlay (`backdrop-blur-xl bg-black/80 z-50`) with a sleek glassmorphic card.
   - Includes a warning badge, clear text ("You must be of legal smoking/vaping age (18+/21+) in your jurisdiction to view live inventory"), and two buttons: "I am of Legal Age (Enter)" (saves to localStorage and animates out with Framer Motion) and "Exit" (redirects to google.com).

2. Create `src/components/Navbar.tsx`:
   - Sticky top header (`sticky top-0 z-40 backdrop-blur-md bg-[#090A0F]/80 border-b border-white/10`).
   - Left: Brand logo with a subtle neon icon and "LIVE INVENTORY" pulsing emerald badge showing total available flavors in stock right now.
   - Center/Right: Quick search input (`Cmd/Ctrl + K` shortcut support) that filters products in real time by product name, brand, or specific flavor name (e.g., typing "Lychee" highlights every device that has a Lychee flavor in stock).
   - Right: Toggle switch for "Hide Out of Stock" (`inStockOnly` boolean state) so customers can immediately filter the entire site down to items ready for pickup/delivery today.
```

### Step 3: Spotlight Hero & Multi-Faceted Sticky Filter Bar

```text
Step 3: Build the Featured Drop Hero Banner and the Interactive Category/Spec Filter Bar.

1. Create `src/components/HeroSpotlight.tsx`:
   - A compact, high-impact Bento-style hero section at the top of the catalog.
   - Left card (2/3 width on desktop): Highlights the "Restock of the Week" or "New Arrival" device with animated floating specs (Dual Mesh, Puff Count, Nicotine %), available flavor pills, and a "View Available Flavors" CTA.
   - Right column (1/3 width on desktop): Two stacked status cards:
     - Card A: "Live Stock Counter" showing exact counts of Disposables, Pods, and E-Liquids currently in stock and the timestamp of the last inventory update.
     - Card B: "Quick Pickup / Same-Day Delivery Info" with store hours and one-tap inquiry button.

2. Create `src/components/FilterBar.tsx`:
   - Horizontally scrollable pill bar for Categories: All Items, Disposables, Pod Systems, Replacement Pods, E-Liquids.
   - Secondary filter controls for:
     - Brand dropdown or pills
     - Puff Count range (All, Up to 10K, 15K+, 25K+ Max Puff)
     - Cooling/Ice filter ("Any Ice Level", "High Ice / Menthol", "Low / No Ice")
     - Sort by: "Most Stock Available", "Price: Low to High", "Price: High to Low", "Highest Puff Count".
   - Active filter count badge and a "Reset Filters" button when any filter is active.
```

### Step 4: Interactive Product Cards with Live Flavor Stock Swatches

```text
Step 4: Build the Product Grid and Interactive Product Card component.

1. Create `src/components/ProductCard.tsx`:
   - Glassmorphic card (`bg-zinc-900/60 border border-white/10 rounded-2xl overflow-hidden hover:border-teal-400/40 transition-all duration-300 group`).
   - Top Bar over Image:
     - Left: Category & New Arrival/Featured badge.
     - Right: Aggregate stock badge ("8 Flavors In Stock", "Only 2 Left", or "Restocking Soon") with a glowing status dot.
   - Visual Container:
     - Dynamic ambient background radial glow that shifts color to match the currently hovered/selected `FlavorVariant.colorHex`!
     - Spec chips overlaid at the bottom of the image using `JetBrains Mono`: Puff Count (`25K PUFFS`), Nicotine (`5% NIC`), Coil (`DUAL MESH`).
   - Card Body:
     - Brand name (uppercase tracking-wider muted text), Product Title, and Price prominently formatted.
     - **Interactive Flavor Swatch Selector**: Display clickable flavor pills right on the card.
       - In-stock flavors show their color dot and name; clicking/hovering a flavor pill updates the card's active flavor state, shows its exact remaining stock count (e.g., "Watermelon Ice — 4 left in stock"), and shows small Ice/Sweetness meter bars.
       - Sold-out flavors appear with `line-through opacity-40` so users know the flavor exists but is currently out of stock.
   - Card Footer:
     - "Inspect Specs & Flavors" button (opens Quick-View Drawer/Modal) and a direct "Inquire / Reserve Flavor" action button.
```

### Step 5: Product Quick-View Drawer & Instant Messenger/WhatsApp Inquiry

```text
Step 5: Build the Detailed Product Quick-View Modal and One-Tap Stock Reservation / Inquiry flow.

1. Create `src/components/ProductDetailModal.tsx`:
   - Opens smoothly via Framer Motion when a user clicks a product card.
   - Left side: Large visual preview with dynamic flavor glow, full hardware specification grid (Battery mAh, Charging Port, E-liquid Capacity, Coil Resistance, Airflow Adjustable).
   - Right side: Full interactive list of all flavors for that device.
   - For each flavor row, display:
     - Flavor name and color swatch
     - Ice Level (1–5 snowflake/bar indicators) & Sweetness Level (1–5 bar indicators)
     - Live stock badge (`In Stock (6 pcs)`, `Low Stock (2 pcs)`, or `Out of Stock`)
     - "Select" toggle button (disabled if out of stock)
   - Bottom Sticky Action Bar inside Modal:
     - Once the user selects 1 or more available flavors, display a "Check Availability / Reserve Now" button that generates a pre-filled inquiry message (supporting Messenger, WhatsApp, Viber, or copy-to-clipboard) containing the exact Device Name, Selected Flavor(s), and Price so the shop owner can confirm the order in seconds.
```

### Step 6: Lightweight Admin Stock Manager Mode (Optional Local/Supabase Toggle)

```text
Step 6: Create a Quick Admin Stock Manager Drawer so I can update stock counts from my phone in seconds.

1. Create `src/components/AdminStockDrawer.tsx`:
   - Accessible via a discreet footer button ("Staff Stock Manager") protected by a simple configurable PIN code (default `2026` in `.env.local` or local config).
   - Inside the drawer, list all products and their flavor variants in a compact table/list with instant `+1`, `-1`, and "Mark Sold Out / Restock" toggle buttons.
   - Include an "Export Updated Inventory JSON" button and persist changes to `localStorage` (with a clean adapter structure in `src/lib/inventoryService.ts` so we can connect a Supabase table in one step later).
   - Verify that toggling a flavor's stock to `0` immediately updates the main showcase grid to show that flavor as sold out.
```

### Step 7: Final Polish, Empty States & Mobile Audit

```text
Step 7: Perform a final UI/UX polish pass and build verification.

1. Add a rich Empty State when a user searches for a flavor or brand not in stock, including a "Clear Filters" button and a list of similar in-stock flavor profiles.
2. Add a sticky mobile bottom bar summarizing active filters or selected inquiry items if the user has queued multiple flavors to ask about.
3. Run `npm run build` (or typecheck) to verify there are zero TypeScript or Next.js build errors, and confirm all components render cleanly on both mobile (375px) and desktop (1440px) viewports.
```
