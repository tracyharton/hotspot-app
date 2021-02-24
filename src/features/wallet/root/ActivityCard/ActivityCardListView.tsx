/* eslint-disable @typescript-eslint/naming-convention */
import React, { useCallback, memo, useMemo } from 'react'
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

type Props = {
  hasNoResults: boolean
  data: ActivitySection[]
}

const ActivityCardListView = ({ data, hasNoResults }: Props) => {
  const { m } = useSpacing()
  const dispatch = useAppDispatch()
  const { loading } = useAsync(getSecureItem, ['address'])
  const requestMore = useCallback(() => {
    dispatch(activitySlice.actions.requestMoreActivity())
  }, [dispatch])

  type Item = {
    item: AnyTransaction | PendingTransaction
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
        {item.hash}
      </Text>
    )
  }, [])

  const keyExtractor = useCallback(
    (item: AnyTransaction | PendingTransaction) => {
      const txn = item as PendingTransaction
      return `${txn.hash}${txn.status}`
    },
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
      sections={data}
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
