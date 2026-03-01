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
- `src/components/layout/Footer.tsx` — Simple footer, `border-[#1E1E1E]`, `text-[#888888]`
- `src/components/layout/Sidebar.tsx` — Drawer sidebar (5 nav items with SVG icons, opens on hamburger click)
- `src/components/web3/NetworkGuard.tsx` — Chain check + switch button
- `src/components/web3/TxStatus.tsx` — Transaction status toast
- `src/components/common/LoadingSpinner.tsx` — White spinner (3 sizes: sm/md/lg), `border-white/20 border-t-white`
- `src/components/common/Modal.tsx` — Escape + backdrop close
- `src/components/common/Toast.tsx` — Auto-dismiss, 3 variants
- `src/components/common/EmptyState.tsx` — Empty state with optional action

### Done (Step 3 — Landing Page)

**Files:**
- `src/components/landing/Blob.tsx` — 3D particle blob (R3F + custom GLSL shaders). Props: `cameraZ` (default 2.8, use 0.1 for app pages), `isStatic` (auto, skips formation animation + scroll zoom when not on landing)
- `src/app/page.tsx` — Landing page: hero blob + scroll zoom + Launch App + About Us
- `src/app/layout.tsx` — Fonts: Vipnagorgialla (local, display titles "EcoForge" only) + Satoshi (local, body everywhere else). Inline script for scroll-to-top on reload.
- `src/app/globals.css` — Color palette, font variables (--font-sans: Satoshi, --font-display: Vipnagorgialla), marquee animation, hidden scrollbar, user-select none

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
- **Formation animation:** Blob grows from center on page load. Exponential approach to 1.0 (`formationRef += (1-current) * 1.5 * delta`), ~2-3s to full size. `uFormation` uniform multiplies `blobR` in shader.
- **Canvas:** `position: fixed` — blob visible behind all sections as ambient background

**Scroll-Driven Zoom (GSAP + Lenis):**
- 700vh scroll spacer, hero pinned via ScrollTrigger
- 3% delay → zoom 3-80% (camera z=2.8→0.1, ease-in quadratic)
- UI overlay (title + marquee) scales up with scroll → exits frame naturally (same 3-80% range)
- Launch App button: links to `/marketplace`. Simple opacity fade at 55-70% scroll (no scale)
- 80-100%: dwell on button before pin releases
- Scrollbar hidden, user-select none, scroll-to-top on reload
- Lenis smooth scroll, scrub 0.8

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

**Navigation — YouTube-style TopBar + Sidebar Drawer:**
- **Old floating header removed.** Replaced by TopBar + Sidebar drawer.
- **TopBar** (`src/components/layout/Header.tsx` → exports `TopBar`):
  - `sticky top-0 z-30`, height `h-20` (80px)
  - Left: hamburger button (3 lines SVG) + "EcoForge" logo (font-display, links to `/marketplace`)
  - Center: SearchBar (only on `/marketplace` page) — `rounded-full border border-white/80 bg-white/5 backdrop-blur-sm`, max-w-2xl, connected to Zustand store
  - Right: "+" Create circle (48px, links to `/create`, tooltip on hover) + ConnectButton (expand-on-hover disconnect)
- **Sidebar** (`src/components/layout/Sidebar.tsx`) — Drawer, NOT persistent:
  - Closed by default, opens on hamburger click
  - `fixed left-0 top-0 z-50 w-[240px]`, slides in/out with `translate-x` (300ms ease-out)
  - Backdrop: `bg-black/50` overlay, click to close
  - Header row: hamburger + "EcoForge" logo
  - 5 nav items with SVG icons (24x24, outline): Marketplace, Dashboard, Governance, Portfolio, Create
  - Active state: `bg-white/5 text-white`, inactive: `text-white/40 hover:text-white/70`
  - Click on nav item auto-closes sidebar

**Button design convention (Launch App style):**
- All buttons: `border border-white/80 bg-white/5 backdrop-blur-sm` (glass effect)
- No hover effects on buttons

