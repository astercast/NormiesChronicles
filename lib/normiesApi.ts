const API_BASE = 'https://api.normies.art'

export interface CanvasStatus {
  paused: boolean
  maxBurnPercent: number
  tierThresholds: number[]
  tierMinPercents: number[]
}

async function apiFetch<T>(path: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(`${API_BASE}${path}`, { next: { revalidate: 300 } })
    if (!res.ok) throw new Error(`API ${res.status}`)
    return res.json() as Promise<T>
  } catch {
    return fallback
  }
}

export async function getGlobalCanvasStatus(): Promise<CanvasStatus> {
  return apiFetch('/canvas/status', {
    paused: false,
    maxBurnPercent: 4,
    tierThresholds: [490, 890],
    tierMinPercents: [1, 2, 3],
  })
}

export function getNormieImageUrl(id: number): string {
  return `${API_BASE}/normie/${id}/image.png`
}

export async function fetchCanvasStatus() {
  return getGlobalCanvasStatus()
}
