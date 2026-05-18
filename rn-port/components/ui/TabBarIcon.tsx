import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { colors, fonts, letterSpacing, radius } from '../../constants/theme';

interface TabBarIconProps {
  focused: boolean;
  icon: (color: string, size?: number) => React.ReactNode;
  label: string;
}

/**
 * TabBarIcon — used by expo-router Tabs.Screen.tabBarIcon. Wraps the
 * active state with a wobble pill in blueSoft + ink border.
 *
 *   <Tabs.Screen
 *     options={{
 *       tabBarIcon: ({ focused }) => (
 *         <TabBarIcon focused={focused} icon={(c) => <Icons.Home color={c}/>} label="Profile"/>
 *       ),
 *     }}/>
 */
export function TabBarIcon({ focused, icon, label }: TabBarIconProps) {
  const tint = focused ? colors.ink : colors.inkFaint;
  const [size, setSize] = React.useState({ w: 0, h: 0 });

  return (
    <View
      style={styles.wrap}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        if (width !== size.w || height !== size.h) setSize({ w: width, h: height });
      }}
    >
      {focused && size.w > 0 && (
        <Svg
          width={size.w}
          height={size.h}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        >
          <Rect
            x={1}
            y={1}
            width={size.w - 2}
            height={size.h - 2}
            rx={Math.min(28, size.h / 2)}
            ry={Math.min(28, size.h / 2)}
            fill={colors.blueSoft}
            stroke={colors.ink}
            strokeWidth={1}
            filter="url(#wobble-1)"
          />
        </Svg>
      )}
      <View style={styles.inner}>
        {icon(tint, 22)}
        <Text style={[styles.label, { color: tint }]} numberOfLines={1}>
          {label}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
    paddingHorizontal: 14,
    paddingVertical: 6,
    minWidth: 64,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
  },
  inner: {
    alignItems: 'center',
    gap: 3,
    position: 'relative',
    zIndex: 1,
  },
  label: {
    fontFamily: fonts.display,
    fontSize: 10,
    letterSpacing: letterSpacing.display,
    fontWeight: '400',
  },
});