**Custom ConnectButton (circle wallet style):**
- Uses `ConnectButton.Custom` from RainbowKit
- **Disconnected:** Rounded pill, glass style, uppercase "Connect"
- **Connected:** Circle 48px → expands to 155px on hover showing "Disconnect" (centered text)
- **Wrong network:** Red glass pill
- **"+" Create:** Circle 48px with tooltip, glass style

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
- `src/app/(app)/layout.tsx` — Route group layout: Blob background (cameraZ=0.1) + Sidebar drawer + TopBar + page transition animation (DOM clone + framer-motion)
- `src/app/(app)/template.tsx` — Pass-through (animations handled in layout)
- `next.config.ts` — `experimental.viewTransition: true`

**Page transition animation (avax.network-inspired):**
- On internal link click: DOM clone of current content created before React swaps
- Phase 1 (EXIT): TopBar slides up, DOM clone shrinks `scale(0.85)`
- Phase 2 (ENTER): New page slides up from bottom (`y: 100vh → 0`), TopBar returns
- **Clone clip-path (rAF-synced):** A `requestAnimationFrame` loop reads the incoming page's actual `getBoundingClientRect().top` each frame and clips the clone from the bottom via `clip-path: inset(0 0 Xpx 0)`. The clip offset is dynamic: `newPage.offsetHeight * 0.6` (proportional to page height, adapts to different pages). This erases the old content exactly where the new page arrives — no independent timing/easing to manage.
- Phase 3 (IDLE): Clone removed, stable state
- First page load: no animation (skip via `hasNavigated` ref)
- Blob visible as ambient background on ALL app pages (fixed, z-0)
- **WIP:** clip-path speed curve still being tuned (ralentissement vers le haut de l'écran)

**Credit components:**
- `src/components/credits/CreditCard.tsx` — Card: project name (left) + origin badge (right) on top row, projectType/region, tonnes + price. No hover effects.
- `src/components/credits/CreditOriginBadge.tsx` — Certified (green) / Community (blue) badge
- `src/components/credits/CreditStatusBadge.tsx` — Verified/Pending/Suspended/Retired badges
- `src/components/credits/ImpactScoreBadge.tsx` — Colored dot + score number (removed from CreditCard, kept for detail page)
- `src/components/credits/SearchBar.tsx` — **Deprecated** (search now in TopBar, connected to Zustand store, only on `/marketplace`)
- `src/components/credits/CreditFilters.tsx` — YouTube-style horizontal pill row, single line, separated by vertical bars (`bg-white/40`). Active: `bg-white text-background`. Inactive: `bg-white/10`. Toggle on re-click. Reset "✕" button.
- `src/components/credits/TradePanel.tsx` — Buy panel (amount input, total calc, tx lifecycle)
- `src/components/credits/ChallengeButton.tsx` — Dispute button + Modal
- `src/components/credits/RetireButton.tsx` — Burn/retire with amount input

**Reward components:**
- `src/components/rewards/TokenBalance.tsx` — Governance token balance + % supply
- `src/components/rewards/MilestoneProgress.tsx` — Progress bar + 7 tier indicators

**Pages (all 7 internal pages done):**
- `/dashboard` — Wallet guard, 4 stat cards (portfolio value, credits held, CO2 offset, governance tokens w/ milestone bar), 3 tabs (Holdings table, Retired credits, Trade history). Merged from old dashboard + portfolio pages.
- `/marketplace` — YouTube-style filters (horizontal pills) + credit count (right-aligned) + sorted credit grid. Search bar is in TopBar (not on page).
- `/marketplace/[creditId]` — Credit detail + TradePanel + ChallengeButton + RetireButton
- `/create` — Dual-path form (Certified/Community) with all fields + tx submission
- `/governance` — Proposals list with ProposalCard (type badge, status, vote bar)
- `/governance/[proposalId]` — Proposal detail with vote FOR/AGAINST buttons
- `/governance/disputes` — Disputes list + challenge submission form (stake-to-dispute)

### TODO (Steps 7-8)
- Step 7: Server Actions (generateImpactScore, analyzeDispute) — mocked
- Step 8: IPFS service (Lighthouse)

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
