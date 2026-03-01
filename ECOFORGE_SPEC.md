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
3. Issuer submits on EcoForge:
   - Retirement proof (serial number, certificate, registry link)
   - Project data (name, type, region, vintage year, tonnes CO2e)
   - Satellite image (optional but recommended)
4. Contract checks: retirement proof NOT already used (anti-double-bridge)
   - Mapping usedRetirementProofs[hash(registrySource + serialNumber)] must be false
   - If already used → tx reverts, credit rejected
5. AI verification (MANDATORY):
   - Claude analyzes retirement proof + project data + satellite image
   - Validates consistency (does the proof match the project description?)
   - Generates impact score
   - If AI confidence < threshold → credit minted as Pending (needs manual review)
   - If AI confidence >= threshold → credit minted as Verified
6. Retirement proof hash stored on-chain → can never be used again
7. Token is labeled "Certified" with registry source stored in metadata
```

The original credit is dead on the registry. The hash is stored on-chain. **No one can bridge the same credit twice.**

#### B. Community Verified Credits (native to EcoForge)

Credits from projects not registered on traditional registries. More accessible, lower barrier to entry.

```
Flow:
1. Project owner submits directly on EcoForge:
   - Project data (name, type, region, vintage year, tonnes CO2e, methodology)
   - Satellite image (MANDATORY)
   - Documentation (PDF, links)
2. AI verification (MANDATORY):
   - Claude Vision analyzes satellite image + project data
   - Generates impact score + breakdown + confidence
   - Score stored in metadata
3. Credit is minted with status "Pending" — NOT tradeable yet
4. Community DAO reviews: 7-day challenge period
5. If no successful challenge → status moves to "Verified" → tradeable
6. Can be challenged at any time after via governance dispute system
```

#### AI verification on BOTH paths

Every credit that enters EcoForge goes through Claude analysis. No exceptions.

| | Certified | Community |
|---|---|---|
| AI analyzes | Retirement proof + project data + image | Project data + satellite image + documentation |
| AI checks for | Proof/data consistency, image authenticity | Project legitimacy, image authenticity, additionality |
| AI generates | Impact score + confidence | Impact score + breakdown + confidence |
| Low confidence result | Minted as Pending (manual review) | Minted as Pending (DAO challenge) |
| High confidence result | Minted as Verified | Still Pending (always needs DAO period) |

#### Anti-double-bridge (Certified only)

```
On-chain check:
  hash = keccak256(registrySource + serialNumber)
  require(usedRetirementProofs[hash] == false, "Already bridged")
  usedRetirementProofs[hash] = true
```

Even if someone retires the same credit on Verra twice (shouldn't be possible but just in case), or tries to submit the same proof with a different wallet, the contract rejects it.

#### Comparison

| | Certified | Community Verified |
|---|---|---|
| Source | Verra, Gold Standard, etc. | Direct submission |
| AI verification | Mandatory (proof + data consistency) | Mandatory (image + data analysis) |
| DAO challenge period | Only if AI confidence low | Always (7 days) |
| Anti-double-bridge | Yes (`usedRetirementProofs` on-chain) | N/A (no external registry) |
| Trust level | High (registry + AI + on-chain proof) | Medium (AI + DAO community) |
| Label on-chain | `CreditOrigin.Certified` | `CreditOrigin.CommunityVerified` |
| Barrier to entry | High (need existing certification) | Low (open to anyone) |
| Price expectation | Higher (multi-layer trust) | Lower (less established) |

#### What we guarantee vs. what we don't

| | Guaranteed | Not guaranteed |
|---|---|---|
| Double-counting on-chain | Impossible (ERC-1155) | — |
| Double-bridging same credit | Impossible (`usedRetirementProofs` hash check) | — |
| AI analysis on every credit | Yes, mandatory for both types | — |
| Credit quality | AI + DAO + anti-double-bridge reduce risk | Not infallible — well-crafted fraud can pass |
| Real environmental impact | Full transparency of data | We don't plant the trees ourselves |

---

## 4. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js)                          │
│  Dashboard │ Marketplace │ Governance │ Create                    │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │  Server Actions      │
                    │  ("use server")      │
                    └───┬─────────────┬───┘
                        │             │
           ┌────────────▼──┐   ┌──────▼────────────┐
           │  Claude AI API │   │  Avalanche C-Chain │
           │  (Anthropic)   │   │  Smart Contracts   │
           │                │   │                    │
           │ - Impact Score │   │ - CarbonCredit1155 │
           │ - Dispute      │   │ - Marketplace      │
           │   Analysis     │   │ - Governance DAO   │
           └────────────────┘   │ - EcoForgeToken    │
                                │ - Oracle           │
                                └────────┬───────────┘
                                         │
                              ┌──────────▼──────────┐
                              │  Chainlink Functions  │
                              │                      │
                              │ - AVAX/USD price feed │
                              │ - AI score on-chain   │
                              └──────────────────────┘
```

