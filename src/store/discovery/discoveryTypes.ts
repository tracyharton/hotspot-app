export type RecentDiscoveryInfo = {
  nextRenewal: string
  recentRequests: DiscoveryRequest[]
  requestsRemaining: number
}

export type DiscoveryRequest = {
  id: number
  deviceAddress: string
  responses: DiscoveryResponse[]
  insertedAt: string
}

export type DiscoveryResponse = {
  channel: number
  deviceId: string
  frequency: number
  name: string
  reportedAt: number
  rssi: number
  snr: number
  spreading: string
  status: string
  lat: number
  long: number
}

export const DISCOVERY_DURATION_MINUTES = 1
