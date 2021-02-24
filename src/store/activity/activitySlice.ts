import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { PendingTransaction, AnyTransaction } from '@helium/http'
import { differenceBy, unionBy } from 'lodash'
import { initFetchers, txnFetchers } from '../../utils/appDataClient'
import { FilterType } from '../../features/wallet/root/walletTypes'

export type Loading = 'idle' | 'pending' | 'fulfilled' | 'rejected'

export type ActivityState = {
  txnData: {
    all: AnyTransaction[]
    hotspot: AnyTransaction[]
    mining: AnyTransaction[]
    payment: AnyTransaction[]
    pending: PendingTransaction[]
  }
  txnStatus: {
    all: Loading
    hotspot: Loading
    mining: Loading
    payment: Loading
    pending: Loading
  }
  txnInitLoaded: {
    all: boolean
    hotspot: boolean
    mining: boolean
    payment: boolean
    pending: boolean
  }
  filter: FilterType
  detailTxn?: AnyTransaction | PendingTransaction
  requestMore: boolean
}

const initialState: ActivityState = {
  txnData: {
    all: [],
    hotspot: [],
    mining: [],
    payment: [],
    pending: [],
  },
  txnStatus: {
    all: 'idle',
    hotspot: 'idle',
    mining: 'idle',
    payment: 'idle',
    pending: 'idle',
  },
  txnInitLoaded: {
    all: false,
    hotspot: false,
    mining: false,
    payment: false,
    pending: false,
  },
  filter: 'all',
  requestMore: false,
}

export const ACTIVITY_FETCH_SIZE = 50

type FetchTxns = { filter: FilterType; reset?: boolean }
export const fetchTxns = createAsyncThunk<
  AnyTransaction[] | PendingTransaction[],
  FetchTxns
>('activity/fetchAccountActivity', async ({ filter, reset }, { dispatch }) => {
  if (reset) {
    await initFetchers()
    dispatch(activitySlice.actions.resetTxnStatuses(filter))
  }

  const list = txnFetchers[filter]
  return list.takeJSON(filter === 'pending' ? 1000 : ACTIVITY_FETCH_SIZE)
})

const activitySlice = createSlice({
  name: 'activity',
  initialState,
  reducers: {
    setFilter: (state, action: PayloadAction<FilterType>) => {
      state.filter = action.payload
    },
    requestMoreActivity: (state) => {
      state.requestMore = true
    },
    resetTxnStatuses: (state, action: PayloadAction<FilterType>) => {
      Object.keys(state.txnStatus).forEach((key) => {
        const filterType = key as FilterType
        if (filterType !== 'pending' && filterType !== action.payload) {
          // Don't reset pending, it updates on an interval, and we clear it manually
          // Don't reset the requested filter type. We want that one to stay pending
          state.txnStatus[filterType] = 'idle'
        }
      })
    },
    addPendingTransaction: (
      state,
      action: PayloadAction<PendingTransaction>,
    ) => {
      state.txnData.pending.push(action.payload)
    },
    setDetailTxn: (
      state,
      action: PayloadAction<AnyTransaction | PendingTransaction>,
    ) => {
      state.detailTxn = action.payload
    },
    clearDetailTxn: (state) => {
      return { ...state, detailTxn: undefined }
    },
    signOut: () => {
      return { ...initialState }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(
      fetchTxns.pending,
      (
        state,
        {
          meta: {
            arg: { filter },
          },
        },
      ) => {
        state.txnStatus[filter] = 'pending'
      },
    )
    builder.addCase(
      fetchTxns.rejected,
      (
        state,
        {
          meta: {
            arg: { filter },
          },
        },
      ) => {
        if (!state.txnInitLoaded[filter]) {
          state.txnInitLoaded[filter] = true
        }
        state.requestMore = false
        state.txnStatus[filter] = 'rejected'
      },
    )
    builder.addCase(
      fetchTxns.fulfilled,
      (
        state,
        {
          payload,
          meta: {
            arg: { filter, reset },
          },
        },
      ) => {
        state.requestMore = false
        state.txnStatus[filter] = 'fulfilled'
        if (!state.txnInitLoaded[filter]) {
          state.txnInitLoaded[filter] = true
        }

        if (reset && state.filter === filter) {
          Object.keys(state.txnData).forEach((key) => {
            const filterType = key as FilterType
            if (filterType !== 'pending') {
              // Don't reset pending, we will clear it manually
              state.txnData[filterType] = []
            }
          })
        }

        if (payload.length === 0) return

        if (filter === 'pending') {
          const pending = payload as PendingTransaction[]
          const filtered = pending.filter((txn) => txn.status === 'pending')
          const joined = unionBy(filtered, state.txnData.pending, 'hash')
          state.txnData.pending = joined
        } else {
          const nextTxns = [
            ...state.txnData[filter],
            ...(payload as AnyTransaction[]),
          ]
          state.txnData[filter] = nextTxns

          // remove any pending txns with the same hash
          const nextPending = differenceBy(
            state.txnData.pending,
            nextTxns,
            'hash',
          )
          state.txnData.pending = nextPending
        }
      },
    )
  },
})

export default activitySlice