---

## 5. Tech Stack

### Blockchain Layer
| Component | Technology |
|-----------|------------|
| Network | Avalanche C-Chain (Fuji Testnet for dev) |
| Smart Contracts | Solidity ^0.8.24 |
| Token Standard | ERC-1155 (OpenZeppelin) |
| Development Framework | Foundry (forge, cast, anvil) |
| Contract Testing | Foundry (Solidity tests with forge-std) |
| Oracle | Chainlink Functions (serverless, via chainlink-brownie-contracts) |
| Wallet Integration | MetaMask / Core Wallet via wagmi + viem |

### AI Layer
| Component | Technology |
|-----------|------------|
| AI Provider | **Anthropic Claude API (claude-sonnet-4-6)** |
| Purpose | Impact scoring (Vision + text), dispute analysis |
| Integration | Next.js Server Actions (server-side only) |

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

### Server-side (Next.js Server Actions only)
| Component | Technology |
|-----------|------------|
| Runtime | Next.js Server Actions (`"use server"`) |
| AI calls | Anthropic SDK (server-side only, API key never exposed) |
| No database | All state lives on-chain or IPFS |
| No queue | AI calls are synchronous (~2-5s) |

### Infrastructure
| Component | Technology |
|-----------|------------|
| Hosting | Vercel (frontend + server actions) |
| IPFS | Lighthouse (permanent storage via Filecoin) |

---

## 6. Smart Contracts (Solidity)

### 6.1 CarbonCredit.sol — ERC-1155 Token

The core token contract representing tokenized carbon credits.

```
Contract: CarbonCredit (ERC-1155)
├── Inherits: ERC1155, AccessControl, Pausable
├── Roles: MINTER_ROLE, VERIFIER_ROLE, ADMIN_ROLE (AccessControl)
├── Enums:
│   ├── CreditOrigin { Certified, CommunityVerified }
│   └── CreditStatus { Pending, Verified, Suspended, Retired }
├── Structs:
│   ├── CreditType {
│   │     uint256 id
│   │     string projectName
│   │     string projectType        // "reforestation", "renewable", "methane_capture"
│   │     string region
│   │     uint256 vintageYear
│   │     uint256 tonnesCO2e        // tonnes of CO2 equivalent (for portfolio totals)
│   │     uint256 totalSupply
│   │     uint256 impactScore       // 0-100, set by AI via oracle
│   │     string metadataURI        // IPFS link
│   │     CreditOrigin origin       // Certified or CommunityVerified
│   │     CreditStatus status       // Pending, Verified, Suspended, Retired
│   │     address issuer
│   │     string registrySource     // "Verra", "Gold Standard", "" if native
│   │     string retirementProof    // Registry serial number / IPFS link to proof, "" if native
│   │ }
│   └── CreditParams {              // helper struct to avoid stack-too-deep
│         string projectName
│         string projectType
│         string region
│         uint256 vintageYear
│         uint256 tonnesCO2e
│         uint256 initialSupply
│         string metadataURI
│     }
├── Mappings:
│   ├── creditTypes: id => CreditType
│   ├── retiredCredits: address => id => amount
│   ├── usedRetirementProofs: bytes32 => bool  // hash(registrySource+serial) → prevents double-bridge
│   ├── blacklisted: address => bool            // fraudulent issuers
│   └── disputed: id => bool                    // flagged during challenge period
├── Functions:
│   ├── createCertifiedCredit(params, registrySource, retirementProof, issuer, verified)
│   │     → onlyRole(MINTER_ROLE), notBlacklisted, whenNotPaused
│   │     → params: CreditParams struct
│   │     → issuer: address to mint tokens to (MINTER_ROLE acts on behalf)
│   │     → verified: bool — true if AI confidence high (Verified), false (Pending)
│   │     → reverts if retirement proof hash already used
│   │     → reverts if issuer is blacklisted
│   │     → stores hash in usedRetirementProofs
│   ├── createCommunityCredit(params)
│   │     → public, notBlacklisted, whenNotPaused
│   │     → always minted as Pending, issuer = msg.sender
│   ├── verifyCommunityCredit(id) → onlyRole(VERIFIER_ROLE) // after DAO challenge period
│   ├── mintCredits(id, to, amount) → onlyRole(MINTER_ROLE)
│   ├── updateImpactScore(id, score) → onlyRole(VERIFIER_ROLE) // called by oracle, score 0-100
│   ├── retireCredits(id, amount) → public // burn mechanism, updates retiredCredits
│   ├── suspendCredit(id) → onlyRole(ADMIN_ROLE) // sets status to Suspended
│   ├── setDisputed(id, disputed) → onlyRole(ADMIN_ROLE) // flag/unflag during challenge
│   ├── blacklist(issuer, creditId) → onlyRole(ADMIN_ROLE) // permanent, emits event with creditId
│   ├── isBlacklisted(address) → view
│   ├── isRetirementProofUsed(bytes32 hash) → view
│   ├── isDisputed(id) → view
│   ├── getCreditType(id) → view
│   ├── uri(id) → override // returns IPFS metadataURI
│   ├── pause() → onlyRole(ADMIN_ROLE)
│   └── unpause() → onlyRole(ADMIN_ROLE)
├── Modifiers:
│   └── notBlacklisted(msg.sender) → on createCertifiedCredit + createCommunityCredit
└── Events (all indexed for frontend event filtering):
    ├── CertifiedCreditCreated(uint256 indexed id, string projectName, string registrySource, bytes32 proofHash)
    ├── CommunityCreditSubmitted(uint256 indexed id, string projectName, address indexed issuer)
    ├── CommunityCreditVerified(uint256 indexed id)
    ├── ImpactScoreUpdated(uint256 indexed id, uint256 oldScore, uint256 newScore)
    ├── CreditsRetired(address indexed owner, uint256 indexed creditId, uint256 amount)
    └── IssuerBlacklisted(address indexed issuer, uint256 creditId)
```

