const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as `0x${string}`

export const CONTRACT_ADDRESSES = {
  carbonCredit: (process.env.NEXT_PUBLIC_CARBON_CREDIT_ADDRESS || ZERO_ADDRESS) as `0x${string}`,
  marketplace: (process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS || ZERO_ADDRESS) as `0x${string}`,
  governance: (process.env.NEXT_PUBLIC_GOVERNANCE_ADDRESS || ZERO_ADDRESS) as `0x${string}`,
  ecoForgeToken: (process.env.NEXT_PUBLIC_ECOFORGE_TOKEN_ADDRESS || ZERO_ADDRESS) as `0x${string}`,
  oracle: (process.env.NEXT_PUBLIC_ORACLE_ADDRESS || ZERO_ADDRESS) as `0x${string}`,
} as const

export const CARBON_CREDIT_ABI = [
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
    name: "createCertifiedCredit",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "projectName", type: "string" },
      { name: "projectType", type: "string" },
      { name: "region", type: "string" },
      { name: "vintageYear", type: "uint256" },
      { name: "tonnesCO2e", type: "uint256" },
      { name: "totalSupply", type: "uint256" },
      { name: "metadataURI", type: "string" },
      { name: "registrySource", type: "string" },
      { name: "retirementProof", type: "string" },
    ],
    outputs: [{ name: "creditId", type: "uint256" }],
  },
  {
    name: "createCommunityCredit",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "projectName", type: "string" },
      { name: "projectType", type: "string" },
      { name: "region", type: "string" },
      { name: "vintageYear", type: "uint256" },
      { name: "tonnesCO2e", type: "uint256" },
      { name: "totalSupply", type: "uint256" },
      { name: "metadataURI", type: "string" },
    ],
    outputs: [{ name: "creditId", type: "uint256" }],
  },
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
  {
    name: "listings",
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
] as const

export const GOVERNANCE_ABI = [
  {
    name: "proposals",
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
        ],
      },
    ],
  },
  {
    name: "disputes",
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
    name: "DISPUTE_STAKE_AMOUNT",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "propose",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "pType", type: "uint8" },
      { name: "description", type: "string" },
      { name: "calldataPayload", type: "bytes" },
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
      {
        name: "",
        type: "tuple",
        components: [
          { name: "actions", type: "uint256" },
          { name: "currentMilestone", type: "uint256" },
          { name: "nextMilestone", type: "uint256" },
          { name: "tokensEarned", type: "uint256" },
        ],
      },
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
  {
    name: "requestImpactScore",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "creditId", type: "uint256" }],
    outputs: [{ name: "requestId", type: "bytes32" }],
  },
  {
    name: "ScoreRequested",
    type: "event",
    inputs: [
      { name: "creditId", type: "uint256", indexed: true },
      { name: "requestId", type: "bytes32", indexed: true },
    ],
  },
  {
    name: "ScoreFulfilled",
    type: "event",
    inputs: [
      { name: "creditId", type: "uint256", indexed: true },
      { name: "requestId", type: "bytes32", indexed: true },
      { name: "score", type: "uint256", indexed: false },
    ],
  },
] as const
