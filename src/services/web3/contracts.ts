const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as `0x${string}`

export const CONTRACT_ADDRESSES = {
  carbonCredit: (process.env.NEXT_PUBLIC_CARBON_CREDIT_ADDRESS || ZERO_ADDRESS) as `0x${string}`,
  marketplace: (process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS || ZERO_ADDRESS) as `0x${string}`,
  governance: (process.env.NEXT_PUBLIC_GOVERNANCE_ADDRESS || ZERO_ADDRESS) as `0x${string}`,
  ecoForgeToken: (process.env.NEXT_PUBLIC_ECOFORGE_TOKEN_ADDRESS || ZERO_ADDRESS) as `0x${string}`,
  oracle: (process.env.NEXT_PUBLIC_ORACLE_ADDRESS || ZERO_ADDRESS) as `0x${string}`,
} as const

export const CARBON_CREDIT_ABI = [
  // ── Views ──
  {
    name: "getCreditType",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "id", type: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "id", type: "uint256" },
          { name: "projectName", type: "string" },
          { name: "projectType", type: "string" },
          { name: "region", type: "string" },
          { name: "vintageYear", type: "uint256" },
          { name: "tonnesCO2e", type: "uint256" },
          { name: "totalSupply", type: "uint256" },
          { name: "impactScore", type: "uint256" },
          { name: "metadataURI", type: "string" },
          { name: "origin", type: "uint8" },
          { name: "status", type: "uint8" },
          { name: "issuer", type: "address" },
          { name: "registrySource", type: "string" },
          { name: "retirementProof", type: "string" },
        ],
      },
    ],
  },
  {
    name: "isRetirementProofUsed",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "proofHash", type: "bytes32" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "isBlacklisted",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "isDisputed",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "id", type: "uint256" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "uri",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "id", type: "uint256" }],
    outputs: [{ name: "", type: "string" }],
  },
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "account", type: "address" },
      { name: "id", type: "uint256" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "balanceOfBatch",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "accounts", type: "address[]" },
      { name: "ids", type: "uint256[]" },
    ],
    outputs: [{ name: "", type: "uint256[]" }],
  },
  {
    name: "isApprovedForAll",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "account", type: "address" },
      { name: "operator", type: "address" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  // ── Write — Create ──
  {
    name: "createCertifiedCredit",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "params",
        type: "tuple",
        components: [
          { name: "projectName", type: "string" },
          { name: "projectType", type: "string" },
          { name: "region", type: "string" },
          { name: "vintageYear", type: "uint256" },
          { name: "tonnesCO2e", type: "uint256" },
          { name: "initialSupply", type: "uint256" },
          { name: "metadataURI", type: "string" },
        ],
      },
      { name: "registrySource", type: "string" },
      { name: "retirementProof", type: "string" },
      { name: "issuer", type: "address" },
      { name: "verified", type: "bool" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "createCommunityCredit",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "params",
        type: "tuple",
        components: [
          { name: "projectName", type: "string" },
          { name: "projectType", type: "string" },
          { name: "region", type: "string" },
          { name: "vintageYear", type: "uint256" },
          { name: "tonnesCO2e", type: "uint256" },
          { name: "initialSupply", type: "uint256" },
          { name: "metadataURI", type: "string" },
        ],
      },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  // ── Write — Other ──
  {
    name: "retireCredits",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "id", type: "uint256" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
  },
  {
    name: "setApprovalForAll",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "operator", type: "address" },
      { name: "approved", type: "bool" },
    ],
    outputs: [],
  },
  {
    name: "verifyCommunityCredit",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "id", type: "uint256" }],
    outputs: [],
  },
  {
    name: "suspendCredit",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "id", type: "uint256" }],
    outputs: [],
  },
  {
    name: "setDisputed",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "id", type: "uint256" },
      { name: "disputed", type: "bool" },
    ],
    outputs: [],
  },
  {
    name: "blacklist",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "issuer", type: "address" },
      { name: "creditId", type: "uint256" },
    ],
    outputs: [],
  },
  {
    name: "updateImpactScore",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "id", type: "uint256" },
      { name: "score", type: "uint256" },
    ],
    outputs: [],
  },
  // ── Events ──
  {
    name: "CertifiedCreditCreated",
    type: "event",
    inputs: [
      { name: "id", type: "uint256", indexed: true },
      { name: "projectName", type: "string", indexed: false },
      { name: "registrySource", type: "string", indexed: false },
      { name: "proofHash", type: "bytes32", indexed: false },
    ],
  },
  {
    name: "CommunityCreditSubmitted",
    type: "event",
    inputs: [
      { name: "id", type: "uint256", indexed: true },
      { name: "projectName", type: "string", indexed: false },
      { name: "issuer", type: "address", indexed: true },
    ],
  },
  {
    name: "CommunityCreditVerified",
    type: "event",
    inputs: [{ name: "id", type: "uint256", indexed: true }],
  },
  {
    name: "ImpactScoreUpdated",
    type: "event",
    inputs: [
      { name: "id", type: "uint256", indexed: true },
      { name: "oldScore", type: "uint256", indexed: false },
      { name: "newScore", type: "uint256", indexed: false },
    ],
  },
  {
    name: "CreditsRetired",
    type: "event",
    inputs: [
      { name: "owner", type: "address", indexed: true },
      { name: "creditId", type: "uint256", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
  {
    name: "IssuerBlacklisted",
    type: "event",
    inputs: [
      { name: "issuer", type: "address", indexed: true },
      { name: "creditId", type: "uint256", indexed: false },
    ],
  },
] as const

export const MARKETPLACE_ABI = [
  // ── Views ──
  {
    name: "getListing",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "listingId", type: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "listingId", type: "uint256" },
          { name: "creditId", type: "uint256" },
          { name: "seller", type: "address" },
          { name: "amount", type: "uint256" },
          { name: "pricePerUnit", type: "uint256" },
          { name: "active", type: "bool" },
        ],
      },
    ],
  },
  {
    name: "getLastSoldPrice",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "creditId", type: "uint256" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "platformFee",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "accumulatedFees",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  // ── Write ──
  {
    name: "listCredits",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "creditId", type: "uint256" },
      { name: "amount", type: "uint256" },
      { name: "pricePerUnit", type: "uint256" },
    ],
    outputs: [{ name: "listingId", type: "uint256" }],
  },
  {
    name: "buyCredits",
    type: "function",
    stateMutability: "payable",
    inputs: [
      { name: "listingId", type: "uint256" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
  },
  {
    name: "cancelListing",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "listingId", type: "uint256" }],
    outputs: [],
  },
  {
    name: "updatePrice",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "listingId", type: "uint256" },
      { name: "newPrice", type: "uint256" },
    ],
    outputs: [],
  },
  {
    name: "withdrawFees",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
  // ── Events ──
  {
    name: "Listed",
    type: "event",
    inputs: [
      { name: "listingId", type: "uint256", indexed: true },
      { name: "creditId", type: "uint256", indexed: true },
      { name: "seller", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
      { name: "price", type: "uint256", indexed: false },
    ],
  },
  {
    name: "Sold",
    type: "event",
    inputs: [
      { name: "listingId", type: "uint256", indexed: true },
      { name: "buyer", type: "address", indexed: true },
      { name: "creditId", type: "uint256", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
      { name: "totalPrice", type: "uint256", indexed: false },
    ],
  },
  {
    name: "ListingCancelled",
    type: "event",
    inputs: [{ name: "listingId", type: "uint256", indexed: true }],
  },
  {
    name: "PriceUpdated",
    type: "event",
    inputs: [
      { name: "listingId", type: "uint256", indexed: true },
      { name: "newPrice", type: "uint256", indexed: false },
    ],
  },
] as const

export const GOVERNANCE_ABI = [
  // ── Views ──
  {
    name: "getProposal",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "proposalId", type: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "id", type: "uint256" },
          { name: "proposer", type: "address" },
          { name: "pType", type: "uint8" },
          { name: "description", type: "string" },
          { name: "forVotes", type: "uint256" },
          { name: "againstVotes", type: "uint256" },
          { name: "deadline", type: "uint256" },
          { name: "executed", type: "bool" },
          { name: "actionCalldata", type: "bytes" },
        ],
      },
    ],
  },
  {
    name: "getDispute",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "disputeId", type: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "creditId", type: "uint256" },
          { name: "challenger", type: "address" },
          { name: "reason", type: "string" },
          { name: "status", type: "uint8" },
        ],
      },
    ],
  },
  {
    name: "getDisputeStake",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "disputeId", type: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "challenger", type: "address" },
          { name: "amount", type: "uint256" },
          { name: "returned", type: "bool" },
        ],
      },
    ],
  },
  {
    name: "hasVoted",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "proposalId", type: "uint256" },
      { name: "voter", type: "address" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "getDisputeProposalId",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "disputeId", type: "uint256" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "VOTING_PERIOD",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "QUORUM_PERCENTAGE",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "disputeStakeAmount",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "disputeBonusAmount",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "minProposalTokens",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  // ── Write ──
  {
    name: "propose",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "pType", type: "uint8" },
      { name: "description", type: "string" },
      { name: "actionCalldata", type: "bytes" },
    ],
    outputs: [{ name: "proposalId", type: "uint256" }],
  },
  {
    name: "vote",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "proposalId", type: "uint256" },
      { name: "support", type: "bool" },
    ],
    outputs: [],
  },
  {
    name: "execute",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "proposalId", type: "uint256" }],
    outputs: [],
  },
  {
    name: "disputeCredit",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "creditId", type: "uint256" },
      { name: "reason", type: "string" },
    ],
    outputs: [{ name: "disputeId", type: "uint256" }],
  },
  {
    name: "resolveDisputeAgainst",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "disputeId", type: "uint256" }],
    outputs: [],
  },
  // ── Events ──
  {
    name: "ProposalCreated",
    type: "event",
    inputs: [
      { name: "id", type: "uint256", indexed: true },
      { name: "proposer", type: "address", indexed: true },
      { name: "pType", type: "uint8", indexed: false },
    ],
  },
  {
    name: "Voted",
    type: "event",
    inputs: [
      { name: "proposalId", type: "uint256", indexed: true },
      { name: "voter", type: "address", indexed: true },
      { name: "support", type: "bool", indexed: false },
      { name: "weight", type: "uint256", indexed: false },
    ],
  },
  {
    name: "ProposalExecuted",
    type: "event",
    inputs: [{ name: "id", type: "uint256", indexed: true }],
  },
  {
    name: "DisputeRaised",
    type: "event",
    inputs: [
      { name: "creditId", type: "uint256", indexed: true },
      { name: "challenger", type: "address", indexed: true },
      { name: "autoProposalId", type: "uint256", indexed: true },
    ],
  },
  {
    name: "DisputeStaked",
    type: "event",
    inputs: [
      { name: "disputeId", type: "uint256", indexed: true },
      { name: "challenger", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
  {
    name: "DisputeStakeReturned",
    type: "event",
    inputs: [
      { name: "disputeId", type: "uint256", indexed: true },
      { name: "challenger", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
  {
    name: "DisputeStakeBurned",
    type: "event",
    inputs: [
      { name: "disputeId", type: "uint256", indexed: true },
      { name: "challenger", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
] as const

export const ECOFORGE_TOKEN_ABI = [
  // ── Views ──
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "totalSupply",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "getUserProgress",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [
      { name: "actions", type: "uint256" },
      { name: "currentMilestone", type: "uint256" },
      { name: "nextMilestone", type: "uint256" },
      { name: "tokensEarned", type: "uint256" },
    ],
  },
  {
    name: "getMilestones",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "tuple[]",
        components: [
          { name: "actionsRequired", type: "uint256" },
          { name: "tokensRewarded", type: "uint256" },
        ],
      },
    ],
  },
  {
    name: "decimals",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
  // ── Write ──
  {
    name: "recordAction",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "user", type: "address" }],
    outputs: [],
  },
  {
    name: "mint",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
  },
  {
    name: "burn",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "user", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
  },
  {
    name: "burnAll",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "user", type: "address" }],
    outputs: [],
  },
  // ── Events ──
  {
    name: "ActionRecorded",
    type: "event",
    inputs: [
      { name: "user", type: "address", indexed: true },
      { name: "totalActions", type: "uint256", indexed: false },
    ],
  },
  {
    name: "MilestoneReached",
    type: "event",
    inputs: [
      { name: "user", type: "address", indexed: true },
      { name: "milestoneIndex", type: "uint256", indexed: true },
      { name: "tokensRewarded", type: "uint256", indexed: false },
    ],
  },
  {
    name: "TokensBurned",
    type: "event",
    inputs: [
      { name: "user", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
      { name: "reason", type: "string", indexed: false },
    ],
  },
  {
    name: "AllTokensBurned",
    type: "event",
    inputs: [
      { name: "user", type: "address", indexed: true },
      { name: "reason", type: "string", indexed: false },
    ],
  },
] as const

export const ORACLE_ABI = [
  // ── Write ──
  {
    name: "requestImpactScore",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "creditId", type: "uint256" }],
    outputs: [{ name: "requestId", type: "bytes32" }],
  },
  // ── Events ──
  {
    name: "ScoreRequested",
    type: "event",
    inputs: [
      { name: "requestId", type: "bytes32", indexed: true },
      { name: "creditId", type: "uint256", indexed: true },
    ],
  },
  {
    name: "ScoreFulfilled",
    type: "event",
    inputs: [
      { name: "requestId", type: "bytes32", indexed: true },
      { name: "creditId", type: "uint256", indexed: true },
      { name: "score", type: "uint256", indexed: false },
    ],
  },
  {
    name: "ScoreRequestFailed",
    type: "event",
    inputs: [
      { name: "requestId", type: "bytes32", indexed: true },
      { name: "creditId", type: "uint256", indexed: true },
      { name: "error", type: "bytes", indexed: false },
    ],
  },
] as const
