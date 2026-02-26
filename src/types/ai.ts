export interface ProjectData {
  projectName: string
  projectType: string
  region: string
  vintageYear: number
  tonnesCO2e: number
  methodology?: string
  description?: string
}

export interface RetirementProof {
  registrySource: string
  serialNumber: string
  registryLink?: string
}

export interface ImpactBreakdown {
  additionality: number
  permanence: number
  leakage: number
  verification: number
}

export interface ImpactScore {
  score: number
  breakdown: ImpactBreakdown
  proofConsistency: boolean | null
  reasoning: string
  riskFactors: string[]
  confidence: number
}

export interface DisputeAnalysis {
  validity: DisputeValidity
  confidence: number
  recommendation: DisputeRecommendation
  reasoning: string
  redFlags: string[]
  supportingEvidence: string[]
}

export type DisputeValidity =
  | "likely_fraudulent"
  | "likely_legitimate"
  | "insufficient_data"

export type DisputeRecommendation =
  | "suspend"
  | "dismiss"
  | "needs_investigation"
