/* eslint-disable @typescript-eslint/naming-convention */
import React, { useCallback, memo, useMemo, useState, useEffect } from 'react'
import { useAsync } from 'react-async-hook'
import { AnyTransaction, PendingTransaction } from '@helium/http'
import { BottomSheetSectionList } from '@gorhom/bottom-sheet'
import { getSecureItem } from '../../../../utils/secureAccount'
import activitySlice from '../../../../store/activity/activitySlice'
import { useAppDispatch } from '../../../../store/store'
import { useSpacing } from '../../../../theme/themeHooks'
import ActivityCardLoading from './ActivityCardLoading'
import { ActivitySection } from '../walletTypes'
import Text from '../../../../components/Text'
import Box from '../../../../components/Box'
import useActivityItem from '../useActivityItem'
import useVisible from '../../../../utils/useVisible'

type Props = {
  hasNoResults: boolean
  data: (PendingTransaction | AnyTransaction)[]
}

const ActivityCardListView = ({ data, hasNoResults }: Props) => {
  const { m } = useSpacing()
  const { loading, result: address } = useAsync(getSecureItem, ['address'])
  const { groupAndSortTxns } = useActivityItem(address || '')
  const dispatch = useAppDispatch()
  const [transactionData, setTransactionData] = useState<ActivitySection[]>([])
  const visible = useVisible()

  const requestMore = useCallback(() => {
    dispatch(activitySlice.actions.requestMoreActivity())
  }, [dispatch])

  useEffect(() => {
    const nextTxnData = groupAndSortTxns(data)
    setTransactionData(nextTxnData)
  }, [data, groupAndSortTxns, visible])

  type Item = {
    item: string
    index: number
  }
  const renderItem = useCallback(({ item }: Item) => {
    return (
      <Text
        variant="body1"
        color="black"
        numberOfLines={1}
        ellipsizeMode="middle"
        margin="s"
      >
        {item}
      </Text>
    )
  }, [])

  const keyExtractor = useCallback(
    (item: string, index: number) => `${item}.${index}`,
    [],
  )

  const contentContainerStyle = useMemo(() => {
    return { paddingHorizontal: m, paddingBottom: 100 }
  }, [m])

  const footer = useMemo(
    () => <ActivityCardLoading hasNoResults={hasNoResults} />,
    [hasNoResults],
  )

  const sectionHeader = useCallback(
    ({ section: { title: sectionTitle } }) => (
      <Box width="100%" backgroundColor="white" paddingVertical="m">
        <Text variant="subtitle" color="black">
          {sectionTitle}
        </Text>
      </Box>
    ),
    [],
  )

  if (loading) return null

  return (
    <BottomSheetSectionList
      sections={transactionData}
      keyExtractor={keyExtractor}
      ListFooterComponent={footer}
      renderSectionHeader={sectionHeader}
      renderItem={renderItem}
      contentContainerStyle={contentContainerStyle}
      onEndReached={requestMore}
    />
  )
}

export default memo(ActivityCardListView)