### 6.2 Marketplace.sol — Trading Engine

Handles listing, buying, and selling carbon credits.

```
Contract: Marketplace
├── Inherits: ReentrancyGuard
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
│   ├── carbonCredit: CarbonCredit (immutable reference)
│   ├── listings: listingId => Listing
│   ├── lastSoldPrice: creditId => uint256  // updated on each sale (for portfolio valuation)
│   ├── platformFee: uint256 (basis points, e.g., 250 = 2.5%)
│   ├── feeRecipient: address (DAO treasury)
│   └── accumulatedFees: uint256 // pull-pattern fee collection
├── Constructor: (carbonCreditAddress, platformFee, feeRecipient)
├── Functions:
│   ├── listCredits(creditId, amount, pricePerUnit) → public
│   │     → verifies credit status == Verified (only verified credits can be listed)
│   │     → verifies seller has sufficient balance + approval
│   ├── buyCredits(listingId, amount) → payable, nonReentrant
│   │     → transfers credits, pays seller minus fee, updates lastSoldPrice
│   │     → refunds excess payment
│   ├── cancelListing(listingId) → onlySeller
│   ├── updatePrice(listingId, newPrice) → onlySeller // emits PriceUpdated
│   ├── getLastSoldPrice(creditId) → view
│   ├── getListing(listingId) → view // returns full Listing struct
│   └── withdrawFees() → onlyFeeRecipient, nonReentrant
└── Events (all indexed for frontend event filtering):
    ├── Listed(uint256 indexed listingId, uint256 indexed creditId, address indexed seller, uint256 amount, uint256 price)
    ├── Sold(uint256 indexed listingId, address indexed buyer, uint256 indexed creditId, uint256 amount, uint256 totalPrice)
    ├── ListingCancelled(uint256 indexed listingId)
    └── PriceUpdated(uint256 indexed listingId, uint256 newPrice)
```

### 6.3 EcoForgeGovernance.sol — DAO

Focused governance for credit standards and dispute resolution.

