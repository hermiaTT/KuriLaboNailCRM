import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text } from 'react-native';

import { colors, fonts, spacing } from '../../constants/theme';

interface NavTabIconProps {
  focused: boolean;
  icon: string;
  label: string;
}

export function NavTabIcon({ focused, icon, label }: NavTabIconProps) {
  const progress = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      duration: 220,
      easing: Easing.out(Easing.cubic),
      toValue: focused ? 1 : 0,
      useNativeDriver: false,
    }).start();
  }, [focused, progress]);

  const width = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [34, 86],
  });
  const backgroundColor = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(92, 50, 6, 0)', '#5c3206'],
  });
  const iconOpacity = progress.interpolate({
    inputRange: [0, 0.45, 1],
    outputRange: [1, 0.2, 0],
  });
  const iconWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [22, 0.01],
  });
  const labelOpacity = progress.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [0, 0.25, 1],
  });
  const labelWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.01, 72],
  });

  return (
    <Animated.View
      style={[
        styles.wrap,
        {
          backgroundColor,
          shadowOpacity: progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 0.18],
          }),
          width,
        },
      ]}
    >
      <Animated.View pointerEvents="none" style={[styles.iconSlot, { opacity: iconOpacity, width: iconWidth }]}>
        <Text style={styles.icon}>{icon}</Text>
      </Animated.View>
      <Animated.Text
        numberOfLines={1}
        style={[styles.label, { opacity: labelOpacity, width: labelWidth }]}
      >
        {label}
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    height: 34,
    borderRadius: 17,
    overflow: 'hidden',
    paddingHorizontal: spacing.xs,
    shadowColor: '#8fcfee',
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 14,
    elevation: 3,
  },
  icon: {
    color: '#8b8b8b',
    fontFamily: fonts.titleBold,
    fontSize: 19,
    lineHeight: 21,
    textAlign: 'center',
  },
  iconSlot: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  label: {
    color: colors.white,
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    lineHeight: 14,
    textAlign: 'center',
  },
});
