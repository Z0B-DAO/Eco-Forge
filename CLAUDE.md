# CLAUDE.md — EcoForge Project Context

## What is EcoForge?

Decentralized platform on Avalanche C-Chain for tokenizing and trading carbon credits as real-world assets, powered by AI (Claude API). Carbon credits are represented as ERC-1155 tokens with two origins: Certified (bridged from Verra/Gold Standard registries) and Community Verified (submitted directly, validated by AI + DAO).

## Architecture — Zero Backend

There is NO backend, NO database, NO API routes. All data lives on-chain (Avalanche) or on IPFS (Lighthouse). The only server-side code is 2 Next.js Server Actions that call the Claude API.

```
Frontend (Next.js) → Server Actions ("use server") → Claude API (Anthropic)
Frontend (Next.js) → wagmi/viem → Avalanche C-Chain (Smart Contracts)
Frontend (Next.js) → Lighthouse SDK → IPFS (permanent storage)
Chainlink Functions → Smart Contracts (push AI scores on-chain)
```

## Tech Stack

- **Blockchain:** Avalanche C-Chain, Fuji Testnet (chainId 43113), Solidity ^0.8.20
- **Smart Contract Framework:** Foundry (forge, cast, anvil) — NOT Hardhat
- **Frontend:** Next.js 14+ (App Router), TypeScript, Tailwind CSS
- **Package Manager:** pnpm
- **Web3:** wagmi v2 + viem, RainbowKit
- **AI:** Anthropic Claude API (Sonnet 4.6) via Server Actions only — **mocked for now** (SDK not installed yet)
- **IPFS:** Lighthouse (permanent storage via Filecoin) — NOT Pinata
- **Oracle:** Chainlink Functions (serverless)
- **Scroll/Animation:** GSAP (ScrollTrigger) + Lenis (smooth scroll) + framer-motion (page transitions)
- **State:** Zustand (1 store: useMarketStore)
- **Charts:** Recharts

## Smart Contracts (5 for MVP)

1. **CarbonCredit.sol** (ERC-1155) — Carbon credit tokens. Hybrid model: Certified (bridged from registries with anti-double-bridge hash check) + Community Verified (native, AI + DAO validated). Includes blacklist for fraudulent issuers. `tonnesCO2e` stored on-chain for portfolio calculations.

2. **Marketplace.sol** — List/buy/sell credits. Tracks `lastSoldPrice` per credit for portfolio valuation. Platform fee sent to DAO treasury.

3. **EcoForgeGovernance.sol** — DAO with 2 scopes only: Credit Eligibility + Dispute Resolution. Stake-to-dispute mechanism (challengers must lock governance tokens). Auto-creates proposals from disputes. Executes punishment on fraud (blacklist issuer + burn all tokens).

4. **EcoForgeToken.sol** (ERC-20) — Governance token. NON-TRANSFERABLE (soulbound). Milestone-based rewards: actions are counted per wallet, tokens minted at tiers (5→1, 15→2, 30→3, 50→5, 100→8, 200→13, 500→21). Daily action cap per wallet (anti-sybil). Can be burned as punishment for fraud or false disputes.

5. **EcoForgeOracle.sol** — Chainlink Functions client. Pushes AI-generated impact scores on-chain.

**NOT in MVP:** PredictionPool.sol (V2)

## Server Actions (2 only)

```
actions/generateImpactScore.ts  — Claude Vision + text, used on BOTH credit types
actions/analyzeDispute.ts       — Claude Vision + text, analyzes disputes
```

The Anthropic API key is NEVER exposed client-side.

## Pages (8 for MVP)

| Route | Purpose |
|---|---|
| `/` | Landing page (public, no wallet needed) |
| `/dashboard` | User overview: stats, holdings, retired credits, trade history, governance tokens + milestones |
| `/marketplace` | Browse, search, filter, buy credits |
| `/marketplace/[creditId]` | Credit detail, AI score, buy/sell, challenge |
| `/create` | Tokenize credit (Certified or Community path) |
| `/governance` | Proposals + disputes list |
| `/governance/[proposalId]` | Vote FOR/AGAINST |
| `/governance/disputes` | Disputed credits, submit challenges |

**NOT in MVP:** /predictions (V2)

## Two Credit Creation Paths