```
Contract: EcoForgeGovernance
├── Enums:
│   ├── ProposalType { CreditEligibility, DisputeResolution }
│   └── DisputeStatus { Open, Resolved, Rejected }
├── Structs:
│   ├── Proposal {
│   │     uint256 id
│   │     address proposer
│   │     ProposalType pType
│   │     string description
│   │     uint256 forVotes
│   │     uint256 againstVotes
│   │     uint256 deadline
│   │     bool executed
│   │     bytes actionCalldata     // action to execute (named to avoid reserved word)
│   │ }
│   ├── Dispute {
│   │     uint256 creditId
│   │     address challenger
│   │     string reason
│   │     DisputeStatus status
│   │ }
│   └── DisputeStake {             // tracks staked tokens per dispute
│         address challenger
│         uint256 amount
│         bool returned
│     }
├── References: EcoForgeToken (immutable), CarbonCredit (immutable)
├── State:
│   ├── proposals: proposalId => Proposal
│   ├── disputes: disputeId => Dispute
│   ├── disputeStakes: disputeId => DisputeStake
│   ├── hasVoted: proposalId => voter => bool
│   ├── disputeToProposal: disputeId => proposalId
│   └── proposalToDispute: proposalId => disputeId
├── Constants:
│   ├── VOTING_PERIOD: 7 days
│   ├── QUORUM_PERCENTAGE: 10% of total supply
│   ├── minProposalTokens: immutable (set in constructor)
│   ├── disputeStakeAmount: immutable (set in constructor)
│   └── disputeBonusAmount: immutable (bonus for successful challenger)
├── Constructor: (governanceToken, carbonCredit, minProposalTokens, disputeStakeAmount, disputeBonusAmount)
├── Functions:
│   ├── propose(pType, description, actionCalldata) → requires minProposalTokens balance
│   ├── vote(proposalId, support) → weight = token balance, no double vote
│   │     → calls governanceToken.recordAction(voter) via try/catch (best-effort milestone reward)
│   ├── execute(proposalId) → quorumReached + deadline passed + majority FOR
│   │     → DisputeResolution: auto-resolves dispute (suspend + return stake + bonus + burnAll + blacklist)
│   │     → CreditEligibility: executes stored actionCalldata via address(this).call()
│   ├── disputeCredit(creditId, reason) → public
│   │     → burns disputeStakeAmount tokens from challenger (lock via burn)
│   │     → auto-creates a DisputeResolution proposal
│   │     → marks credit as disputed on-chain (carbonCredit.setDisputed)
│   ├── resolveDisputeAgainst(disputeId) → external, callable after vote fails
│   │     → sets dispute to Rejected, unflags credit, staked tokens already burned (not returned)
│   ├── getProposal(proposalId) → view
│   ├── getDispute(disputeId) → view
│   ├── getDisputeStake(disputeId) → view
│   ├── hasVoted(proposalId, voter) → view
│   └── getDisputeProposalId(disputeId) → view
└── Events (all indexed for frontend event filtering):
    ├── ProposalCreated(uint256 indexed id, address indexed proposer, ProposalType pType)
    ├── Voted(uint256 indexed proposalId, address indexed voter, bool support, uint256 weight)
    ├── ProposalExecuted(uint256 indexed id)
    ├── DisputeRaised(uint256 indexed creditId, address indexed challenger, uint256 indexed autoProposalId)
    ├── DisputeStaked(uint256 indexed disputeId, address indexed challenger, uint256 amount)
    ├── DisputeStakeReturned(uint256 indexed disputeId, address indexed challenger, uint256 amount)
    └── DisputeStakeBurned(uint256 indexed disputeId, address indexed challenger, uint256 amount)
```

### 6.4b EcoForgeToken.sol — Governance Token

ERC-20 token used for voting power in the DAO. Earned through milestone-based activity rewards.

```
Contract: EcoForgeToken (ERC-20)
├── Inherits: ERC20, AccessControl
├── Soulbound: _update() override blocks all transfers (only mint/burn allowed)
├── Roles: MINTER_ROLE (held by Governance contract + admin)
├── Structs:
│   └── Milestone {
│         uint256 actionsRequired      // cumulative actions needed
│         uint256 tokensRewarded       // tokens minted at this milestone
│     }
├── State:
│   ├── milestones: Milestone[]        // hardcoded tiers
│   ├── userActions: address => uint256  // cumulative action count per wallet
│   ├── userMilestone: address => uint256 // next milestone index to reach
│   ├── dailyActionCap: uint256        // max actions counted per wallet per day (anti-sybil)
│   └── dailyActions: address => day => count // daily tracking per wallet
├── Constructor: (dailyActionCap)
├── Functions:
│   ├── recordAction(user) → onlyRole(MINTER_ROLE)
│   │     // Called by other contracts on each qualifying action
│   │     // Checks daily action cap (reverts if exceeded)
│   │     // Increments userActions[user]
│   │     // If new milestone reached → auto-mint tokens to user
│   ├── mint(to, amount) → onlyRole(MINTER_ROLE)
│   │     // Used by Governance to return dispute stakes + bonus to challengers
│   │     // Necessary because soulbound tokens can't be transferred, so stake
│   │     // return works via burn-at-stake → re-mint-on-win pattern
│   ├── burn(user, amount) → onlyRole(MINTER_ROLE) // for punishments
│   ├── burnAll(user) → onlyRole(MINTER_ROLE) // burn entire balance (fraud penalty)
│   ├── getMilestones() → view
│   ├── getUserProgress(user) → view // returns { actions, currentMilestone, nextMilestone, tokensEarned }
│   └── transfer/transferFrom → DISABLED (revert "non-transferable")
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
│   ├── Vote on a proposal (via try/catch — best-effort, won't block vote if cap hit)
│   └── Submit a dispute that gets accepted
├── Anti-sybil:
│   ├── Max actions counted per wallet per day (constructor param, e.g., 10)
│   ├── Non-transferable tokens → can't consolidate across wallets
│   └── Actions cost gas → makes mass wallet creation expensive
└── Events (all indexed for frontend event filtering):
    ├── ActionRecorded(address indexed user, uint256 totalActions)
    ├── MilestoneReached(address indexed user, uint256 indexed milestoneIndex, uint256 tokensRewarded)
    ├── TokensBurned(address indexed user, uint256 amount, string reason)
    └── AllTokensBurned(address indexed user, string reason)
```

