import { StyleSheet, View } from 'react-native';

export function TabBarBackground() {
  return (
    <View pointerEvents="none" style={styles.wrap}>
      <View style={styles.glow} />
      <View style={styles.brush} />
      <View style={[styles.stroke, styles.topStroke]} />
      <View style={[styles.stroke, styles.bottomStroke]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: '104%',
    height: 76,
    borderRadius: 42,
    backgroundColor: 'rgba(205, 239, 255, 0.34)',
    shadowColor: '#b7e8ff',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 3,
  },
  brush: {
    width: '100%',
    height: 62,
    borderRadius: 36,
    backgroundColor: 'rgba(224, 246, 255, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.72)',
  },
  stroke: {
    position: 'absolute',
    width: '64%',
    height: 1,
    borderRadius: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.62)',
  },
  topStroke: {
    top: 18,
    transform: [{ rotate: '-2deg' }],
  },
  bottomStroke: {
    bottom: 17,
    transform: [{ rotate: '1deg' }],
  },
});
