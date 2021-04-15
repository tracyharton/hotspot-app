/* eslint-disable react/jsx-props-no-spreading */
import React, { useEffect, memo, useMemo } from 'react'
import { useSelector } from 'react-redux'
import TextTicker from 'react-native-text-ticker'
import { BoxProps } from '@shopify/restyle'
import Box from '../../../components/Box'
import {
  fetchCurrentOraclePrice,
  fetchPredictedOraclePrice,
} from '../../../store/helium/heliumDataSlice'
import { RootState } from '../../../store/rootReducer'
import { useAppDispatch } from '../../../store/store'
import { useTextVariants } from '../../../theme/themeHooks'
import { Theme } from '../../../theme/theme'

type Props = BoxProps<Theme>
const HotspotsTicker = ({ ...boxProps }: Props) => {
  const dispatch = useAppDispatch()
  const { body2 } = useTextVariants()
  const currentOraclePrice = useSelector(
    (state: RootState) => state.heliumData.currentOraclePrice,
  )

  // update oracles
  useEffect(() => {
    dispatch(fetchCurrentOraclePrice())
    dispatch(fetchPredictedOraclePrice())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const textStyle = useMemo(() => ({ ...body2, fontSize: 15, color: '#aaa' }), [
    body2,
  ])

  const text = useMemo(() => {
    return `21,356 Hotspots • Oracle Price: ${currentOraclePrice?.price} • 342 Hotspots added today • Block Time: 53secs (pretty good)`
  }, [currentOraclePrice?.price])

  return (
    <Box {...boxProps}>
      <TextTicker
        style={textStyle}
        // duration={3000}
        scrollSpeed={300}
        loop
        bounce
        repeatSpacer={50}
        // marqueeDelay={1000}
      >
        {text}
      </TextTicker>
    </Box>
  )
}

export default memo(HotspotsTicker)