### 6.4c Punishment System

Anti-fraud and anti-spam mechanisms across all contracts.

```
CASE 1: Fraudulent credit detected (via DAO dispute vote)
─────────────────────────────────────────────────────────
Trigger: Dispute vote passes (FOR wins) → execute(proposalId) called
Actions (executed automatically by _resolveDisputeForWin):
  1. Challenger's staked tokens returned (re-minted via governanceToken.mint)
  2. Challenger receives bonus tokens (disputeBonusAmount)
  3. CarbonCredit.suspendCredit(creditId) — credit no longer tradeable
  4. EcoForgeToken.burnAll(issuer) — issuer loses ALL governance tokens
  5. CarbonCredit.blacklist(issuer, creditId) — issuer can never create credits again

CASE 2: False dispute (spam/malicious challenge)
─────────────────────────────────────────────────
Trigger: Dispute vote fails (AGAINST wins) → resolveDisputeAgainst(disputeId) called
Actions:
  1. Staked tokens already burned at dispute creation (not re-minted = permanent loss)
  2. Dispute status set to Rejected
  3. Credit unflagged as disputed (carbonCredit.setDisputed(creditId, false))

CASE 3: Successful dispute (legitimate challenge)
─────────────────────────────────────────────────
Same as CASE 1 — triggered by execute(proposalId) when FOR wins.

DISPUTE STAKE MECHANISM:
  - Must stake minimum DISPUTE_STAKE_AMOUNT governance tokens to submit dispute
  - If you don't have enough tokens → can't dispute (prevents spam from new accounts)
  - Staking = tokens are BURNED (not locked, because soulbound tokens can't be transferred)
  - On win: tokens are RE-MINTED to challenger (burn-at-stake → re-mint-on-win pattern)
  - On loss: tokens stay burned (permanent loss as punishment)
  - Credit is marked as disputed on-chain (carbonCredit.setDisputed(creditId, true))
```

Additions to existing contracts for punishment support:

```
CarbonCredit.sol — punishment additions:
├── Mappings:
│   ├── blacklisted: address => bool
│   └── disputed: id => bool                // flagged during challenge period
├── Functions:
│   ├── suspendCredit(id) → onlyRole(ADMIN_ROLE) // sets status to Suspended
│   ├── setDisputed(id, disputed) → onlyRole(ADMIN_ROLE) // flag/unflag during challenge
│   ├── blacklist(issuer, creditId) → onlyRole(ADMIN_ROLE) // Governance contract granted ADMIN_ROLE
│   ├── isBlacklisted(address) → view
│   └── isDisputed(id) → view
├── Modifiers:
│   └── notBlacklisted(msg.sender) on createCertifiedCredit + createCommunityCredit
└── Events:
    └── IssuerBlacklisted(address indexed issuer, uint256 creditId)

EcoForgeToken.sol — punishment/stake additions:
├── Functions:
│   └── mint(to, amount) → onlyRole(MINTER_ROLE)
│         // Used by Governance to return dispute stakes + bonus
│         // Necessary because soulbound tokens can't be transferred

EcoForgeGovernance.sol — dispute/punishment additions:
├── State:
│   ├── disputeStakes: disputeId => DisputeStake { challenger, amount, returned }
│   ├── disputeToProposal: disputeId => proposalId
│   └── proposalToDispute: proposalId => disputeId
├── Constants:
│   ├── disputeStakeAmount: immutable (set in constructor)
│   └── disputeBonusAmount: immutable (bonus for successful challenger)
├── Functions:
│   ├── disputeCredit(creditId, reason) → burns stake tokens, auto-creates proposal, marks credit disputed
│   ├── execute(proposalId) → for DisputeResolution: calls _resolveDisputeForWin (suspend + return + bonus + burnAll + blacklist)
│   │                        → for CreditEligibility: executes stored actionCalldata
│   └── resolveDisputeAgainst(disputeId) → external, for when AGAINST wins (burn stake, reject, unflag)
├── Role requirements (set in Deploy.s.sol):
│   ├── Governance needs MINTER_ROLE on EcoForgeToken (for burn, burnAll, mint, recordAction)
│   └── Governance needs ADMIN_ROLE on CarbonCredit (for suspendCredit, blacklist, setDisputed)
└── Events (all indexed for frontend event filtering):
    ├── DisputeStaked(uint256 indexed disputeId, address indexed challenger, uint256 amount)
    ├── DisputeStakeReturned(uint256 indexed disputeId, address indexed challenger, uint256 amount)
    └── DisputeStakeBurned(uint256 indexed disputeId, address indexed challenger, uint256 amount)
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
forge install smartcontractkit/chainlink-brownie-contracts
forge install foundry-rs/forge-std
```

