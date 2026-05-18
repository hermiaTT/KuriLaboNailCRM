import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, Filter, FeTurbulence, FeDisplacementMap } from 'react-native-svg';

/**
 * Wobble — global SVG filter defs for the hand-drawn border effect.
 *
 * Mount ONCE at the root of the app (in `app/_layout.tsx`). Every
 * `<HandRect>`, `<HandChip>`, and `<HandButton>` border layer references
 * these filter IDs (`wobble-1`, `wobble-2`, `wobble-3`) via the `filter`
 * prop on their SVG rect/path.
 *
 * iOS: works reliably.
 * Android: works on recent react-native-svg. If you see jank on long
 * lists, pass `wobble={0}` to the inner component to skip the filter.
 */
export function Wobble() {
  return (
    <View pointerEvents="none" style={styles.host}>
      <Svg width={0} height={0}>
        <Defs>
          {[1, 2, 3].map((n) => (
            <Filter
              key={n}
              id={`wobble-${n}`}
              x="-2%"
              y="-2%"
              width="104%"
              height="104%"
            >
              <FeTurbulence
                type="fractalNoise"
                baseFrequency="0.018"
                numOctaves={2}
                seed={n}
              />
              <FeDisplacementMap in="SourceGraphic" scale={n * 0.9} />
            </Filter>
          ))}
        </Defs>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  host: { position: 'absolute', width: 0, height: 0 },
});
