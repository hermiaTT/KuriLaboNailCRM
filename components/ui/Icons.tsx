import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { colors } from '../../constants/theme';

/**
 * Icons — line-style icon set. Always 1.6 px stroke, round caps/joins.
 * Default size 22. Pass `color` to override (defaults to ink).
 *
 *   <Icons.Home/>
 *   <Icons.Heart color={colors.pinkInk}/>
 *   <Icons.Calendar size={20}/>
 *
 * Don't import other icon libraries — match the existing stroke feel.
 */

interface IconProps {
  color?: string;
  size?: number;
  fill?: string;
}

const baseProps = (color = colors.ink) => ({
  stroke: color,
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  fill: 'none' as const,
});

export const Icons = {
  Home: ({ color, size = 22 }: IconProps) => (
    <Svg viewBox="0 0 24 24" width={size} height={size}>
      <Path {...baseProps(color)} d="M3.5 11.5 12 4l8.5 7.5"/>
      <Path {...baseProps(color)} d="M5.5 10.5V20a1 1 0 0 0 1 1H10v-6h4v6h3.5a1 1 0 0 0 1-1v-9.5"/>
    </Svg>
  ),

  Heart: ({ color = colors.ink, size = 22, fill = 'none' }: IconProps) => (
    <Svg viewBox="0 0 24 24" width={size} height={size}>
      <Path
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={fill}
        d="M12 20.5s-7-4.3-9.2-9C1 8.3 3 4.7 7 5c2 .2 3.4 1.2 5 2.8 1.6-1.6 3-2.6 5-2.8 4-.3 6 3.3 4.2 6.5C19 16.2 12 20.5 12 20.5z"
      />
    </Svg>
  ),

  Sparkle: ({ color, size = 22 }: IconProps) => (
    <Svg viewBox="0 0 24 24" width={size} height={size}>
      <Path {...baseProps(color)} strokeWidth={1.5}
        d="M12 3.5c.2 3 1.6 4.4 4.5 4.7-2.9.3-4.3 1.7-4.5 4.7-.2-3-1.6-4.4-4.5-4.7C10.4 7.9 11.8 6.5 12 3.5z"/>
      <Path {...baseProps(color)} strokeWidth={1.5}
        d="M18.5 14c.1 1.7 1 2.5 2.7 2.7-1.7.2-2.6 1-2.7 2.8-.1-1.8-1-2.6-2.7-2.8 1.7-.2 2.6-1 2.7-2.7z"/>
    </Svg>
  ),

  Calendar: ({ color, size = 22 }: IconProps) => (
    <Svg viewBox="0 0 24 24" width={size} height={size}>
      <Rect {...baseProps(color)} x="3.5" y="5.5" width="17" height="15" rx="2.5"/>
      <Path {...baseProps(color)} d="M8 3.5v4M16 3.5v4M3.5 10.5h17"/>
    </Svg>
  ),

  User: ({ color, size = 22 }: IconProps) => (
    <Svg viewBox="0 0 24 24" width={size} height={size}>
      <Circle {...baseProps(color)} cx="12" cy="8.5" r="3.8"/>
      <Path {...baseProps(color)} d="M4.5 21c.5-4 4-6.5 7.5-6.5s7 2.5 7.5 6.5"/>
    </Svg>
  ),

  Search: ({ color, size = 20 }: IconProps) => (
    <Svg viewBox="0 0 24 24" width={size} height={size}>
      <Circle {...baseProps(color)} cx="11" cy="11" r="6.5"/>
      <Path {...baseProps(color)} d="M20.5 20.5l-4-4"/>
    </Svg>
  ),

  Chev: ({ color, size = 18 }: IconProps) => (
    <Svg viewBox="0 0 24 24" width={size} height={size}>
      <Path {...baseProps(color)} strokeWidth={1.8} d="M9 5.5l7 6.5-7 6.5"/>
    </Svg>
  ),

  ChevL: ({ color, size = 18 }: IconProps) => (
    <Svg viewBox="0 0 24 24" width={size} height={size}>
      <Path {...baseProps(color)} strokeWidth={1.8} d="M15 5.5l-7 6.5 7 6.5"/>
    </Svg>
  ),

  Plus: ({ color, size = 20 }: IconProps) => (
    <Svg viewBox="0 0 24 24" width={size} height={size}>
      <Path {...baseProps(color)} strokeWidth={1.8} d="M12 5.5v13M5.5 12h13"/>
    </Svg>
  ),

  Bell: ({ color, size = 20 }: IconProps) => (
    <Svg viewBox="0 0 24 24" width={size} height={size}>
      <Path {...baseProps(color)}
        d="M6 18h12l-1.4-2V11.2a4.6 4.6 0 0 0-9.2 0V16L6 18z"/>
      <Path {...baseProps(color)} d="M10 20.5h4"/>
    </Svg>
  ),

  Edit: ({ color, size = 18 }: IconProps) => (
    <Svg viewBox="0 0 24 24" width={size} height={size}>
      <Path {...baseProps(color)} d="M4 20.5l4-.8L20 7.7l-3.2-3.2L4.7 16.5l-.7 4z"/>
      <Path {...baseProps(color)} d="M14.5 6l3.2 3.2"/>
    </Svg>
  ),

  LogOut: ({ color, size = 18 }: IconProps) => (
    <Svg viewBox="0 0 24 24" width={size} height={size}>
      <Path {...baseProps(color)} d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <Path {...baseProps(color)} d="M16 17l5-5-5-5"/>
      <Path {...baseProps(color)} d="M21 12H9"/>
    </Svg>
  ),

  Photos: ({ color, size = 22 }: IconProps) => (
    <Svg viewBox="0 0 24 24" width={size} height={size}>
      <Rect {...baseProps(color)} x="2.5" y="4.5" width="19" height="15" rx="2.5"/>
      <Path {...baseProps(color)} d="M2.5 15.5l5-5 3.5 3.5 3-3 5.5 5.5"/>
      <Circle {...baseProps(color)} cx="8" cy="9.5" r="1.5"/>
    </Svg>
  ),

  Trash: ({ color, size = 18 }: IconProps) => (
    <Svg viewBox="0 0 24 24" width={size} height={size}>
      <Path {...baseProps(color)} d="M4.5 7.5h15M10 7.5V5.5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2"/>
      <Path {...baseProps(color)} d="M6 7.5l1 12a1.5 1.5 0 0 0 1.5 1.5h7A1.5 1.5 0 0 0 17 19.5l1-12"/>
      <Path {...baseProps(color)} d="M10 11.5v5M14 11.5v5"/>
    </Svg>
  ),
};