**Certified (from Verra/Gold Standard):**
1. Issuer provides retirement proof (serial number)
2. Contract checks `usedRetirementProofs[hash]` — reverts if already bridged
3. AI verification (mandatory) — checks proof/data consistency
4. If AI confidence high → Verified immediately. If low → Pending.

**Community (native submission):**
1. Issuer submits project data + satellite image (mandatory)
2. AI verification (mandatory) — generates impact score
3. Minted as Pending → 7-day DAO challenge period
4. If no successful challenge → Verified → tradeable

## Punishment System

- **Fraudulent credit detected (DAO vote):** Credit suspended + issuer ALL tokens burned + issuer blacklisted forever
- **False dispute:** Challenger's staked governance tokens burned
- **Successful dispute:** Challenger gets tokens back + bonus reward

## Current Progress

### Done (Step 1 — Foundation)
- `src/types/contracts.ts` — All on-chain TypeScript types (enums, interfaces, events)
- `src/types/ai.ts` — AI response types (ImpactScore, DisputeAnalysis)
- `src/types/index.ts` — Re-exports
- `src/services/web3/contracts.ts` — ABIs for 5 contracts + CONTRACT_ADDRESSES
- `src/lib/utils.ts` — 9 helper functions (formatAvax, truncateAddress, etc.)

### Done (Step 2 — Layout + Common Components)
- `src/components/layout/Header.tsx` — Exports `TopBar` (YouTube-style: hamburger + logo + search + wallet)
- `src/components/layout/Footer.tsx` — Marquee sandwich footer (orange 3px + white marquee + orange 3px), `fixed bottom-0 z-[55] pointer-events-none`. Exports `FOOTER_H` (28px). Same marquee as landing page.
- `src/components/layout/Sidebar.tsx` — Drawer sidebar (5 nav items with SVG icons, opens on hamburger click)
- `src/components/web3/NetworkGuard.tsx` — Chain check + switch button
- `src/components/web3/TxStatus.tsx` — Transaction status toast
- `src/components/common/LoadingSpinner.tsx` — Exports `LoadingBar` (wrapper: progress bar synced with real loading state, steps 0→40→65→77→85→100%, shows children once complete) + legacy `LoadingSpinner` (indeterminate sliding bar)
- `src/components/common/Modal.tsx` — Escape + backdrop close
- `src/components/common/Toast.tsx` — Auto-dismiss, 3 variants
- `src/components/common/EmptyState.tsx` — Empty state with optional action

### Done (Step 3 — Landing Page)

**Files:**
- `src/components/landing/Blob.tsx` — 3D particle blob (R3F + custom GLSL shaders). No props — camera controlled via window globals. Shared instance across all pages (never unmounts).
- `src/components/layout/SharedBlob.tsx` — Client wrapper for dynamic import of Blob (used in root layout)
- `src/app/page.tsx` — Landing page: scroll zoom + Launch App + About Us (no Blob render — uses shared blob)
- `src/app/layout.tsx` — Fonts + `<SharedBlob />` (shared blob instance for entire app). Inline script for scroll-to-top on reload.
- `src/app/globals.css` — Color palette, font variables (--font-sans: Satoshi, --font-display: Vipnagorgialla), marquee animation, hidden scrollbar, user-select none, `overscroll-behavior: none` on html+body (disables macOS rubber-band bounce)

**Blob Architecture (single StreakParticles component, all particles in one Points system):**
- **Peau (skin):** 255k particles (95k uniform + 85k rim ±15° + 75k ultra-rim ±5°)
  - Rim shader: `smoothstep(0.05, 0.85, rim)` — dense edge, particles fade toward center
- **Reflets:** 1 long (1200 PPL, depth 0.95) + 1-2 small curled (250-450 PPL, high curvature, rim-biased). Count randomized (2 or 3 total, 50/50).
- **Halo:** 20 layers per reflet particle, steep gradient (pow 2.5), spread 0.126
- **Golden highlight:** Right side tinted gold
- **Click reaction — Directional:** Raycaster on invisible sphere (r=0.95) determines click on/outside blob.
  - **Click ON blob:** Noise deformation weighted by proximity to click point. Amplitude 1.2. Focused via `smoothstep(-0.6, 1.0)`.
  - **Click OUTSIDE blob:** Localized inward compression on closest surface (`smoothstep(0.1, 0.95)`), rest of blob reacts with normal noise deformation. No whole-blob translation.
  - Random seed per click (unique shapes). Impulse 1.0, decay 0.978/frame (~3s). Delta capped at 100ms. Time wraps at 10000s.
