import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, letterSpacing, radius, statusColors, type StatusKey } from '../../constants/theme';

interface StatusBadgeProps {
  status: StatusKey;
}

/**
 * StatusBadge — dashed-outlined pill with a colored dot + lowercase
 * mono label. Always renders in metadata position (right side of a row).
 *
 *   <StatusBadge status="pending"/>
 *   <StatusBadge status="confirmed"/>
 */
export function StatusBadge({ status }: StatusBadgeProps) {
  const c = statusColors[status];
  return (
    <View style={[styles.pill, { backgroundColor: c.bg, borderColor: c.ring }]}>
      <View style={[styles.dot, { backgroundColor: c.ring }]} />
      <Text style={[styles.label, { color: c.fg }]}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignSelf: 'flex-start',
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  label: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: letterSpacing.meta,
    textTransform: 'uppercase',
  },
});
