"use server"

import type { ProjectData, RetirementProof, ImpactScore } from "@/types/ai"

interface GenerateImpactScoreInput {
  project: ProjectData
  proof?: RetirementProof
  satelliteImageUrl?: string
}

export async function generateImpactScore(
  input: GenerateImpactScoreInput
): Promise<ImpactScore> {
  // TODO: Replace with real Claude API call when SDK is installed
  // const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  // const message = await anthropic.messages.create({ ... })

  await new Promise((r) => setTimeout(r, 1500))

  const hasProof = !!input.proof
  const isCertified = hasProof && !!input.proof?.registrySource

  const baseScore = isCertified ? 75 + Math.floor(Math.random() * 20) : 50 + Math.floor(Math.random() * 35)

  const breakdown = {
    additionality: clamp(baseScore + jitter(10)),
    permanence: clamp(baseScore + jitter(15)),
    leakage: clamp(baseScore + jitter(12)),
    verification: isCertified ? clamp(85 + jitter(10)) : clamp(55 + jitter(20)),
  }

  const score = Math.round(
    (breakdown.additionality + breakdown.permanence + breakdown.leakage + breakdown.verification) / 4
  )

  const riskFactors: string[] = []
  if (!isCertified) riskFactors.push("No registry certification — relies on community verification")
  if (breakdown.permanence < 60) riskFactors.push("Low permanence score — reversal risk detected")
  if (breakdown.leakage < 65) riskFactors.push("Potential carbon leakage to neighboring areas")
  if (!input.satelliteImageUrl) riskFactors.push("No satellite imagery provided for independent verification")

  return {
    score,
    breakdown,
    proofConsistency: hasProof ? Math.random() > 0.15 : null,
    reasoning: `AI analysis of "${input.project.projectName}" (${input.project.projectType}, ${input.project.region}). ${
      isCertified
        ? `Certified credit from ${input.proof!.registrySource} with serial ${input.proof!.serialNumber}. Registry data cross-referenced.`
        : "Community-submitted project. Evaluation based on project data and methodology description."
    } Overall confidence is ${score >= 75 ? "high" : score >= 50 ? "moderate" : "low"}.`,
    riskFactors,
    confidence: score >= 75 ? 0.85 + Math.random() * 0.1 : 0.5 + Math.random() * 0.25,
  }
}

function clamp(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)))
}

function jitter(range: number) {
  return Math.floor(Math.random() * range * 2) - range
}
