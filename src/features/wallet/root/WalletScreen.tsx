import React, { memo, useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { AnyTransaction, PendingTransaction, PaymentV1 } from '@helium/http'
import { isEqual } from 'lodash'
import WalletViewContainer from './WalletViewContainer'
import Box from '../../../components/Box'
import ActivityDetails from './ActivityDetails/ActivityDetails'
import useVisible from '../../../utils/useVisible'
import usePrevious from '../../../utils/usePrevious'
import { RootState } from '../../../store/rootReducer'
import { useAppDispatch } from '../../../store/store'
import { fetchTxns } from '../../../store/activity/activitySlice'
import animateTransition from '../../../utils/animateTransition'
import { ActivityViewState, FilterKeys, FilterType } from './walletTypes'

const txnsEqual = (
  left: (AnyTransaction | PendingTransaction)[],
  right: (AnyTransaction | PendingTransaction)[],
) => {
  if (left.length !== right.length) {
    return false
  }
  if (left.length) {
    left.some((txn, index) => {
      const prevTxn = txn as PaymentV1
      const nextTxn = right[index] as PaymentV1

      const hashEqual = nextTxn.hash === prevTxn.hash
      if (!hashEqual) {
        return false
      }
      return hashEqual
    })
  }
  return true
}

const txnDataEqual = (
  left: Record<FilterType, (AnyTransaction | PendingTransaction)[]>,
  right: Record<FilterType, (AnyTransaction | PendingTransaction)[]>,
) =>
  FilterKeys.some((k) => {
    const filteredLeft = left[k]
    const filteredRight = right[k]
    return txnsEqual(filteredLeft, filteredRight)
  })

const WalletScreen = () => {
  const dispatch = useAppDispatch()
  const [transactionData, setTransactionData] = useState<
    (PendingTransaction | AnyTransaction)[]
  >([])
  const [showSkeleton, setShowSkeleton] = useState(true)
  const [activityViewState, setActivityViewState] = useState<ActivityViewState>(
    'undetermined',
  )

  const blockHeight = useSelector(
    (state: RootState) => state.heliumData.blockHeight,
    isEqual,
  )
  const detailTxn = useSelector(
    (state: RootState) => state.activity.detailTxn,
    isEqual,
  )
  const requestMore = useSelector(
    (state: RootState) => state.activity.requestMore,
    isEqual,
  )
  const filter = useSelector(
    (state: RootState) => state.activity.filter,
    isEqual,
  )
  const txnStatus = useSelector(
    (state: RootState) => state.activity.txnStatus,
    isEqual,
  )
  const txnInitLoaded = useSelector(
    (state: RootState) => state.activity.txnInitLoaded,
    isEqual,
  )
  const txnData = useSelector(
    (state: RootState) => state.activity.txnData,
    (left, right) => txnDataEqual(left, right),
  )

  const interval = useRef<NodeJS.Timeout>()
  const visible = useVisible()
  const prevVisible = usePrevious(visible)
  const prevBlockHeight = usePrevious(blockHeight)

  useEffect(() => {
    const updateTxns = async () => {
      const allData = [
        ...txnData[filter],
        ...(filter !== 'pending' ? txnData.pending : []),
      ]
      setTransactionData(allData)
    }
    updateTxns()
  }, [filter, txnData, dispatch])

  useEffect(() => {
    const preloadData = () => {
      dispatch(fetchTxns({ filter: 'all', reset: true }))
      dispatch(fetchTxns({ filter: 'pending' }))
    }
    preloadData()
  }, [dispatch])

  useEffect(() => {
    // once you have activity, you always have activity
    if (activityViewState === 'activity') return

    const allLoaded = txnInitLoaded.all
    const allData = txnData.all
    const pendingLoaded = txnInitLoaded.pending
    const pendingData = txnData.pending

    if (!allLoaded || !pendingLoaded) return

    if (pendingData.length || allData.length) {
      setActivityViewState('activity')
    } else if (
      !pendingData.length &&
      !allData.length &&
      activityViewState !== 'no_activity'
    ) {
      setActivityViewState('no_activity')
    }
  }, [
    activityViewState,
    txnData.all,
    txnData.pending,
    txnInitLoaded.all,
    txnInitLoaded.pending,
  ])

  useEffect(() => {
    const nextShowSkeleton = !txnInitLoaded[filter] || !txnInitLoaded.pending

    if (nextShowSkeleton !== showSkeleton) {
      if (visible) {
        animateTransition()
      }
      setShowSkeleton(nextShowSkeleton)
    }
  }, [filter, showSkeleton, txnInitLoaded, visible])

  useEffect(() => {
    // Fetch pending txns on an interval of 5s
    if (!visible && interval.current) {
      clearInterval(interval.current)
      interval.current = undefined
    } else if (visible && !interval.current) {
      dispatch(fetchTxns({ filter: 'pending' }))

      interval.current = setInterval(() => {
        dispatch(fetchTxns({ filter: 'pending' }))
      }, 5000)
    }
  }, [dispatch, visible])

  useEffect(() => {
    // if we're resetting wait for it to finish
    // if the filter is set to pending, do nothing. It refreshes on an interval.
    if (!visible || filter === 'pending') return

    // Block height is being request every 30s in App.tsx
    // Reset data if block changes or view becomes visible
    if (!prevVisible || blockHeight !== prevBlockHeight) {
      dispatch(fetchTxns({ filter, reset: true }))
      return
    }

    // if filter changes & there's no txn data for that filter, request
    if (txnData[filter].length === 0 && txnStatus[filter] === 'idle') {
      dispatch(fetchTxns({ filter }))
    }
  }, [
    blockHeight,
    dispatch,
    filter,
    prevBlockHeight,
    prevVisible,
    txnData,
    txnStatus,
    visible,
  ])

  useEffect(() => {
    if (!visible) return
    if (requestMore && txnStatus[filter] !== 'pending') {
      dispatch(fetchTxns({ filter }))
    }
  }, [dispatch, filter, requestMore, txnStatus, visible])

  return (
    <>
      <Box flex={1} backgroundColor="primaryBackground">
        <WalletViewContainer
          txns={transactionData}
          filter={filter}
          activityViewState={activityViewState}
          showSkeleton={showSkeleton}
        />
      </Box>

      <ActivityDetails detailTxn={detailTxn} />
    </>
  )
}

export default memo(WalletScreen)
