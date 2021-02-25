import { AnyTransaction, PendingTransaction } from '@helium/http'

export const FilterKeys = [
  'all',
  'mining',
  'payment',
  'hotspot',
  'pending',
] as const
export type FilterType = typeof FilterKeys[number]

export const Filters = {
  all: [],
  mining: ['rewards_v1'],
  payment: ['payment_v1', 'payment_v2'],
  hotspot: ['add_gateway_v1', 'assert_location_v1', 'transfer_hotspot_v1'],
  pending: [],
} as Record<FilterType, string[]>

export type ActivityViewState = 'undetermined' | 'no_activity' | 'activity'

export type ActivitySection = {
  transactions: Record<string, (AnyTransaction | PendingTransaction)[]>
  data: string[]
  title: string
}

export const TxnTypeKeys = [
  'rewards_v1',
  'payment_v1',
  'payment_v2',
  'add_gateway_v1',
  'assert_location_v1',
  'transfer_hotspot_v1',
  'token_burn_v1',
] as const

export type TxnType = typeof TxnTypeKeys[number]