```
OpenZeppelin (lib/openzeppelin-contracts) v5.6.1:
  ├── ERC1155           (CarbonCredit)
  ├── AccessControl     (CarbonCredit, EcoForgeToken, EcoForgeOracle)
  ├── Pausable          (CarbonCredit)
  ├── ReentrancyGuard   (Marketplace)
  └── ERC20             (EcoForgeToken — soulbound via _update override)

Chainlink Brownie Contracts (lib/chainlink-brownie-contracts) v1.3:
  ├── FunctionsClient   (EcoForgeOracle — v1_3_0)
  └── FunctionsRequest  (EcoForgeOracle — v1_0_0 library)

Forge Std (lib/forge-std) v1.15.0:
  ├── Test (base test contract)
  ├── console (logging)
  └── Script (deployment scripts)

Role Grant Requirements (set in Deploy.s.sol):
  ├── Governance contract → MINTER_ROLE on EcoForgeToken (burn, burnAll, mint, recordAction)
  ├── Governance contract → ADMIN_ROLE on CarbonCredit (suspendCredit, blacklist, setDisputed)
  └── Oracle contract → VERIFIER_ROLE on CarbonCredit (updateImpactScore)
```

### 6.6 Foundry Configuration

```toml
# foundry.toml
[profile.default]
src = "src/contracts"
out = "out"
libs = ["lib"]
solc_version = "0.8.24"
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
# @chainlink-contracts/=lib/chainlink-brownie-contracts/contracts/src/v0.8/
# forge-std/=lib/forge-std/src/
```

---

## 7. AI Layer

### 7.1 Architecture

All AI processing happens **server-side** in Next.js Server Actions (`"use server"`). The Claude API key is never exposed to the client.

```
┌──────────────────────────────────────────────────┐
│           AI Service Layer (Server Actions)       │
│                                                   │
│  ┌─────────────────┐       ┌───────────────────┐ │
│  │  Impact Score    │       │  Dispute          │ │
│  │  Generator       │       │  Analyzer         │ │
│  │  (Vision + text) │       │  (text only)      │ │
│  └────────┬─────────┘       └────────┬──────────┘ │
│           │                          │            │
│           └────────────┬─────────────┘            │
│                        │                          │
│              ┌─────────▼─────────┐                │
│              │   Claude API      │                │
│              │   (Sonnet 4.6)    │                │
│              └───────────────────┘                │
└──────────────────────────────────────────────────┘
```

### 7.2 AI Use Cases

#### A. Impact Score Generation (used on BOTH credit types)

**Input:** Project metadata + satellite imagery + retirement proof (if Certified)
**Output:** Impact score (0-100) + detailed breakdown + confidence

```
Prompt Structure:
- System: "You are an environmental impact assessor for carbon credits..."
- User: {
    projectData: { type, region, area, methodology, tonnesCO2e },
    satelliteImagery: [base64 images],       // Vision capability
    retirementProof: { serial, registry },   // Certified only
    creditOrigin: "Certified" | "Community"
  }
- Expected Output (structured JSON): {
    overallScore: 85,
    breakdown: {
      additionality: 90,
      permanence: 80,
      leakage: 85,
      verification: 85
    },
    proofConsistency: true,   // Certified only: does proof match project data?
    reasoning: "...",
    riskFactors: ["..."],
    confidence: 0.87
  }
```

#### B. Dispute Analysis

**Input:** Dispute details + credit data + challenger's reason
**Output:** Validity assessment + recommendation

```
Prompt Structure:
- System: "You are a carbon credit dispute analyst..."
- User: {
    creditData: { name, type, region, origin, impactScore, metadata },
    disputeReason: "The satellite imagery shows no tree cover...",
    satelliteImagery: [base64 images]    // Vision if available
  }
- Expected Output (structured JSON): {
    validity: "likely_fraudulent" | "likely_legitimate" | "insufficient_data",
    confidence: 0.78,
    recommendation: "suspend" | "dismiss" | "needs_investigation",
    reasoning: "...",
    redFlags: ["..."],
    supportingEvidence: ["..."]
  }
```

### 7.3 AI Service Implementation