- **Spontaneous pulses:** Removed (caused periodic visual glitch — instantaneous impulse broke animation continuity).
- **Formation animation:** Blob grows from center on first mount only. Exponential approach to 1.0 (`formationRef += (1-current) * 1.5 * delta`), ~2-3s to full size. `uFormation` uniform multiplies `blobR` in shader. Never replays (blob never unmounts).
- **Canvas:** `position: fixed` — blob visible behind all sections as ambient background. Single instance in root layout, shared across all routes.

**Shared Blob Architecture (camera controlled via window globals):**
- `window.__scrollProgress` (set by landing page) → scroll-driven zoom, camera z: 2.8 → 0.1
- `window.__blobTargetZ` (set by app layout on mount, value: 0.1) → static camera position for app pages
- `window.__blobDezoom` (set by app layout on Exit/Disconnect) → dezoom animation, camera z: 0.1 → 2.8
- `window.__blobDezoomProgress` (set by BlobScene during dezoom) → progress 0→1, read by dezoom overlay
- Priority: `__scrollProgress` > `__blobDezoom` > `__blobTargetZ`
- Blob Canvas WebGL context **never destroyed** across route changes — zero flash on navigation

**Scroll-Driven Zoom (GSAP + Lenis):**
- 700vh scroll spacer, hero pinned via ScrollTrigger
- 3% delay → zoom 3-80% (camera z=2.8→0.1, ease-in quadratic)
- UI overlay (title + orange/white/orange marquee sandwich) scales up with scroll → exits frame naturally (same 3-80% range)
- **Marquee sandwich:** 3px `#E84142` orange bar on top + white marquee bar + 3px `#E84142` orange bar on bottom. Same sandwich in dezoom overlay.
- Launch App button: links to `/marketplace`. No hover effects. Opacity fade at 60-70% scroll, clickable at 65%. No scale.
- 80-100%: dwell on button before pin releases
- Scrollbar hidden, user-select none, scroll-to-top on reload
- Lenis smooth scroll, scrub 0.8
- **Cleanup on unmount:** Lenis stop+destroy, all ScrollTrigger killed + clearScrollMemory + refresh, ticker removed, GSAP pin-spacer divs removed from DOM, scrollRestoration reset to "auto", scroll forced to 0

**About Us Section (below hero):**
- Full transparent background (blob visible behind)
- "About us :" title in Satoshi (body font, not Vipnagorgialla)
- DeVinci Blockchain: logo image + text (body font)
- Two circular avatars: Armand SÉCHON (`/images/Nft-armand.png`) + Noé WALES (`/images/avatar-noe.png`)
- **Flip cards:** Hover avatar → 3D Y-axis flip (500ms, perspective 1000px) → back face shows mirrored avatar image (transparent card effect) with dark overlay (bg-black/70) + X, LinkedIn, GitHub SVG icons (white, hover scale 1.25). Click icon → opens link (stopPropagation). Auto-flip back after 250ms when mouse leaves (each card independent, separate timers).
- `AvatarCard` component with props: name, image, imageStyle, x, linkedin, github

**NOT implemented (decided against):**
- Custom cursor system (user decided no)
- Explosion click reaction (type A) — went with deformation (type B) instead

**TODO (Landing Page):**
- Add content sections between Launch App and About Us (project info)

### Done (Step 6.5 — Typography + Navigation Redesign)

**Typography system (dual font):**
- **Satoshi** (`--font-sans`) — Body font for EVERYTHING. Loaded via `next/font/local` (woff2, 3 weights: 400/500/700).
- **Vipnagorgialla** (`--font-display`) — Display font ONLY for "EcoForge" logo text. Loaded via `next/font/local`.

**Navigation — YouTube-style TopBar + Always-Visible Sidebar:**
- **TopBar** (`src/components/layout/Header.tsx` → exports `TopBar`):
  - `fixed top-0 left-0 right-0 z-[60]` with `border border-white rounded-2xl`, height `h-20` (80px)
  - Full width, does NOT shift when sidebar opens. Fixed position above sidebar (z-[60] > z-50). Always visible — content scrolls underneath.
  - Left: hamburger button (48px circle, 3 lines SVG, glass style, click toggles sidebar, hover opens sidebar) + "EcoForge" logo (font-display, links to `/marketplace`)
  - Center: SearchBar (only on `/marketplace` page) — `rounded-full border border-white/80 bg-white/5 backdrop-blur-sm`, max-w-2xl, connected to Zustand store
  - Right: ConnectButton (expand-on-hover disconnect)
