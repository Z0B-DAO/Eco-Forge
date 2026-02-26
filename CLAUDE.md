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
- **Web3:** wagmi v2 + viem, RainbowKit
- **AI:** Anthropic Claude API (Sonnet 4.6) via Server Actions only
- **IPFS:** Lighthouse (permanent storage via Filecoin) — NOT Pinata
- **Oracle:** Chainlink Functions (serverless)
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

## Key Conventions

- All smart contract events use `indexed` parameters for frontend `getLogs` filtering
- All on-chain reads use wagmi hooks (`useReadContract`, `getLogs`)
- No REST API — only Server Actions
- No database — all state is on-chain or IPFS
- Foundry for contracts: `forge build`, `forge test`, `forge script`
- Contract sources in `src/contracts/`, tests in `test/`, deploy scripts in `script/`
- Frontend sources in `src/` (Next.js app directory)

## Spec Files

- `ECOFORGE_SPEC.md` — Full project specification (contracts, AI, oracle, architecture, roadmap)
- `FRONTEND_SPEC.md` — Frontend specification (pages, components, hooks, data sources, file structure)

## Environment Variables Required

```
ANTHROPIC_API_KEY          # Claude API (server-side only)
LIGHTHOUSE_API_KEY         # IPFS uploads
FUJI_RPC_URL               # Avalanche Fuji testnet
SNOWTRACE_API_KEY          # Contract verification
DEPLOYER_PRIVATE_KEY       # Contract deployment (never commit)
NEXT_PUBLIC_CHAIN_ID=43113 # Fuji
NEXT_PUBLIC_AVALANCHE_RPC  # Public RPC for frontend
NEXT_PUBLIC_*_ADDRESS      # Deployed contract addresses
```

## What NOT to do

- Do NOT add a backend, database, or API routes
- Do NOT implement PredictionPool or TrendForecast (V2)
- Do NOT use Hardhat (use Foundry)
- Do NOT use Pinata (use Lighthouse)
- Do NOT expose the Anthropic API key to the client
- Do NOT make governance tokens transferable
- Do NOT skip AI verification on Certified credits