2 Server Actions only:

```typescript
// actions/generateImpactScore.ts
"use server"
async function generateImpactScore(
  projectData: ProjectData,
  imageBase64?: string,
  retirementProof?: RetirementProof
): Promise<ImpactScore>

// actions/analyzeDispute.ts
"use server"
async function analyzeDispute(
  creditData: CreditData,
  disputeReason: string,
  imageBase64?: string
): Promise<DisputeAnalysis>
```

**Rate Limiting:** Max 50 requests/min per user.
**Cost Estimate:** ~$0.01-0.05 per impact score, ~$0.01-0.03 per dispute analysis.

---

## 8. Chainlink Oracle Integration

### 8.1 Overview

Chainlink serves as the bridge between off-chain data (AI scores, satellite data, carbon prices) and on-chain smart contracts.

### 8.2 Components

#### A. Price Feeds (Direct)
- AVAX/USD price feed (already available on Fuji)
- Carbon credit reference prices (if available, otherwise custom feed)

#### B. Chainlink Functions (serverless)

Chainlink Functions runs custom JavaScript in a decentralized oracle network (DON). No backend needed.

```
Flow:
1. User or admin triggers score update for a credit
2. Chainlink Functions executes JS code in the DON
3. JS code calls our Server Action to generate AI impact score
4. Score is returned to the DON
5. DON submits tx to CarbonCredit.updateImpactScore(creditId, score)
```

#### C. Oracle Contract

```
Contract: EcoForgeOracle
├── Inherits: FunctionsClient (Chainlink Functions v1.3), AccessControl
├── Roles: ADMIN_ROLE, REQUESTER_ROLE
├── State:
│   ├── carbonCredit: CarbonCredit (immutable)
│   ├── donId: bytes32
│   ├── subscriptionId: uint64
│   ├── callbackGasLimit: uint32 (default 300,000)
│   ├── source: string (JS code executed by DON)
│   └── pendingRequests: requestId => creditId
├── Constructor: (router, carbonCredit, donId, subscriptionId, source)
├── Functions:
│   ├── requestImpactScore(creditId) → onlyRole(REQUESTER_ROLE)
│   │     → builds FunctionsRequest, passes creditId as string arg, sends to DON
│   ├── _fulfillRequest(requestId, response, err) → internal callback from DON
│   │     → decodes score, clamps 0-100, calls carbonCredit.updateImpactScore
│   ├── setDonId(donId) → onlyRole(ADMIN_ROLE)
│   ├── setSubscriptionId(subscriptionId) → onlyRole(ADMIN_ROLE)
│   ├── setSource(source) → onlyRole(ADMIN_ROLE)
│   └── setCallbackGasLimit(limit) → onlyRole(ADMIN_ROLE)
├── Role requirements (set in Deploy.s.sol):
│   └── Oracle needs VERIFIER_ROLE on CarbonCredit (for updateImpactScore)
├── Dependency: lib/chainlink-brownie-contracts (FunctionsClient v1.3)
└── Events:
    ├── ScoreRequested(bytes32 indexed requestId, uint256 indexed creditId)
    ├── ScoreFulfilled(bytes32 indexed requestId, uint256 indexed creditId, uint256 score)
    └── ScoreRequestFailed(bytes32 indexed requestId, uint256 indexed creditId, bytes error)
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
│   └── page.tsx                # User dashboard (stats, holdings, retired, history, governance tokens + milestones)
├── marketplace/
│   ├── page.tsx                # Browse, search & filter credits
│   └── [creditId]/
│       └── page.tsx            # Credit detail (score, history, trade, challenge)
├── governance/
│   ├── page.tsx                # Proposals list
│   ├── [proposalId]/
│   │   └── page.tsx            # Proposal detail + voting
│   └── disputes/
│       └── page.tsx            # Active disputes
└── create/
    └── page.tsx                # Create/tokenize new credit (Certified or Community)
```

No API routes, no `/api` directory. All server-side logic is in Server Actions (`actions/` directory).

### 9.2 Key UI Components

See `FRONTEND_SPEC.md` for the full component list. Summary:

- **layout/** — Header, Footer, Sidebar
- **web3/** — ConnectButton, NetworkGuard, TxStatus
- **credits/** — CreditCard, CreditDetail, CreditOriginBadge, ImpactScoreBadge, TradePanel, RetireButton, ChallengeButton, SearchBar, CreditFilters
- **ai/** — ImpactScorePanel, AIInsightCard, AnalyzeButton
- **governance/** — ProposalCard, VotePanel, DisputeForm, DisputeCard
- **rewards/** — MilestoneProgress, MilestoneList, TokenBalance, RewardToast
- **charts/** — PriceChart, ScoreHistoryChart, VoteChart
- **common/** — LoadingSpinner, Modal, Toast, EmptyState

### 9.3 Web3 Configuration

```typescript
// config/wagmi.ts
- Chain: Avalanche Fuji Testnet (chainId: 43113)
- Transports: HTTP RPC (https://api.avax-test.network/ext/bc/C/rpc)
- Connectors: MetaMask, Core Wallet, WalletConnect
```

---

## 10. Data Architecture (No Backend)

There is **no database, no backend server, no API routes**. All data comes from two sources:

### 10.1 On-chain data (Avalanche C-Chain)

Read via wagmi/viem `readContract` and `getLogs`:

| Data | Contract | How |
|---|---|---|
| Credit types & metadata URI | CarbonCredit | `getCreditType(id)` |
| Impact scores | CarbonCredit | `creditTypes[id].impactScore` |
| Tonnes CO2e | CarbonCredit | `creditTypes[id].tonnesCO2e` |
| User credit balances | CarbonCredit | `balanceOfBatch()` |
| Retired credits (by user) | CarbonCredit | `getLogs` → `CreditsRetired` (indexed by owner) |
| Blacklisted issuers | CarbonCredit | `isBlacklisted(address)` |
| Used retirement proofs | CarbonCredit | `isRetirementProofUsed(hash)` |
| Active listings | Marketplace | `listings[id]` |
| Last sold price | Marketplace | `getLastSoldPrice(creditId)` |
| Trade history (by user) | Marketplace | `getLogs` → `Sold`, `Listed` (indexed by address) |
| Proposals & votes | EcoForgeGovernance | `proposals[id]` |
| Disputes & stakes | EcoForgeGovernance | `disputes[id]`, `disputeStakes[id]` |
| Governance token balance | EcoForgeToken | `balanceOf(address)` |
| Milestone progress | EcoForgeToken | `getUserProgress(address)` |
| AVAX/USD price | Chainlink Price Feed | `latestRoundData()` |

### 10.2 Off-chain data (IPFS via Lighthouse)

| Data | Format | How |
|---|---|---|
| Credit metadata (name, description, attributes) | JSON | Fetch `metadataURI` from contract → fetch from IPFS gateway |
| Satellite images | Image files | Stored in metadata JSON as `image` field → IPFS gateway |
| Project documentation | PDF/links | Stored in metadata JSON |

### 10.3 AI data (live, not cached)

| Data | Source | How |
|---|---|---|
| Impact score breakdown | Claude API | Server Action `generateImpactScore` (on-demand) |
| Dispute analysis | Claude API | Server Action `analyzeDispute` (on-demand) |

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

## 15. Server Actions (No API Routes)

There are no REST API endpoints. All server-side logic is in Next.js Server Actions:

| Action | File | Input | Output |
|--------|------|-------|--------|
| `generateImpactScore` | `actions/generateImpactScore.ts` | projectData, imageBase64?, retirementProof? | `{ score, breakdown, confidence, reasoning }` |
| `analyzeDispute` | `actions/analyzeDispute.ts` | creditData, disputeReason, imageBase64? | `{ validity, recommendation, confidence, reasoning }` |

Both use `"use server"` directive. The Anthropic API key is only accessible server-side.

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
│   ├── components/                 # React components (see FRONTEND_SPEC.md)
│   ├── hooks/                      # Custom React hooks (see FRONTEND_SPEC.md)
│   ├── actions/                    # Server Actions ("use server")
│   │   ├── generateImpactScore.ts
│   │   └── analyzeDispute.ts
│   ├── services/
│   │   ├── web3/
│   │   │   ├── contracts.ts        # Contract ABIs + addresses
│   │   │   └── config.ts           # wagmi config
│   │   └── ipfs/
│   │       └── lighthouse.ts       # IPFS upload service (Lighthouse SDK)
│   ├── lib/
│   │   └── utils.ts
│   ├── types/
│   │   ├── contracts.ts
│   │   ├── ai.ts
│   │   └── index.ts
│   └── stores/
│       └── useMarketStore.ts
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
- [ ] Set up IPFS (Lighthouse) integration

### Day 4 — Frontend Core

- [ ] Landing page
- [ ] Wallet connection + network setup
- [ ] Dashboard page
- [ ] Marketplace (list, browse, buy credits)
- [ ] Credit detail page with AI impact score

### Day 5 — Frontend Features

- [ ] Create/tokenize credit flow
- [ ] Governance page (proposals + voting + disputes)
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
# IPFS
LIGHTHOUSE_API_KEY=...

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
- [Lighthouse Storage](https://docs.lighthouse.storage/)

---

*EcoForge — Because the planet can't wait.*
