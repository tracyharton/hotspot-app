import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigation } from '@react-navigation/native'
import BackScreen from '../../../components/BackScreen'
import Box from '../../../components/Box'
import Button from '../../../components/Button'
import Text from '../../../components/Text'
import { RootNavigationProp } from '../../../navigation/main/tabTypes'

const NotHotspotOwnerErrorScreen = () => {
  const { t } = useTranslation()
  const navigation = useNavigation<RootNavigationProp>()

  const navExit = useCallback(async () => {
    navigation.navigate('MainTabs')
  }, [navigation])

  return (
    <BackScreen>
      <Box flex={1} justifyContent="center" paddingBottom="xxl">
        <Text variant="h1" marginBottom="l" maxFontSizeMultiplier={1}>
          {t('hotspot_setup.not_owner.title')}
        </Text>
        <Text
          variant="subtitleMedium"
          color="purpleMain"
          marginBottom={{ phone: 'l', smallPhone: 'ms' }}
        >
          {t('hotspot_setup.not_owner.subtitle_1')}
        </Text>
        <Text
          variant="subtitleLight"
          marginBottom={{ phone: 'xl', smallPhone: 'ms' }}
          numberOfLines={2}
          adjustsFontSizeToFit
          maxFontSizeMultiplier={1.3}
        >
          {t('hotspot_setup.not_owner.subtitle_2')}
        </Text>
      </Box>
      <Box>
        <Button
          title={t('hotspot_setup.onboarding_error.next')}
          mode="contained"
          variant="primary"
          onPress={navExit}
        />
      </Box>
    </BackScreen>
  )
}

export default NotHotspotOwnerErrorScreen