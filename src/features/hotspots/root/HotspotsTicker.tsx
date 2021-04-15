/* eslint-disable react/jsx-props-no-spreading */
import React, { useEffect, memo, useMemo } from 'react'
import { useSelector } from 'react-redux'
import TextTicker from 'react-native-text-ticker'
import { BoxProps } from '@shopify/restyle'
import Box from '../../../components/Box'
import {
  fetchCounts,
  fetchCurrentOraclePrice,
  fetchPredictedOraclePrice,
} from '../../../store/helium/heliumDataSlice'
import { RootState } from '../../../store/rootReducer'
import { useAppDispatch } from '../../../store/store'
import { useTextVariants } from '../../../theme/themeHooks'
import { Theme } from '../../../theme/theme'
import { locale } from '../../../utils/i18n'

type Props = BoxProps<Theme>
const HotspotsTicker = ({ ...boxProps }: Props) => {
  const dispatch = useAppDispatch()
  const { body2 } = useTextVariants()
  const currentOraclePrice = useSelector(
    (state: RootState) => state.heliumData.currentOraclePrice,
  )
  const hotspotCount = useSelector(
    (state: RootState) => state.heliumData.hotspotCount,
  )
  const blockTime = useSelector(
    (state: RootState) => state.heliumData.blockTime,
  )

  // update oracles
  useEffect(() => {
    dispatch(fetchCurrentOraclePrice())
    dispatch(fetchPredictedOraclePrice())
    dispatch(fetchCounts())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const textStyle = useMemo(
    () => ({ ...body2, fontSize: 16, color: '#AEB0D8' }),
    [body2],
  )

  const text = useMemo(() => {
    // TODO: Translate
    return `${
      hotspotCount?.toLocaleString(locale) || 0
    } Hotspots • Oracle Price: ${
      currentOraclePrice?.price
    } • Block Time: ${blockTime} secs`
  }, [blockTime, currentOraclePrice?.price, hotspotCount])

  return (
    <Box {...boxProps}>
      <TextTicker style={textStyle} scrollSpeed={300} loop bounce>
        {text}
      </TextTicker>
    </Box>
  )
}

export default memo(HotspotsTicker)