- **Sidebar** (`src/components/layout/Sidebar.tsx`) — Always-visible icon bar + push expand:
  - **Always visible** at collapsed width (82px, `SIDEBAR_COLLAPSED`). Shows 5 nav items as 48px glass circles (`border border-white/80 bg-white/5 backdrop-blur-sm rounded-full`). Collapsed width = 1px border + 16px padding + 48px button + 16px padding + 1px border = 82px — circles perfectly aligned with hamburger button above.
  - Expands to 260px (`SIDEBAR_EXPANDED`) on hover (`onMouseEnter`/`onMouseLeave`). Circles expand into pills with text labels fading in (same expand animation as connect/disconnect button). Width transition via CSS `transition-[width] duration-300`.
  - `fixed left-0 top-0 z-50`, `motion.aside` with `animate={{ x }}` (0.8s for page transition hiding)
  - Spacer `h-[82px]` aligns nav below TopBar, nav frame: `border border-white rounded-t-2xl border-b-0 bg-background px-4 py-2`
  - 5 nav items with SVG icons (24x24, strokeWidth 2, outline): Marketplace, Dashboard, Governance, Create, **Exit** (in line with others, NOT at bottom)
  - Active state: `border-white bg-white/10 text-white`, inactive: `border-white/80 bg-white/5 text-white/70 hover:text-white`
  - Click on nav item auto-closes sidebar
  - `hiding` prop: during page transition (pre/exit/enter phases), sidebar slides out left in 0.8s
  - Exports `SIDEBAR_COLLAPSED` (82) and `SIDEBAR_EXPANDED` (260) constants
  - **Push behavior:** Content area shifts right — `marginLeft: SIDEBAR_EXPANDED - 1` (open) or `SIDEBAR_COLLAPSED - 1` (closed) with CSS transition 300ms

**Button design convention (Launch App style):**
- All buttons: `border border-white/80 bg-white/5 backdrop-blur-sm` (glass effect)
- No hover effects on buttons

**Custom ConnectButton (circle wallet style):**
- Uses `ConnectButton.Custom` from RainbowKit
- **Disconnected:** Rounded pill, glass style, uppercase "Connect"
- **Connected:** Circle 48px (wallet icon 32px) → expands to 155px on hover showing "Disconnect" (centered text). On disconnect → dispatches `ecoforge:exit` custom event → triggers dezoom animation → navigates to `/`
- **Wrong network:** Red glass pill

**RainbowKit custom theme (`ecoForgeTheme`):**
- Full custom `Theme` object in `providers.tsx`
- Modal: black `#0B0B0B` bg, white/5 border, 8px radius, blur(8px) overlay

**Backup:** `src/components/landing/Blob.backup.tsx` — pre-directional-click version

### Done (Step 4 — Hooks)
16 custom hooks in `src/hooks/`:
- **Read hooks:** `useCredits`, `useCreditDetail`, `useMarketplace`, `useLastSoldPrice`, `useGovernanceToken`, `useMilestoneProgress`, `useProposals`, `useTradeHistory`, `useRetiredCredits`, `useSearchCredits`, `useUserPortfolio`
- **Write hooks:** `useBuyCredit`, `useListCredit`, `useRetireCredit`, `useVote`, `useDispute`
- **Config:** `src/services/web3/config.ts` — wagmi config (Fuji chain, RPC, WalletConnect)
- **Barrel export:** `src/hooks/index.ts`

Pattern: scan events with `getLogs` → collect IDs → `readContract` per ID (no `getAll()` in Solidity). Write hooks return full tx lifecycle: `isPending` → `isConfirming` → `isConfirmed`.

### Done (Step 5 — Zustand Store)
- `src/stores/useMarketStore.ts` — Marketplace UI state (query, origin, status, sortBy, priceMin/Max, scoreMin/Max, projectTypes, regions). Client-side filtering only, no indexer.

### Done (Step 6 — Feature Pages + Components)

