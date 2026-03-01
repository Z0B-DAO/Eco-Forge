"use server"

import type { ProjectData, DisputeAnalysis } from "@/types/ai"

interface AnalyzeDisputeInput {
  project: ProjectData
  disputeReason: string
  creditScore?: number
  evidenceUrls?: string[]
}

export async function analyzeDispute(
  input: AnalyzeDisputeInput
): Promise<DisputeAnalysis> {
  // TODO: Replace with real Claude API call when SDK is installed
  // const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  // const message = await anthropic.messages.create({ ... })

  await new Promise((r) => setTimeout(r, 2000))

  const hasEvidence = (input.evidenceUrls?.length ?? 0) > 0
  const hasHighScore = (input.creditScore ?? 0) >= 75
  const reasonLength = input.disputeReason.length

  const isLikelyValid = hasEvidence && reasonLength > 50
  const isLikelyFraud = isLikelyValid && !hasHighScore

  const redFlags: string[] = []
  const supportingEvidence: string[] = []

  if (!hasHighScore) {
    redFlags.push("Credit has a below-average AI impact score")
  }
  if (reasonLength > 100) {
    supportingEvidence.push("Detailed dispute reason provided by challenger")
  }
  if (hasEvidence) {
    supportingEvidence.push(`${input.evidenceUrls!.length} evidence document(s) submitted`)
  }
  if (reasonLength < 30) {
    redFlags.push("Dispute reason is vague — may be a frivolous challenge")
  }

  const validity = isLikelyFraud
    ? "likely_fraudulent" as const
    : isLikelyValid
      ? "likely_legitimate" as const
      : "insufficient_data" as const

  const recommendation = isLikelyFraud
    ? "suspend" as const
    : isLikelyValid
      ? "dismiss" as const
      : "needs_investigation" as const

  const confidence = isLikelyFraud
    ? 0.7 + Math.random() * 0.2
    : isLikelyValid
      ? 0.6 + Math.random() * 0.2
      : 0.3 + Math.random() * 0.2

  return {
    validity,
    confidence: Math.round(confidence * 100) / 100,
    recommendation,
    reasoning: `AI analysis of dispute against "${input.project.projectName}". ${
      validity === "likely_fraudulent"
        ? "Multiple red flags detected. The credit's data appears inconsistent with the claimed carbon offset. Recommend suspension pending further review."
        : validity === "likely_legitimate"
          ? "The credit appears legitimate based on available data. The dispute may be unfounded."
          : "Insufficient data to make a confident determination. Manual investigation recommended."
    } Challenger's reason: "${input.disputeReason.slice(0, 100)}${reasonLength > 100 ? "..." : ""}"`,
    redFlags,
    supportingEvidence,
  }
}
