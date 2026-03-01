export enum CreditOrigin {
  Certified = 0,
  CommunityVerified = 1,
}

export enum CreditStatus {
  Pending = 0,
  Verified = 1,
  Suspended = 2,
  Retired = 3,
}

export enum ProposalType {
  CreditEligibility = 0,
  DisputeResolution = 1,
}

export enum DisputeStatus {
  Open = 0,
  Resolved = 1,
  Rejected = 2,
}

export interface CreditType {
  id: bigint
  projectName: string
  projectType: string
  region: string
  vintageYear: bigint
  tonnesCO2e: bigint
  totalSupply: bigint
  impactScore: bigint
  metadataURI: string
  origin: CreditOrigin
  status: CreditStatus
  issuer: `0x${string}`
  registrySource: string
  retirementProof: string
}

export interface Listing {
  listingId: bigint
  creditId: bigint
  seller: `0x${string}`
  amount: bigint
  pricePerUnit: bigint
  active: boolean
}

export interface Proposal {
  id: bigint
  proposer: `0x${string}`
  pType: ProposalType
  description: string
  forVotes: bigint
  againstVotes: bigint
  deadline: bigint
  executed: boolean
  actionCalldata: `0x${string}`
}

export interface Dispute {
  creditId: bigint
  challenger: `0x${string}`
  reason: string
  status: DisputeStatus
}

export interface DisputeStake {
  challenger: `0x${string}`
  amount: bigint
  returned: boolean
}

export interface Milestone {
  actionsRequired: bigint
  tokensRewarded: bigint
}

export interface UserProgress {
  actions: bigint
  currentMilestone: bigint
  nextMilestone: bigint
  tokensEarned: bigint
}

export interface CertifiedCreditCreatedEvent {
  id: bigint
  projectName: string
  registrySource: string
  proofHash: `0x${string}`
}

export interface CommunityCreditSubmittedEvent {
  id: bigint
  projectName: string
  issuer: `0x${string}`
}

export interface CreditsRetiredEvent {
  owner: `0x${string}`
  creditId: bigint
  amount: bigint
}

export interface ListedEvent {
  listingId: bigint
  creditId: bigint
  seller: `0x${string}`
  amount: bigint
  price: bigint
}

export interface SoldEvent {
  listingId: bigint
  buyer: `0x${string}`
  creditId: bigint
  amount: bigint
  totalPrice: bigint
}

export interface VotedEvent {
  proposalId: bigint
  voter: `0x${string}`
  support: boolean
  weight: bigint
}

export interface MilestoneReachedEvent {
  user: `0x${string}`
  milestoneIndex: bigint
  tokensRewarded: bigint
}

export interface DisputeRaisedEvent {
  creditId: bigint
  challenger: `0x${string}`
  autoProposalId: bigint
}