**Infrastructure:**
- `src/app/providers.tsx` — RainbowKit + wagmi + React Query + custom `ecoForgeTheme` (full Theme object)
- `src/app/(app)/layout.tsx` — Route group layout: sets `__blobTargetZ=0.1` + Sidebar + TopBar + page transition animation (DOM clone + framer-motion) + dezoom animation (Exit/Disconnect)
- `src/app/(app)/template.tsx` — Pass-through (animations handled in layout)
- `next.config.ts` — `reactStrictMode: false` (no viewTransition — conflicts with custom framer-motion transitions)

**Page transition animation (avax.network-inspired) — 4 phases:**
- Triggered by `navKey` counter (increments on every internal link click, including same-page navigation)
- On click: DOM clone created, real content hidden via `el.style.visibility = "hidden"` (sync DOM, prevents flash)
- Links to `/` trigger dezoom animation instead of page transition (see Dezoom section below)
- **Phase 1 (EXIT, 0→600ms):** TopBar slides up (`y: -100%`, 0.8s), Sidebar slides left (0.8s, same timing). DOM clone shrinks `scale(0.85)`. Real content teleported to `y: 100vh` with `duration: 0` (invisible behind clone).
- **Phase 2 (ENTER, 600ms→1800ms):** `scrollTo(0,0)`. Content visibility restored in first rAF tick. New page slides up from `y: 100vh` to `y: -80px` (covers TopBar area, 1.2s ease-in-out `[0.45, 0, 0.1, 1]` — starts slow, accelerates, decelerates gently at top). Clone is clipped by rAF loop as new page covers it.
- **Pause (1800ms→2000ms):** 200ms rest before settle.
- **Phase 3 (SETTLE, 2000ms→2600ms):** TopBar slides back down (`y: 0`), new page shifts from `y: -80px` to `y: 0` (pushed down by TopBar, 0.6s). Clone force-removed + visibility safety net.
- **Phase 4 (IDLE, 2600ms+):** Stable state, `duration: 0` on motion.div.
- **Single motion.div** always rendered (no conditional div/motion.div swap — prevents flash on mount).
- **Clone clip-path (rAF-synced):** Runs during ENTER phase only. Reads `newPage.getBoundingClientRect().top` and `clone.getBoundingClientRect()` each frame. Converts screen-space clip to element-space (accounts for clone's animated `scale(0.85)` transform): `elementClip = screenClip / scale`. Also restores `visibility` on first tick.
- **First page load (from landing):** Uses `"pre"` phase (positions everything off-screen with `duration: 0`, no `initial` prop — avoids strict-mode double-mount bugs). `hasInitialized` ref guards against duplicate setup. Sequence: pre → rAF → enter (1.2s) → settle (+1400ms) → idle (+2000ms). Timers created inside rAF with no cleanup (immune to strict-mode teardown).
- **Scroll reset:** `useEffect([pathname])` forces `scrollTo(0,0)` at 0ms, 50ms, 150ms (handles GSAP/Lenis scroll residue from landing page).
- Blob visible as ambient background on ALL pages (shared instance in root layout, fixed, z-0)
- Parent container: `overflow-hidden` during animation, `overflow-x-hidden` at rest
- **Fixed header + footer layout:** TopBar `fixed top-0 z-[60]`, Footer `fixed bottom-0 z-[55]`. Content wrapper has `paddingTop: TOPBAR_H` (80px) + `paddingBottom: FOOTER_H` (28px) on main. Content `minHeight: calc(100vh - 80px)` — no scroll when content fits, normal scroll when it overflows (header + footer always visible).

**Dezoom animation (Exit/Disconnect → Landing Page):**
- Triggered by: clicking Exit link (`href="/"`) in sidebar OR Disconnect button (dispatches `ecoforge:exit` custom event)
- Click handler intercepts `href="/"` links: `e.preventDefault()` + `setDezooming(true)`
- `ecoforge:exit` event listener also sets `setDezooming(true)`
- **On dezooming:**
  1. `delete window.__blobTargetZ` → frees camera from 0.1 lock
  2. `window.__blobDezoom = { active: true, onComplete: () => router.push("/") }` → BlobScene lerps camera z from 0.1 → 2.8 (speed 3.5x, ~1.2s)
  3. UI wrapper: `opacity: 0` (CSS transition 1s) + `pointerEvents: none` → app UI fades out
  4. Dezoom overlay appears: title "EcoForge" + orange/white/orange marquee sandwich bar, scaled inversely with dezoom progress. Formula: `scale = 1 + (1-progress)² × 8` (same as landing page zoom but reversed). At start: scale(9) (off-screen). At end: scale(1) (normal position). rAF loop reads `window.__blobDezoomProgress` and updates overlay transform.
  5. Camera reaches 2.75 → `onComplete()` → `router.push("/")` → landing page mounts with scroll zoom ready
- **Zero flash:** shared blob Canvas never unmounts. Title + marquee enter the frame smoothly during dezoom.
- Sidebar auto-closes when dezoom starts
- Footer is outside the dezoom opacity wrapper — always visible during dezoom (dezoom overlay has its own marquee at z-[70] above)

**Card-style page layout:**
- Content wrapped in bordered card: `border border-white rounded-t-2xl border-b-0` (white border, rounded top corners, no bottom border)
- TopBar also bordered: `border border-white rounded-2xl`
- Content starts below fixed TopBar via `paddingTop: TOPBAR_H` on parent div, connected with `-mt-px`
- Border width matches button borders (1px) for visual consistency
- **Footer:** Marquee sandwich `fixed bottom-0 z-[55]`, always visible on all app pages. `pointer-events-none`. Content has `paddingBottom: FOOTER_H` so last elements aren't hidden behind footer.

**Credit components:**
- `src/components/credits/CreditCard.tsx` — Card: project name (left) + origin badge (right) on top row, projectType/region, tonnes + price. `border-[0.5px] border-white/60 bg-[#111111]`. No hover effects.
- `src/components/credits/CreditOriginBadge.tsx` — Certified (turquoise/teal) / Community (blue) badge
- `src/components/credits/CreditStatusBadge.tsx` — Verified (white)/Pending/Suspended/Retired badges
- `src/components/credits/ImpactScoreBadge.tsx` — Colored dot + score number (removed from CreditCard, kept for detail page)
- `src/components/credits/SearchBar.tsx` — **Deprecated** (search now in TopBar, connected to Zustand store, only on `/marketplace`)
- `src/components/credits/CreditFilters.tsx` — YouTube-style horizontal pill row, single line, separated by vertical bars (`bg-white/40`). Active: `bg-white text-background`. Inactive: `bg-white/10`. No hover effects. Toggle on re-click. Reset "✕" button.
- `src/components/credits/TradePanel.tsx` — Buy panel (custom −/+ buttons, seller address full with click-to-copy, gas fee estimate, total calc, tx lifecycle). All values in `font-mono`. Seller address styled identically to Issuer (`text-zinc-100`, no hover). Card style `border-[0.5px] border-white/60 bg-[#111111]`.
- `src/components/credits/ChallengeButton.tsx` — Dispute button (card style) + Modal
- `src/components/common/AvaxLogo.tsx` — AVAX logo SVG component (red circle `#E84142` + white triangle), `size` prop, `align-middle`
- `src/components/credits/RetireButton.tsx` — Burn/retire with amount input

**Reward components:**
- `src/components/rewards/TokenBalance.tsx` — Governance token balance + % supply
- `src/components/rewards/MilestoneProgress.tsx` — Progress bar + 7 tier indicators

**Pages (all 7 internal pages done):**
- `/dashboard` — Wallet guard, full wallet address (click-to-copy with overlay animation), 4 stat cards (`border-[0.5px] border-white/60 bg-[#111111]`, portfolio value with `<AvaxLogo />`, credits held, CO2 offset, governance tokens w/ milestone bar), 3 tabs (Holdings, Retired, History) with `LoadingBar` wrapper. All AVAX amounts use `<AvaxLogo />` instead of text. StatsRow uses `useRef` to prevent re-rendering skeletons on tab switch.
- `/marketplace` — YouTube-style filters (horizontal pills, `sticky top-[80px] z-30 bg-background` — stays below fixed TopBar on scroll) + credit count (right-aligned) + sorted credit grid. Search bar is in TopBar (not on page).
- `/marketplace/[creditId]` — 2-column layout. Left: Back button (card style) + title with badges inline + 6 InfoRow cards (Total Supply, Tonnes CO2e, Credit ID, Vintage Year, Impact Score (AI Generated), Registry) + Your Holdings (`font-mono` number + retire inline). Right: Challenge button (card style, aligned with Back) + Issuer (full address, click-to-copy, break-all) + TradePanel (flex-1, all values `font-mono`, bottom aligns with Your Holdings). All cards use same `border-[0.5px] border-white/60 bg-[#111111]` style.
- `/create` — Dual-path form (Certified/Community) with all fields + tx submission
- `/governance` — Proposals list with ProposalCard (type badge, status, vote bar)
- `/governance/[proposalId]` — Proposal detail with vote FOR/AGAINST buttons
- `/governance/disputes` — Disputes list + challenge submission form (stake-to-dispute)

### TODO (Steps 7-8)
- Step 7: Server Actions (generateImpactScore, analyzeDispute) — mocked
- Step 8: IPFS service (Lighthouse)

## Design System — Monochrome

- **Color palette:** Mostly monochrome (white/black/zinc) with accent colors. AVAX red `#E84142` for branding (marquee sandwich bars). Teal for Certified badges. Blue for Community badges and "Listed" trade type.
- **AVAX branding:** All "AVAX" text replaced by `<AvaxLogo />` SVG component (`src/components/common/AvaxLogo.tsx`). Red circle + white triangle, `size` prop, `align-middle` for vertical centering.
- **Card style:** `border-[0.5px] border-white/60 bg-[#111111]` — thin white border, dark fill (not as dark as page background). Used consistently for ALL cards, info boxes, and Back/Challenge buttons.
- **Buttons:** `border border-white/80 bg-white/5 backdrop-blur-sm` (glass effect), no hover color changes
- **Badges:** Certified: `bg-teal-500/15 text-teal-400 border-teal-500/30` (turquoise). Community: `bg-blue-500/15 text-blue-400 border-blue-500/30` (blue). Contextual: red for errors, yellow for pending.
- **Loading:** `LoadingBar` component wraps content, progress bar synced with real loading state (steps: 0→40%→65%→77%→85%, then →100% when data arrives, content revealed after 400ms)
- **Copy animation:** Solid `bg-zinc-900` rounded overlay on `absolute inset-0` with checkmark + "Copied" text, fade-in 200ms

## Key Conventions

- All smart contract events use `indexed` parameters for frontend `getLogs` filtering
- All on-chain reads use wagmi hooks (`useReadContract`, `getLogs`)
- No REST API — only Server Actions
- No database — all state is on-chain or IPFS
- Foundry for contracts: `forge build`, `forge test`, `forge script`
- Foundry config: set `src = "contracts"` in foundry.toml to avoid conflict with Next.js `src/`
- Frontend sources in `src/` (Next.js app directory)
- No unnecessary comments in code — explain in conversation, keep code clean
- Git: frontend work on `frontend` branch, smart contracts on separate branch
- tsconfig.json target set to ES2020 (for BigInt support)
- Fonts: Satoshi (body, `next/font/local`, woff2) + Vipnagorgialla (display, `next/font/local`). NOT @import in CSS (breaks Tailwind v4)
- Landing page has its own layout (no Header/Footer) — use route group `(app)` for internal pages
- Blob is in root layout (`SharedBlob`) — do NOT render `<Blob />` in individual pages or layouts

## Spec Files

- `ECOFORGE_SPEC.md` — Full project specification (contracts, AI, oracle, architecture, roadmap)
- `FRONTEND_SPEC.md` — Frontend specification (pages, components, hooks, data sources, file structure)
- `ecoforge-landing-prompt/` — Original landing page spec + 15 ref images (diverged from spec, kept for visual reference only)

## Environment Variables Required

```
ANTHROPIC_API_KEY              # Claude API (server-side only) — not used yet (mocked)
LIGHTHOUSE_API_KEY             # IPFS uploads
NEXT_PUBLIC_WALLETCONNECT_ID   # WalletConnect project ID (free at cloud.walletconnect.com)
FUJI_RPC_URL                   # Avalanche Fuji testnet
SNOWTRACE_API_KEY              # Contract verification
DEPLOYER_PRIVATE_KEY           # Contract deployment (never commit)
NEXT_PUBLIC_CHAIN_ID=43113     # Fuji
NEXT_PUBLIC_AVALANCHE_RPC      # Public RPC for frontend
NEXT_PUBLIC_*_ADDRESS          # Deployed contract addresses
```

## What NOT to do

- Do NOT add a backend, database, or API routes
- Do NOT implement PredictionPool or TrendForecast (V2)
- Do NOT use Hardhat (use Foundry)
- Do NOT use Pinata (use Lighthouse)
- Do NOT expose the Anthropic API key to the client
- Do NOT make governance tokens transferable
- Do NOT skip AI verification on Certified credits
