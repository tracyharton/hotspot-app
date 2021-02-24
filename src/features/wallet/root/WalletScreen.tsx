import React, { memo, useCallback, useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { AnyTransaction, PendingTransaction, PaymentV1 } from '@helium/http'
import WalletViewContainer from './WalletViewContainer'
import Box from '../../../components/Box'
import ActivityDetails from './ActivityDetails/ActivityDetails'
import useVisible from '../../../utils/useVisible'
import usePrevious from '../../../utils/usePrevious'
import { RootState } from '../../../store/rootReducer'
import { useAppDispatch } from '../../../store/store'
import { fetchTxns } from '../../../store/activity/activitySlice'
import animateTransition from '../../../utils/animateTransition'
import { ActivityViewState } from './walletTypes'

const WalletScreen = () => {
  const dispatch = useAppDispatch()
  const [transactionData, setTransactionData] = useState<AnyTransaction[]>([])
  const [pendingTxns, setPendingTxns] = useState<PendingTransaction[]>([])
  const [showSkeleton, setShowSkeleton] = useState(true)
  const [activityViewState, setActivityViewState] = useState<ActivityViewState>(
    'undetermined',
  )

  const {
    activity: {
      txnData,
      txnStatus,
      txnInitLoaded,
      filter,
      detailTxn,
      requestMore,
    },
    heliumData: { blockHeight },
  } = useSelector((state: RootState) => state)

  const interval = useRef<NodeJS.Timeout>()
  const visible = useVisible()
  const prevVisible = usePrevious(visible)
  const prevBlockHeight = usePrevious(blockHeight)

  const updateTxnData = useCallback((data: AnyTransaction[]) => {
    animateTransition()
    setTransactionData(data)
  }, [])

  useEffect(() => {
    const preloadData = () => {
      dispatch(fetchTxns({ filter: 'all', reset: true }))
      dispatch(fetchTxns({ filter: 'pending' }))
    }
    preloadData()
  }, [dispatch])

  useEffect(() => {
    if (filter === 'pending') {
      setTransactionData([])
      return
    }
    if (txnStatus[filter] === 'pending' || txnStatus[filter] === 'idle') {
      return
    }
    const data = txnData[filter]
    if (data.length !== transactionData.length) {
      updateTxnData(data)
    } else if (data.length) {
      data.some((txn, index) => {
        const prevTxn = txn as PaymentV1
        const nextTxn = transactionData[index] as PaymentV1

        const hashEqual = nextTxn.hash === prevTxn.hash
        if (!hashEqual) {
          // data has changed update
          updateTxnData(data)
        }
        return hashEqual
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [txnData[filter]])

  useEffect(() => {}, [showSkeleton, activityViewState])

  useEffect(() => {
    if (!txnData.pending.length && !pendingTxns.length) return

    setPendingTxns(txnData.pending)
  }, [pendingTxns, txnData.pending])

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
          pendingTxns={pendingTxns}
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
