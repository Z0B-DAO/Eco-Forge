# EcoForge — Project Specification

> Decentralized platform on Avalanche for tokenizing and trading carbon credits as real-world assets, powered by AI.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Problem Statement](#2-problem-statement)
3. [Solution](#3-solution)
4. [Architecture Overview](#4-architecture-overview)
5. [Tech Stack](#5-tech-stack)
6. [Smart Contracts (Solidity)](#6-smart-contracts-solidity)
7. [AI Layer](#7-ai-layer)
8. [Chainlink Oracle Integration](#8-chainlink-oracle-integration)
9. [Frontend (Next.js)](#9-frontend-nextjs)
10. [Backend API](#10-backend-api)
11. [DAO Governance](#11-dao-governance)
12. [Gamified Prediction Layer](#12-gamified-prediction-layer)
13. [DeFi Composability](#13-defi-composability)
14. [Data Models](#14-data-models)
15. [API Endpoints](#15-api-endpoints)
16. [Project Structure](#16-project-structure)
17. [1-Week Development Roadmap](#17-1-week-development-roadmap)
18. [Deployment & Infrastructure](#18-deployment--infrastructure)
19. [Security Considerations](#19-security-considerations)
20. [Future Enhancements](#20-future-enhancements)

---

## 1. Project Overview

**Name:** EcoForge
**Tagline:** Forge a sustainable future — tokenize, trade, and govern carbon credits on Avalanche.
**Network:** Avalanche C-Chain (EVM-compatible)
**Token Standard:** ERC-1155 (multi-token for different credit types)
**Timeline:** 1 week (MVP)

### Core Value Propositions

1. **Crypto-native** — Built on Avalanche for low fees, sub-second finality, and future Subnet scalability.
2. **DeFi composability** — Carbon credits usable as collateral in lending protocols.
3. **AI-powered intelligence** — Score, predict, and govern with actionable insights.

---

## 2. Problem Statement

| Problem | Impact |
|---------|--------|
| **Fraud & double-counting** | Biased audits, billions wasted |
| **Opacity** | ~66% of trades happen OTC, eroding trust |
| **Volatility** | Unpredictable policy shifts cause wild price swings |
| **Slow verification** | Manual audits are costly and conflict-of-interest-prone |
| **Low accessibility** | Small players excluded from carbon markets |

---

## 3. Solution

EcoForge addresses each problem:

- **Fraud** → AI-driven impact scoring replaces manual audits using satellite imagery + project data.
- **Opacity** → All trades on-chain, fully auditable.
- **Volatility** → AI-powered trend forecasting + gamified prediction market.
- **Slow verification** → Automated verification pipeline via Chainlink oracles + Claude AI analysis.
- **Accessibility** → Fractional ownership via ERC-1155 tokens, open to individuals, businesses, and NGOs.
- **Double-counting** → Hybrid credit model (Certified + Community Verified) with on-chain proof of retirement.

### 3.1 Hybrid Carbon Credit Model

EcoForge accepts two types of carbon credits with clear labeling:

#### A. Certified Credits (bridged from registries)

Credits that already exist on traditional registries (Verra, Gold Standard).

```
Flow:
1. Issuer owns a verified credit on Verra/Gold Standard
2. Issuer retires (cancels) the credit on the registry — this is public and verifiable
3. Issuer submits retirement proof on EcoForge (serial number, certificate, registry link)
4. AI + admin verify the retirement proof
5. Only after verification → mint is authorized on-chain
6. Token is labeled "Certified" with registry source stored in metadata
```

The original credit is dead on the registry. The ERC-1155 token takes over. No double-counting possible.

#### B. Community Verified Credits (native to EcoForge)

Credits from projects not registered on traditional registries. More accessible, lower barrier to entry.

```
Flow:
1. Project owner submits directly on EcoForge (data, satellite images, documentation)
2. AI (Claude Vision + text) analyzes and generates an impact score
3. Credit is minted with status "Pending" — NOT tradeable yet
4. Community DAO reviews: 7-day challenge period
5. If no successful challenge → status moves to "Community Verified" → tradeable
6. Can be challenged at any time after via governance dispute system
```

#### Comparison

| | Certified | Community Verified |
|---|---|---|
| Source | Verra, Gold Standard, etc. | Direct submission |
| Verification | Registry retirement proof + AI | AI + DAO community review |
| Trust level | High (backed by existing certification) | Medium (backed by AI + community) |
| Label on-chain | `CreditOrigin.Certified` | `CreditOrigin.CommunityVerified` |
| Barrier to entry | High (need existing certification) | Low (open to anyone) |
| Price expectation | Higher (trusted) | Lower (less established) |

#### What we guarantee vs. what we don't

| | Guaranteed | Not guaranteed |
|---|---|---|
| Double-counting on-chain | Impossible (ERC-1155) | — |
| Double-counting cross-platform | Yes, via retirement-then-mint (Certified) | Not 100% if source registry is opaque |
| Credit quality | AI + DAO reduce risk | Not infallible — well-crafted fraud can pass |
| Real environmental impact | Full transparency of data | We don't plant the trees ourselves |

---

## 4. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js)                          │
│  Dashboard │ Marketplace │ Predictions │ Governance │ Portfolio    │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │   Backend API Layer  │
                    │     (Next.js API     │
                    │    Routes / Node)    │
                    └───┬─────────────┬───┘
                        │             │
           ┌────────────▼──┐   ┌──────▼────────────┐
           │  Claude AI API │   │  Avalanche C-Chain │
           │  (Anthropic)   │   │  Smart Contracts   │
           │                │   │                    │
           │ - Impact Score │   │ - CarbonCredit1155 │
           │ - Trend Pred.  │   │ - Marketplace      │
           │ - Data Parsing │   │ - Governance DAO   │
           └────────────────┘   │ - Prediction Pool  │
                                │ - Staking          │
                                └────────┬───────────┘
                                         │
                              ┌──────────▼──────────┐
                              │  Chainlink Oracles   │
                              │                      │
                              │ - Satellite data feed │
                              │ - Carbon price feed   │
                              │ - External API data   │
                              └──────────────────────┘
```

---

## 5. Tech Stack

### Blockchain Layer
| Component | Technology |
|-----------|------------|
| Network | Avalanche C-Chain (Fuji Testnet for dev) |
| Smart Contracts | Solidity ^0.8.20 |
| Token Standard | ERC-1155 (OpenZeppelin) |
| Development Framework | Foundry (forge, cast, anvil) |
| Contract Testing | Foundry (Solidity tests with forge-std) |
| Oracle | Chainlink (Data Feeds + Custom External Adapter) |
| Wallet Integration | MetaMask / Core Wallet via wagmi + viem |

### AI Layer
| Component | Technology |
|-----------|------------|
| AI Provider | **Anthropic Claude API (claude-sonnet-4-6)** |
| Purpose | Impact scoring, trend analysis, data parsing |
| Integration | REST API via backend (server-side only) |

> **AI Decision: Claude API vs Custom ML Model**
>
> For a 1-week timeline, **Claude API is the clear choice**:
>
> | Criteria | Claude API | Custom ML Model |
> |----------|-----------|-----------------|
> | Setup time | Minutes | Days (data collection, training, tuning) |
> | Satellite image analysis | Can analyze via vision capabilities | Requires specialized CV model (weeks of work) |
> | Regulatory text parsing | Excellent out-of-the-box | Would need NLP fine-tuning |
> | Trend forecasting | Strong reasoning on macro signals | Needs historical data pipeline |
> | Maintenance | Zero (managed by Anthropic) | Ongoing retraining needed |
> | Cost | Pay-per-use (~$3/M input tokens) | GPU infrastructure + time |
> | Accuracy for MVP | Very high (general intelligence) | Low without months of training data |
>
> **Verdict:** Use Claude API (Sonnet model for speed/cost balance) for all AI tasks. Wrap it in a clean service layer so it can be swapped for custom models post-MVP if needed.

### Frontend
| Component | Technology |
|-----------|------------|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Web3 | wagmi v2 + viem |
| State Management | Zustand |
| Charts | Recharts or Lightweight Charts |
| Wallet Connect | RainbowKit or Web3Modal |

### Backend (API Routes)
| Component | Technology |
|-----------|------------|
| Runtime | Next.js API Routes (Edge/Node) |
| Database | PostgreSQL (via Prisma ORM) — for caching AI scores + metadata |
| Queue | Bull (Redis) — for async AI processing jobs |

### Infrastructure
| Component | Technology |
|-----------|------------|
| Hosting | Vercel (frontend + API) |
| Database | Supabase PostgreSQL or Neon |
| Cache/Queue | Upstash Redis |
| IPFS | Pinata (for credit metadata + satellite images) |

---

## 6. Smart Contracts (Solidity)

### 6.1 CarbonCredit.sol — ERC-1155 Token

The core token contract representing tokenized carbon credits.

```
Contract: CarbonCredit (ERC-1155)
├── Roles: MINTER_ROLE, VERIFIER_ROLE, ADMIN_ROLE (AccessControl)
├── Enums:
│   ├── CreditOrigin { Certified, CommunityVerified }
│   └── CreditStatus { Pending, Verified, Suspended, Retired }
├── Structs:
│   └── CreditType {
│         uint256 id
│         string projectName
│         string projectType        // "reforestation", "renewable", "methane_capture"
│         string region
│         uint256 vintageYear
│         uint256 totalSupply
│         uint256 impactScore       // 0-100, set by AI via oracle
│         string metadataURI        // IPFS link
│         CreditOrigin origin       // Certified or CommunityVerified
│         CreditStatus status       // Pending, Verified, Suspended, Retired
│         address issuer
│         string registrySource     // "Verra", "Gold Standard", "" if native
│         string retirementProof    // Registry serial number / IPFS link to proof, "" if native
│     }
├── Mappings:
│   ├── creditTypes: id => CreditType
│   └── retiredCredits: address => id => amount
├── Functions:
│   ├── createCertifiedCredit(params, registrySource, retirementProof) → onlyRole(MINTER_ROLE)
│   ├── createCommunityCredit(params) → public // anyone can submit, minted as Pending
│   ├── verifyCommunityCredit(id) → onlyRole(VERIFIER_ROLE) // after DAO challenge period
│   ├── mintCredits(id, to, amount) → onlyRole(MINTER_ROLE)
│   ├── updateImpactScore(id, score) → onlyRole(VERIFIER_ROLE) // called by oracle
│   ├── retireCredits(id, amount) → public // burn mechanism
│   ├── getCreditType(id) → view
│   └── uri(id) → override // returns IPFS metadata
└── Events:
    ├── CertifiedCreditCreated(id, projectName, registrySource, retirementProof)
    ├── CommunityCreditSubmitted(id, projectName, issuer)
    ├── CommunityCreditVerified(id)
    ├── ImpactScoreUpdated(id, oldScore, newScore)
    └── CreditsRetired(owner, id, amount)
```

### 6.2 Marketplace.sol — Trading Engine

Handles listing, buying, and selling carbon credits.

```
Contract: Marketplace
├── Structs:
│   └── Listing {
│         uint256 listingId
│         uint256 creditId
│         address seller
│         uint256 amount
│         uint256 pricePerUnit     // in AVAX (wei)
│         bool active
│     }
├── State:
│   ├── listings: listingId => Listing
│   ├── platformFee: uint256 (basis points, e.g., 250 = 2.5%)
│   └── feeRecipient: address (DAO treasury)
├── Functions:
│   ├── listCredits(creditId, amount, pricePerUnit) → public
│   ├── buyCredits(listingId, amount) → payable
│   ├── cancelListing(listingId) → onlySeller
│   ├── updatePrice(listingId, newPrice) → onlySeller
│   └── withdrawFees() → onlyFeeRecipient
└── Events:
    ├── Listed(listingId, creditId, seller, amount, price)
    ├── Sold(listingId, buyer, amount, totalPrice)
    └── ListingCancelled(listingId)
```

### 6.3 EcoForgeGovernance.sol — DAO

Focused governance for credit standards and dispute resolution.

```
Contract: EcoForgeGovernance
├── Structs:
│   ├── Proposal {
│         uint256 id
│         address proposer
│         ProposalType pType       // CreditEligibility, DisputeResolution
│         string description
│         uint256 forVotes
│         uint256 againstVotes
│         uint256 deadline
│         bool executed
│         bytes calldata           // action to execute
│     }
│   └── Dispute {
│         uint256 creditId
│         address challenger
│         string reason
│         DisputeStatus status     // Open, Resolved, Rejected
│     }
├── Token: EcoForgeToken (ERC-20) — see 6.4b
├── Functions:
│   ├── propose(type, description, calldata) → minTokenBalance required
│   ├── vote(proposalId, support) → public, weight = token balance
│   ├── execute(proposalId) → quorumReached + deadline passed
│   ├── disputeCredit(creditId, reason) → public // auto-creates a DisputeResolution proposal
│   └── resolveDispute(disputeId, resolution) → onlyGovernance // called by execute()
├── Constants:
│   ├── VOTING_PERIOD: 7 days
│   ├── QUORUM_PERCENTAGE: 10% of total supply
│   └── MIN_PROPOSAL_TOKENS: minimum tokens to create a proposal
└── Events:
    ├── ProposalCreated(id, proposer, type)
    ├── Voted(proposalId, voter, support, weight)
    ├── ProposalExecuted(id)
    └── DisputeRaised(creditId, challenger, autoProposalId)
```

### 6.4b EcoForgeToken.sol — Governance Token

ERC-20 token used for voting power in the DAO. Earned through milestone-based activity rewards.

```
Contract: EcoForgeToken (ERC-20)
├── Inherits: ERC20, AccessControl
├── Roles: MINTER_ROLE (held by CarbonCredit, Marketplace, Governance contracts + admin)
├── Structs:
│   └── Milestone {
│         uint256 actionsRequired      // cumulative actions needed
│         uint256 tokensRewarded       // tokens minted at this milestone
│     }
├── State:
│   ├── milestones: Milestone[]        // hardcoded tiers (Option A)
│   ├── userActions: address => uint256  // cumulative action count per wallet
│   ├── userMilestone: address => uint256 // last milestone reached per wallet
│   └── dailyActionCap: uint256        // max actions counted per wallet per day (anti-sybil)
├── Functions:
│   ├── recordAction(user) → onlyRole(MINTER_ROLE)
│   │     // Called by other contracts on each qualifying action
│   │     // Increments userActions[user]
│   │     // If new milestone reached → auto-mint tokens to user
│   ├── burn(user, amount) → onlyRole(MINTER_ROLE) // for punishments
│   ├── burnAll(user) → onlyRole(MINTER_ROLE) // burn entire balance (fraud penalty)
│   ├── getMilestones() → view
│   ├── getUserProgress(user) → view // returns { actions, currentMilestone, nextMilestone, tokensEarned }
│   └── transfer/transferFrom → DISABLED (non-transferable, soulbound)
├── Milestone Tiers (hardcoded, adjustable before deploy):
│   ├── Tier 1:   5 actions  → 1 token   (total: 1)
│   ├── Tier 2:  15 actions  → 2 tokens  (total: 3)
│   ├── Tier 3:  30 actions  → 3 tokens  (total: 6)
│   ├── Tier 4:  50 actions  → 5 tokens  (total: 11)
│   ├── Tier 5: 100 actions  → 8 tokens  (total: 19)
│   ├── Tier 6: 200 actions  → 13 tokens (total: 32)
│   └── Tier 7: 500 actions  → 21 tokens (total: 53)
├── Qualifying actions (each = +1 to counter):
│   ├── Create a credit (Certified or Community)
│   ├── Buy a credit
│   ├── Sell a credit
│   ├── Retire (burn) a credit
│   ├── Vote on a proposal
│   └── Submit a dispute that gets accepted
├── Anti-sybil:
│   ├── Max actions counted per wallet per day (e.g., 10)
│   ├── Non-transferable tokens → can't consolidate across wallets
│   └── Actions cost gas → makes mass wallet creation expensive
└── Events:
    ├── ActionRecorded(user, totalActions)
    ├── MilestoneReached(user, milestoneIndex, tokensRewarded)
    ├── TokensBurned(user, amount, reason)
    └── AllTokensBurned(user, reason)
```

### 6.4c Punishment System

Anti-fraud and anti-spam mechanisms across all contracts.

```
CASE 1: Fraudulent credit detected (via DAO dispute vote)
─────────────────────────────────────────────────────────
Trigger: Dispute vote passes (FOR wins)
Actions:
  1. CarbonCredit.updateStatus(creditId, Suspended) — credit no longer tradeable
  2. EcoForgeToken.burnAll(issuer) — issuer loses ALL governance tokens
  3. CarbonCredit.blacklist(issuer) — issuer can never create credits again
Executed automatically by EcoForgeGovernance.execute()

CASE 2: False dispute (spam/malicious challenge)
─────────────────────────────────────────────────
Trigger: Dispute vote fails (AGAINST wins)
Prerequisite: Challenger must stake governance tokens to submit a dispute
Actions:
  1. Staked tokens are burned (EcoForgeToken.burn(challenger, stakeAmount))
  2. Dispute status set to Rejected
  3. Credit returns to normal status

CASE 3: Successful dispute (legitimate challenge)
─────────────────────────────────────────────────
Trigger: Dispute vote passes (FOR wins)
Actions:
  1. Staked tokens are returned to challenger
  2. Challenger receives bonus tokens (reward for protecting the platform)
  3. Fraudulent issuer is punished (see Case 1)

DISPUTE STAKE AMOUNT:
  - Must stake minimum DISPUTE_STAKE_AMOUNT governance tokens to submit dispute
  - If you don't have enough tokens → can't dispute (prevents spam from new accounts)
  - Staked tokens are locked until the vote resolves
```

Additions to existing contracts for punishment support:

```
CarbonCredit.sol — additions:
├── Mappings:
│   └── blacklisted: address => bool
├── Functions:
│   ├── blacklist(address) → onlyRole(ADMIN_ROLE) or onlyGovernance
│   └── isBlacklisted(address) → view
├── Modifiers:
│   └── notBlacklisted(msg.sender) on createCertifiedCredit + createCommunityCredit
└── Events:
    └── IssuerBlacklisted(address, creditId)

EcoForgeGovernance.sol — additions:
├── State:
│   └── disputeStakes: disputeId => { challenger, amount, returned }
├── Constants:
│   └── DISPUTE_STAKE_AMOUNT: minimum tokens to stake for a dispute
├── Functions (updated):
│   ├── disputeCredit(creditId, reason) → requires staking DISPUTE_STAKE_AMOUNT tokens
│   └── resolveDispute() → now also handles stake return/burn + issuer punishment
└── Events:
    ├── DisputeStaked(disputeId, challenger, amount)
    ├── DisputeStakeReturned(disputeId, challenger, amount)
    └── DisputeStakeBurned(disputeId, challenger, amount)
```

### ~~6.4 PredictionPool.sol — Gamified Predictions~~ [V2 — NOT IN MVP]

> **Moved to V2.** Do not implement until explicitly specified. The prediction market adds complexity (extra contract, Chainlink resolution, dedicated UI) for limited value at launch with a small user base. Focus MVP on Marketplace + Create + AI + Governance.

<details>
<summary>V2 spec (click to expand)</summary>

Users stake AVAX on carbon credit value predictions.

```
Contract: PredictionPool
├── Structs:
│   └── Prediction {
│         uint256 id
│         uint256 creditId
│         string question           // "Will EU carbon price exceed $100 by Q2 2026?"
│         uint256 resolutionTime
│         uint256 yesPool           // total AVAX staked on YES
│         uint256 noPool            // total AVAX staked on NO
│         Outcome result            // Pending, Yes, No
│         bool resolved
│     }
├── Mappings:
│   └── userStakes: predictionId => user => Stake { amount, position }
├── Functions:
│   ├── createPrediction(creditId, question, resolutionTime) → onlyAdmin/DAO
│   ├── stake(predictionId, position) → payable
│   ├── resolve(predictionId, outcome) → onlyOracle // via Chainlink
│   ├── claim(predictionId) → winners only
│   └── getOdds(predictionId) → view
└── Events:
    ├── PredictionCreated(id, question, deadline)
    ├── Staked(predictionId, user, amount, position)
    ├── Resolved(predictionId, outcome)
    └── Claimed(predictionId, user, amount)
```

</details>

### 6.5 Contract Inheritance & Dependencies

Installed via `forge install`:

```bash
forge install OpenZeppelin/openzeppelin-contracts
forge install smartcontractkit/chainlink
forge install foundry-rs/forge-std
```

```
OpenZeppelin (lib/openzeppelin-contracts):
  ├── ERC1155
  ├── AccessControl
  ├── ReentrancyGuard
  ├── Pausable
  └── ERC20 (governance token)

Chainlink (lib/chainlink):
  ├── ChainlinkClient (for external adapter requests)
  └── AggregatorV3Interface (for price feeds)

Forge Std (lib/forge-std):
  ├── Test (base test contract)
  ├── console2 (logging)
  └── Script (deployment scripts)
```

### 6.6 Foundry Configuration

```toml
# foundry.toml
[profile.default]
src = "src/contracts"
out = "out"
libs = ["lib"]
solc_version = "0.8.20"
optimizer = true
optimizer_runs = 200

[rpc_endpoints]
fuji = "${FUJI_RPC_URL}"
avalanche = "${AVALANCHE_RPC_URL}"
localhost = "http://127.0.0.1:8545"

[etherscan]
fuji = { key = "${SNOWTRACE_API_KEY}", url = "https://api-testnet.snowtrace.io/api" }

# Remappings
# Also defined in remappings.txt:
# @openzeppelin/=lib/openzeppelin-contracts/
# @chainlink/=lib/chainlink/
# forge-std/=lib/forge-std/src/
```

---

## 7. AI Layer

### 7.1 Architecture

All AI processing happens **server-side** in Next.js API routes. The Claude API is never exposed to the client.

```
┌──────────────────────────────────────────────────┐
│                AI Service Layer                   │
│                                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────┐ │
│  │ Impact Score │  │ Trend       │  │ Data     │ │
│  │ Generator   │  │ Forecaster  │  │ Parser   │ │
│  └──────┬──────┘  └──────┬──────┘  └────┬─────┘ │
│         │                │               │       │
│         └────────────────┼───────────────┘       │
│                          │                       │
│                ┌─────────▼─────────┐             │
│                │   Claude API      │             │
│                │   (Sonnet 4.6)    │             │
│                └───────────────────┘             │
└──────────────────────────────────────────────────┘
```

### 7.2 AI Use Cases

#### A. Impact Score Generation

**Input:** Project metadata + satellite imagery (via Chainlink oracle or direct upload)
**Output:** Impact score (0-100) + detailed breakdown

```
Prompt Structure:
- System: "You are an environmental impact assessor for carbon credits..."
- User: {
    projectData: { type, region, area, methodology },
    satelliteImagery: [base64 images or descriptions],
    historicalData: { previous scores, growth metrics }
  }
- Expected Output (structured JSON): {
    overallScore: 85,
    breakdown: {
      additionality: 90,
      permanence: 80,
      leakage: 85,
      verification: 85
    },
    reasoning: "...",
    riskFactors: ["..."],
    confidence: 0.87
  }
```

#### B. Trend Forecasting

**Input:** Market signals, regulatory news, emissions data
**Output:** Price trend prediction + confidence + reasoning

```
Prompt Structure:
- System: "You are a carbon market analyst..."
- User: {
    currentPrice: 82.50,
    recentNews: ["EU tightens emissions cap...", "COP31 announces..."],
    historicalPrices: [...],
    emissionsData: {...}
  }
- Expected Output (structured JSON): {
    prediction: "bullish",
    priceTarget: { low: 78, mid: 92, high: 105 },
    timeframe: "3 months",
    confidence: 0.72,
    keyDrivers: ["EU regulatory tightening", "..."],
    risks: ["Policy reversal in..."]
  }
```

#### C. Dispute Analysis

**Input:** Dispute details + credit data
**Output:** Validity assessment + recommendation

### 7.3 AI Service Implementation

```typescript
// services/ai/claude.ts
interface AIService {
  generateImpactScore(projectData: ProjectData): Promise<ImpactScore>;
  forecastTrend(marketData: MarketData): Promise<TrendForecast>;
  analyzeDispute(dispute: DisputeData): Promise<DisputeAnalysis>;
  parseProjectDocument(document: string): Promise<ParsedProject>;
}
```

**Rate Limiting:** Max 50 requests/min per user, cached results for 1 hour.
**Cost Estimate:** ~$0.01-0.05 per impact score, ~$0.02-0.08 per forecast.

---

## 8. Chainlink Oracle Integration

### 8.1 Overview

Chainlink serves as the bridge between off-chain data (AI scores, satellite data, carbon prices) and on-chain smart contracts.

### 8.2 Components

#### A. Price Feeds (Direct)
- AVAX/USD price feed (already available on Fuji)
- Carbon credit reference prices (if available, otherwise custom feed)

#### B. Custom External Adapter

A Chainlink node calls our backend API to fetch AI-generated impact scores and push them on-chain.

```
Flow:
1. Backend generates impact score via Claude API
2. Score stored in database with metadata
3. Chainlink node triggers External Adapter
4. Adapter calls our API endpoint: GET /api/oracle/impact-score/{creditId}
5. Adapter returns score to Chainlink node
6. Node submits tx to CarbonCredit.updateImpactScore(creditId, score)
```

#### C. Oracle Contract

```
Contract: EcoForgeOracle
├── Inherits: ChainlinkClient
├── Functions:
│   ├── requestImpactScore(creditId) → sends Chainlink request
│   ├── fulfillImpactScore(requestId, creditId, score) → callback
│   ├── requestPredictionResolution(predictionId) → for prediction market
│   └── fulfillPredictionResolution(requestId, predictionId, outcome) → callback
└── Access: Only authorized contracts can make requests
```

### 8.3 Fuji Testnet Chainlink Setup

- Use Chainlink's Any API feature on Fuji
- Fund oracle contract with testnet LINK
- Deploy custom External Adapter (Node.js) or use Chainlink Functions (serverless)

> **Recommendation for MVP:** Use **Chainlink Functions** (beta on Fuji) — it allows running custom JavaScript directly in a Chainlink DON without deploying your own node. This is significantly simpler for a 1-week timeline.

---

## 9. Frontend (Next.js)

### 9.1 Pages & Routes

```
app/
├── page.tsx                    # Landing page
├── layout.tsx                  # Root layout (wallet provider, theme)
├── dashboard/
│   └── page.tsx                # User dashboard (portfolio, activity)
├── marketplace/
│   ├── page.tsx                # Browse & search credits
│   └── [creditId]/
│       └── page.tsx            # Credit detail (score, history, trade)
├── predictions/
│   ├── page.tsx                # Active prediction markets
│   └── [predictionId]/
│       └── page.tsx            # Prediction detail + staking
├── governance/
│   ├── page.tsx                # Proposals list
│   ├── [proposalId]/
│   │   └── page.tsx            # Proposal detail + voting
│   └── disputes/
│       └── page.tsx            # Active disputes
├── create/
│   └── page.tsx                # Create/tokenize new credit (for issuers)
├── portfolio/
│   └── page.tsx                # User's credits, retired credits, P&L
└── api/
    ├── ai/
    │   ├── impact-score/route.ts
    │   ├── trend-forecast/route.ts
    │   └── dispute-analysis/route.ts
    ├── oracle/
    │   └── impact-score/[creditId]/route.ts
    ├── credits/
    │   └── route.ts            # Credit metadata CRUD
    └── predictions/
        └── route.ts            # Prediction metadata
```

### 9.2 Key UI Components

```
components/
├── layout/
│   ├── Header.tsx              # Nav + wallet connect
│   ├── Footer.tsx
│   └── Sidebar.tsx
├── web3/
│   ├── ConnectButton.tsx       # Wallet connection
│   ├── NetworkSwitch.tsx       # Ensure Avalanche network
│   └── TransactionStatus.tsx   # Tx pending/success/fail
├── credits/
│   ├── CreditCard.tsx          # Credit listing card
│   ├── CreditDetail.tsx        # Full credit info
│   ├── ImpactScoreBadge.tsx    # Visual score display
│   ├── TradePanel.tsx          # Buy/sell interface
│   └── RetireButton.tsx        # Burn credits
├── predictions/
│   ├── PredictionCard.tsx
│   ├── StakePanel.tsx
│   └── OddsChart.tsx
├── governance/
│   ├── ProposalCard.tsx
│   ├── VotePanel.tsx
│   └── DisputeForm.tsx
├── ai/
│   ├── ImpactScorePanel.tsx    # AI score display + breakdown
│   ├── TrendForecast.tsx       # AI prediction display
│   └── AIInsightCard.tsx       # General AI insight
├── charts/
│   ├── PriceChart.tsx
│   ├── VolumeChart.tsx
│   └── ScoreHistoryChart.tsx
└── common/
    ├── LoadingSpinner.tsx
    ├── Modal.tsx
    └── Toast.tsx
```

### 9.3 Web3 Configuration

```typescript
// config/wagmi.ts
- Chain: Avalanche Fuji Testnet (chainId: 43113)
- Transports: HTTP RPC (https://api.avax-test.network/ext/bc/C/rpc)
- Connectors: MetaMask, Core Wallet, WalletConnect
```

---

## 10. Backend API

### 10.1 Database Schema (Prisma)

```prisma
model CreditProject {
  id              String   @id @default(cuid())
  onChainId       Int      @unique         // ERC-1155 token ID
  name            String
  type            String                    // reforestation, renewable, etc.
  region          String
  description     String
  metadataURI     String                    // IPFS hash
  issuer          String                    // wallet address
  impactScores    ImpactScore[]
  createdAt       DateTime @default(now())
}

model ImpactScore {
  id              String   @id @default(cuid())
  creditId        String
  credit          CreditProject @relation(fields: [creditId], references: [id])
  overallScore    Int                       // 0-100
  additionality   Int
  permanence      Int
  leakage         Int
  verification    Int
  reasoning       String
  confidence      Float
  rawResponse     Json                      // full Claude response
  createdAt       DateTime @default(now())
}

model TrendForecast {
  id              String   @id @default(cuid())
  creditType      String
  prediction      String                    // bullish, bearish, neutral
  priceTargetLow  Float
  priceTargetMid  Float
  priceTargetHigh Float
  confidence      Float
  keyDrivers      String[]
  createdAt       DateTime @default(now())
}

model OracleRequest {
  id              String   @id @default(cuid())
  requestType     String                    // impact_score, prediction_resolution
  chainlinkReqId  String   @unique
  creditId        Int
  status          String                    // pending, fulfilled, failed
  result          Json?
  createdAt       DateTime @default(now())
  fulfilledAt     DateTime?
}
```

---

## 11. DAO Governance

### 11.1 Scope (MVP)

Governance is **intentionally narrow** for MVP:

1. **Credit Eligibility Criteria** — Define which project types qualify, minimum standards.
2. **Dispute Resolution** — Community votes on challenged credits.

### 11.2 Governance Token (EcoForgeToken)

- ERC-20, **non-transferable** in MVP (prevents vote buying)
- Earned through **milestone-based activity rewards** (see 6.4b):
  - Actions counted: create, buy, sell, retire, vote, successful dispute
  - Tokens minted automatically when a milestone tier is reached (5 actions → 1 token, 15 → 2, etc.)
  - Daily action cap per wallet (anti-sybil)
- 1 token = 1 vote
- Minimum balance required to create a proposal (anti-spam)
- **Tokens can be burned as punishment** (see 6.4c)

### 11.3 Proposal Flow

```
1. User holds minimum governance tokens
2. Creates proposal (type: CreditEligibility or DisputeResolution)
3. 7-day voting period — token-weighted votes (FOR / AGAINST)
4. After deadline:
   - Quorum reached (10%+ of supply voted) + majority FOR → executable
   - Quorum not reached → expired
   - Majority AGAINST → rejected
5. Anyone can call execute() → on-chain action runs automatically
```

### 11.4 Dispute Flow (with stake-to-dispute)

```
1. User clicks "Challenge" on any credit (from marketplace or credit detail page)
2. Writes reason for the challenge
3. Must stake DISPUTE_STAKE_AMOUNT governance tokens (skin in the game)
   - If not enough tokens → can't dispute (prevents spam from new accounts)
4. Tx: disputeCredit(creditId, reason) — locks staked tokens
5. Contract auto-creates a DisputeResolution proposal
6. Credit is marked "Disputed" on-chain (still visible, flagged in UI)
7. Community votes FOR (= fraudulent, suspend) or AGAINST (= legit, dismiss)
8. Optional: anyone can click "Analyze with AI" to get Claude's assessment
9. After vote resolves:
   - FOR wins (credit is fraudulent):
     → Credit status set to Suspended, no longer tradeable
     → Challenger gets staked tokens back + bonus reward
     → Fraudulent issuer: ALL tokens burned + address blacklisted
   - AGAINST wins (credit is legit):
     → Dispute rejected, credit returns to normal
     → Challenger's staked tokens are BURNED (punishment for false dispute)
```

### 11.5 Voting Power

- Voting power = EcoForgeToken balance at time of vote
- 1 token = 1 vote
- No delegation in MVP (V2 feature)

---

## ~~12. Gamified Prediction Layer~~ [V2 — NOT IN MVP]

> **Moved to V2.** See section 6.4 for the full spec. Not implemented in MVP.

---

## 13. DeFi Composability

### 13.1 MVP Scope

For the MVP, we focus on making credits **compatible** with DeFi:

- ERC-1155 standard ensures interoperability
- Credits can be wrapped to ERC-20 (future) for lending protocol compatibility
- Impact scores on-chain allow other protocols to assess collateral quality

### 13.2 Future Integration Points

- **Aave/Benqi:** Carbon credits as collateral
- **DEX Liquidity:** Wrapped credit tokens tradable on Trader Joe
- **Yield:** Stake credits to earn platform tokens

---

## 14. Data Models

### 14.1 Credit Metadata (IPFS)

```json
{
  "name": "Amazon Reforestation - Block 42",
  "description": "10,000 tCO2e from reforestation project in Para, Brazil",
  "image": "ipfs://Qm.../satellite.jpg",
  "external_url": "https://ecoforge.app/credits/42",
  "attributes": [
    { "trait_type": "Project Type", "value": "Reforestation" },
    { "trait_type": "Region", "value": "Para, Brazil" },
    { "trait_type": "Vintage Year", "value": 2025 },
    { "trait_type": "Methodology", "value": "VCS VM0007" },
    { "trait_type": "Tonnes CO2e", "value": 10000 },
    { "trait_type": "Impact Score", "value": 87 },
    { "display_type": "date", "trait_type": "Verification Date", "value": 1735689600 }
  ]
}
```

---

## 15. API Endpoints

### AI Endpoints (Server-side only)

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/ai/impact-score` | Generate AI impact score for a credit project |
| POST | `/api/ai/trend-forecast` | Generate market trend forecast |
| POST | `/api/ai/dispute-analysis` | Analyze a governance dispute |

### Oracle Endpoints (Chainlink External Adapter)

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/oracle/impact-score/[creditId]` | Return latest impact score for Chainlink |
| GET | `/api/oracle/prediction/[predictionId]` | Return prediction resolution for Chainlink |

### Credit Metadata Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/credits` | List all credits with filters |
| GET | `/api/credits/[id]` | Get credit details + scores |
| POST | `/api/credits` | Create credit metadata (pre-mint) |

---

## 16. Project Structure

```
ecoforge/
├── src/contracts/                  # Solidity smart contracts
│   ├── CarbonCredit.sol
│   ├── Marketplace.sol
│   ├── EcoForgeGovernance.sol
│   ├── EcoForgeToken.sol           # Governance ERC-20 (non-transferable MVP)
│   ├── EcoForgeOracle.sol
│   └── interfaces/
│       ├── ICarbonCredit.sol
│       └── IMarketplace.sol
├── test/                           # Foundry Solidity tests
│   ├── CarbonCredit.t.sol
│   ├── Marketplace.t.sol
│   ├── Governance.t.sol
│   └── EcoForgeToken.t.sol
├── script/                         # Foundry deployment scripts (Solidity)
│   ├── Deploy.s.sol
│   └── Seed.s.sol                  # Seed testnet data
├── foundry.toml                    # Foundry configuration
├── remappings.txt                  # Solidity import remappings
├── lib/                            # Foundry dependencies (git submodules)
│   ├── forge-std/
│   ├── openzeppelin-contracts/
│   └── chainlink/
├── out/                            # Compiled contract artifacts (ABI + bytecode)
├── src/                            # Next.js app
│   ├── app/                        # App Router pages (see Section 9.1)
│   ├── components/                 # React components (see Section 9.2)
│   ├── hooks/                      # Custom React hooks
│   │   ├── useCredits.ts
│   │   ├── useMarketplace.ts
│   │   ├── usePredictions.ts
│   │   └── useGovernance.ts
│   ├── services/                   # Business logic
│   │   ├── ai/
│   │   │   ├── claude.ts           # Claude API wrapper
│   │   │   ├── impact-score.ts
│   │   │   ├── trend-forecast.ts
│   │   │   └── prompts.ts          # All AI prompts centralized
│   │   ├── web3/
│   │   │   ├── contracts.ts        # Contract ABIs + addresses
│   │   │   └── config.ts           # wagmi config
│   │   └── ipfs/
│   │       └── pinata.ts           # IPFS upload service
│   ├── lib/                        # Utilities
│   │   ├── prisma.ts               # Prisma client
│   │   └── utils.ts
│   ├── types/                      # TypeScript types
│   │   ├── contracts.ts
│   │   ├── ai.ts
│   │   └── index.ts
│   └── store/                      # Zustand stores
│       ├── useWalletStore.ts
│       └── useMarketStore.ts
├── prisma/
│   └── schema.prisma
├── public/
│   └── assets/
├── .env.local                      # API keys (NEVER commit)
├── .env.example                    # Template
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.ts
```

---

## 17. 1-Week Development Roadmap

### Day 1 — Foundation

- [x] Initialize project (Next.js + Foundry monorepo)
- [ ] Set up Tailwind, wagmi, viem, RainbowKit
- [ ] Write `CarbonCredit.sol` (ERC-1155)
- [ ] Write `Marketplace.sol`
- [ ] Basic contract tests

### Day 2 — Smart Contracts Complete

- [ ] Write `EcoForgeGovernance.sol` + `EcoForgeToken.sol`
- [ ] Write `EcoForgeOracle.sol` (Chainlink integration stub)
- [ ] Full contract test suite
- [ ] Deploy to Fuji Testnet

### Day 3 — AI Integration

- [ ] Set up Claude API service layer
- [ ] Implement impact score generation endpoint
- [ ] Implement trend forecast endpoint
- [ ] Implement dispute analysis endpoint
- [ ] Set up IPFS (Pinata) integration

### Day 4 — Frontend Core

- [ ] Landing page
- [ ] Wallet connection + network setup
- [ ] Dashboard page
- [ ] Marketplace (list, browse, buy credits)
- [ ] Credit detail page with AI impact score

### Day 5 — Frontend Features

- [ ] Create/tokenize credit flow
- [ ] Governance page (proposals + voting + disputes)
- [ ] Portfolio page
- [ ] Charts and data visualization

### Day 6 — Oracle + Integration

- [ ] Chainlink Functions or External Adapter setup
- [ ] Connect AI scores → oracle → on-chain
- [ ] End-to-end flow testing
- [ ] Seed testnet with sample data

### Day 7 — Polish & Deploy

- [ ] UI/UX polish
- [ ] Error handling + loading states
- [ ] Responsive design pass
- [ ] Deploy to Vercel
- [ ] Write README
- [ ] Record demo video

---

## 18. Deployment & Infrastructure

### Environment Variables

```env
# .env.local
NEXT_PUBLIC_AVALANCHE_RPC=https://api.avax-test.network/ext/bc/C/rpc
NEXT_PUBLIC_CHAIN_ID=43113

# AI
ANTHROPIC_API_KEY=sk-ant-...

# Database
DATABASE_URL=postgresql://...

# IPFS
PINATA_API_KEY=...
PINATA_SECRET_KEY=...

# Chainlink
CHAINLINK_NODE_URL=...
LINK_TOKEN_ADDRESS=0x0b9d5D9136855f6FEc3c0993feE6E9CE8a297846

# Foundry / RPC
FUJI_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc
AVALANCHE_RPC_URL=https://api.avax.network/ext/bc/C/rpc
SNOWTRACE_API_KEY=...

# Contract Addresses (filled after deployment)
NEXT_PUBLIC_CARBON_CREDIT_ADDRESS=0x...
NEXT_PUBLIC_MARKETPLACE_ADDRESS=0x...
NEXT_PUBLIC_GOVERNANCE_ADDRESS=0x...
NEXT_PUBLIC_PREDICTION_POOL_ADDRESS=0x...
NEXT_PUBLIC_ORACLE_ADDRESS=0x...

# Wallet
DEPLOYER_PRIVATE_KEY=0x...  # NEVER commit this
```

### Deployment Commands

```bash
# Compile contracts
forge build

# Run tests
forge test

# Run tests with verbosity (traces on failure)
forge test -vvv

# Deploy contracts to Fuji
forge script script/Deploy.s.sol --rpc-url $FUJI_RPC_URL --broadcast --verify

# Start local Anvil node (for local dev)
anvil --fork-url $FUJI_RPC_URL

# Interact with deployed contract (example)
cast call $CONTRACT_ADDRESS "getCreditType(uint256)" 1 --rpc-url $FUJI_RPC_URL

# Run frontend
npm run dev

# Deploy frontend
vercel --prod
```

---

## 19. Security Considerations

| Risk | Mitigation |
|------|------------|
| Reentrancy attacks | Use OpenZeppelin `ReentrancyGuard` on all payment functions |
| Oracle manipulation | Multi-source validation, confidence thresholds, DAO challenge mechanism |
| AI hallucination | Structured output parsing, confidence scores, human review for low-confidence results |
| Private key exposure | Never store in code; use `.env.local` + hardware wallet for mainnet |
| Front-running | Consider commit-reveal for future prediction staking (V2) |
| Flash loan attacks | Time-lock on large operations |
| API key leakage | All AI calls server-side only; never expose Anthropic key to client |

---

## 20. Future Enhancements

| Feature | Description | Priority |
|---------|-------------|----------|
| Prediction Market | Gamified staking on carbon credit value predictions (see 6.4 V2 spec) | High |
| Avalanche Subnet | Dedicated subnet for high-volume trading | High |
| Custom ML Models | Train specialized models on carbon market data | Medium |
| Mobile App | React Native companion app | Medium |
| Cross-chain Bridge | Bridge credits to Ethereum, Polygon | Medium |
| Wrapped ERC-20 | Wrap ERC-1155 credits for broader DeFi compatibility | High |
| Real Satellite API | Integration with Sentinel-2 or Planet Labs | High |
| Institutional API | B2B API for corporate carbon management | Medium |
| Carbon Calculator | Estimate personal/business carbon footprint | Low |

---

## Appendix: Key Links & Resources

- [Avalanche C-Chain Docs](https://docs.avax.network/build/dapp/c-chain-evm)
- [Avalanche Fuji Faucet](https://faucet.avax.network/)
- [OpenZeppelin ERC-1155](https://docs.openzeppelin.com/contracts/5.x/erc1155)
- [Chainlink Functions](https://docs.chain.link/chainlink-functions)
- [Anthropic Claude API](https://docs.anthropic.com/en/docs)
- [wagmi Documentation](https://wagmi.sh)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Pinata IPFS](https://docs.pinata.cloud/)

---

*EcoForge — Because the planet can't wait.*
