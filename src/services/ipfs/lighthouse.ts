import lighthouse from "@lighthouse-web3/sdk"

const API_KEY = process.env.LIGHTHOUSE_API_KEY || ""

export interface UploadResult {
  cid: string
  url: string
  size: string | number
}

export async function uploadJSON(data: Record<string, unknown>, name?: string): Promise<UploadResult> {
  if (!API_KEY) throw new Error("Lighthouse API key not configured")

  const blob = new Blob([JSON.stringify(data)], { type: "application/json" })
  const file = new File([blob], name || "metadata.json", { type: "application/json" })

  const response = await lighthouse.upload([file] as unknown as FileList, API_KEY)
  const hash = response.data.Hash

  return {
    cid: hash,
    url: `https://gateway.lighthouse.storage/ipfs/${hash}`,
    size: response.data.Size,
  }
}

export async function uploadFile(file: File): Promise<UploadResult> {
  if (!API_KEY) throw new Error("Lighthouse API key not configured")

  const response = await lighthouse.upload([file] as unknown as FileList, API_KEY)
  const hash = response.data.Hash

  return {
    cid: hash,
    url: `https://gateway.lighthouse.storage/ipfs/${hash}`,
    size: response.data.Size,
  }
}

export function ipfsUrl(cid: string): string {
  return `https://gateway.lighthouse.storage/ipfs/${cid}`
}

export async function uploadCreditMetadata(metadata: {
  projectName: string
  projectType: string
  region: string
  vintageYear: number
  tonnesCO2e: number
  description?: string
  methodology?: string
  satelliteImageCid?: string
  impactScore?: number
}): Promise<UploadResult> {
  return uploadJSON(
    {
      ...metadata,
      satelliteImage: metadata.satelliteImageCid
        ? ipfsUrl(metadata.satelliteImageCid)
        : undefined,
      createdAt: new Date().toISOString(),
      platform: "EcoForge",
    },
    `credit-${metadata.projectName.replace(/\s+/g, "-").toLowerCase()}.json`
  )
}
