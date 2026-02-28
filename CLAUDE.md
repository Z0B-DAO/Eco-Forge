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
- **Scroll/Animation:** GSAP (ScrollTrigger) + Lenis (smooth scroll)
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

## Pages (9 for MVP)

| Route | Purpose |
|---|---|
| `/` | Landing page (public, no wallet needed) |
| `/dashboard` | User overview: credits, tokens, milestones, activity |
| `/marketplace` | Browse, search, filter, buy credits |
| `/marketplace/[creditId]` | Credit detail, AI score, buy/sell, challenge |
| `/create` | Tokenize credit (Certified or Community path) |
| `/governance` | Proposals + disputes list |
| `/governance/[proposalId]` | Vote FOR/AGAINST |
| `/governance/disputes` | Disputed credits, submit challenges |
| `/portfolio` | Holdings, retired credits, trade history, CO2 total |

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
- `src/components/layout/Header.tsx` — Sticky header with nav + ConnectButton
- `src/components/layout/Footer.tsx` — Simple footer (server component)
- `src/components/layout/Sidebar.tsx` — Reusable sidebar
- `src/components/web3/NetworkGuard.tsx` — Chain check + switch button
- `src/components/web3/TxStatus.tsx` — Transaction status toast
- `src/components/common/LoadingSpinner.tsx` — 3 sizes
- `src/components/common/Modal.tsx` — Escape + backdrop close
- `src/components/common/Toast.tsx` — Auto-dismiss, 3 variants
- `src/components/common/EmptyState.tsx` — Empty state with optional action

### Done (Step 3 — Landing Page)

**Files:**
- `src/components/landing/Blob.tsx` — 3D particle blob (R3F + custom GLSL shaders)
- `src/app/page.tsx` — Landing page: hero blob + scroll zoom + Launch App + About Us
- `src/app/layout.tsx` — Font: Vipnagorgialla (local). Inline script for scroll-to-top on reload.
- `src/app/globals.css` — Color palette, font variables, marquee animation, hidden scrollbar, user-select none

**Blob Architecture (single StreakParticles component, all particles in one Points system):**
- **Peau (skin):** 255k particles (95k uniform + 85k rim ±15° + 75k ultra-rim ±5°)
  - Rim shader: `smoothstep(0.05, 0.85, rim)` — dense edge, particles fade toward center
- **Reflets:** 3 lines (2 at depth 0.95, 1 at depth 0.75), 1200 PPL each
- **Halo:** 20 layers per reflet particle, steep gradient (pow 2.5), spread 0.126
- **Golden highlight:** Right side tinted gold
- **Click reaction:** Heavy low-freq deformation. Random seed per click (unique shapes). Impulse 1.0, decay 0.978/frame (~3s). Amplitude 0.75. Listener on `window` (not canvas).
- **Spontaneous pulses:** Every 6-11s, small impulse (0.15)
- **Canvas:** `position: fixed` — blob visible behind all sections as ambient background

**Scroll-Driven Zoom (GSAP + Lenis):**
- 700vh scroll spacer, hero pinned via ScrollTrigger
- 3% delay → zoom 3-80% (camera z=2.8→0.1, ease-in quadratic)
- UI overlay (title + marquee) scales up with scroll → exits frame naturally (same 3-80% range)
- Launch App button: simple opacity fade at 55-70% scroll (no scale)
- 80-100%: dwell on button before pin releases
- Scrollbar hidden, user-select none, scroll-to-top on reload
- Lenis smooth scroll, scrub 0.8

**About Us Section (below hero):**
- Full transparent background (blob visible behind)
- "About us :" title in Vipnagorgialla
- DeVinci Blockchain: logo image + text (font-display)
- Two circular avatars: Armand SÉCHON (`/images/Nft-armand.png`) + Noé WALES (`/images/avatar-noe.png`)
- **Flip cards:** Click avatar → 3D Y-axis flip (500ms, perspective 1000px) → back face shows mirrored avatar image (transparent card effect) with dark overlay (bg-black/70) + X, LinkedIn, GitHub SVG icons (white, hover scale 1.25). Click icon → opens link (stopPropagation). Click card again → flips back. Auto-flip back after 250ms when mouse leaves (each card independent, separate timers). Links set to "#" placeholder — need real URLs.
- `AvatarCard` component with props: name, image, imageStyle, x, linkedin, github

**NOT implemented (decided against):**
- Custom cursor system (user decided no)
- Explosion click reaction (type A) — went with deformation (type B) instead

**TODO (Landing Page):**
- Add content sections between Launch App and About Us (project info)
- Set Launch App button target (currently href="#" — decide /dashboard or /marketplace)

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
- `src/app/providers.tsx` — RainbowKit + wagmi + React Query + darkTheme
- `src/app/(app)/layout.tsx` — Route group layout (Header + Footer for internal pages)

**Credit components:**
- `src/components/credits/CreditCard.tsx` — Clickable card for marketplace grid
- `src/components/credits/CreditOriginBadge.tsx` — Certified (green) / Community (blue) badge
- `src/components/credits/CreditStatusBadge.tsx` — Verified/Pending/Suspended/Retired badges
- `src/components/credits/ImpactScoreBadge.tsx` — Colored dot + score number
- `src/components/credits/SearchBar.tsx` — Input connected to Zustand store
- `src/components/credits/CreditFilters.tsx` — Filter chips (origin/status/sort) + reset
- `src/components/credits/TradePanel.tsx` — Buy panel (amount input, total calc, tx lifecycle)
- `src/components/credits/ChallengeButton.tsx` — Dispute button + Modal
- `src/components/credits/RetireButton.tsx` — Burn/retire with amount input

**Reward components:**
- `src/components/rewards/TokenBalance.tsx` — Governance token balance + % supply
- `src/components/rewards/MilestoneProgress.tsx` — Progress bar + 7 tier indicators

**Pages (all 8 internal pages done):**
- `/dashboard` — Wallet guard, 3 stat cards (token balance, milestones, overview), holdings table, recent activity
- `/marketplace` — Search + filters + sorted credit grid
- `/marketplace/[creditId]` — Credit detail + TradePanel + ChallengeButton + RetireButton
- `/create` — Dual-path form (Certified/Community) with all fields + tx submission
- `/governance` — Proposals list with ProposalCard (type badge, status, vote bar)
- `/governance/[proposalId]` — Proposal detail with vote FOR/AGAINST buttons
- `/governance/disputes` — Disputes list + challenge submission form (stake-to-dispute)
- `/portfolio` — 3 summary cards + 3 tabs (Holdings table, Retired credits, Trade history)

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
- Google Fonts loaded via `next/font/google` in layout.tsx (NOT @import in CSS — breaks Tailwind v4)
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
