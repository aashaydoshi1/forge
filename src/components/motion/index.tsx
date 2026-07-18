import { type ReactNode, useRef } from 'react';
import { Pressable, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const ENTER_MS = 240;
const PRESS_IN_MS = 100;
const PRESS_OUT_MS = 160;
const EASE = Easing.out(Easing.cubic);

/** Session-scoped keys so entrance animations do not replay after remounts (e.g. tab refocus). */
const playedEntranceKeys = new Set<string>();

type FadeInViewProps = {
  children: ReactNode;
  /** Stagger delay in ms (e.g. Home dashboard cards). */
  delay?: number;
  /**
   * When set, entrance runs at most once per app session for this key.
   * Prevents replay on tab refocus / loading remounts without changing data logic.
   */
  onceKey?: string;
  className?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * One-shot fade + slight upward slide on mount.
 * Uses Reanimated `entering` (not scroll-driven), so scrolling does not re-trigger it.
 */
export function FadeInView({
  children,
  delay = 0,
  onceKey,
  className = '',
  style,
}: FadeInViewProps) {
  const shouldAnimate = useRef(
    onceKey == null ? true : !playedEntranceKeys.has(onceKey),
  ).current;

  if (onceKey && shouldAnimate) {
    playedEntranceKeys.add(onceKey);
  }

  return (
    <Animated.View
      entering={
        shouldAnimate
          ? FadeInDown.duration(ENTER_MS)
              .delay(delay)
              .easing(EASE)
              .withInitialValues({ opacity: 0, transform: [{ translateY: 8 }] })
          : undefined
      }
      className={className}
      style={style}
    >
      {children}
    </Animated.View>
  );
}

type FadePresenceProps = {
  children: ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
};

/** Mount/unmount fade for transient UI (rest timer). */
export function FadePresence({ children, className = '', style }: FadePresenceProps) {
  return (
    <Animated.View
      entering={FadeIn.duration(200).easing(EASE)}
      exiting={FadeOut.duration(160).easing(EASE)}
      className={className}
      style={style}
    >
      {children}
    </Animated.View>
  );
}

type FadeInTextProps = {
  children: ReactNode;
  className?: string;
};

/** Fade-in text for labels that appear conditionally (Beat Last Session). */
export function FadeInText({ children, className = '' }: FadeInTextProps) {
  return (
    <Animated.Text entering={FadeIn.duration(220).easing(EASE)} className={className}>
      {children}
    </Animated.Text>
  );
}

type UsePressScaleOptions = {
  disabled?: boolean;
  pressedScale?: number;
};

/** Shared press scale for Button and other press targets. */
export function usePressScale({ disabled = false, pressedScale = 0.97 }: UsePressScaleOptions = {}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (disabled) return;
    scale.value = withTiming(pressedScale, { duration: PRESS_IN_MS, easing: EASE });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: PRESS_OUT_MS, easing: EASE });
  };

  return { animatedStyle, handlePressIn, handlePressOut };
}

type ScalePressableProps = {
  children: ReactNode;
  disabled?: boolean;
  className?: string;
  onPress?: () => void;
  accessibilityRole?: 'button';
  accessibilityState?: { disabled?: boolean };
  accessibilityLabel?: string;
};

/** Compact press target with soft scale (for non-Button CTAs). */
export function ScalePressable({
  children,
  disabled = false,
  className = '',
  onPress,
  accessibilityRole = 'button',
  accessibilityState,
  accessibilityLabel,
}: ScalePressableProps) {
  const { animatedStyle, handlePressIn, handlePressOut } = usePressScale({ disabled });

  return (
    <Animated.View style={animatedStyle} className={className}>
      <Pressable
        disabled={disabled}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole={accessibilityRole}
        accessibilityState={accessibilityState ?? { disabled }}
        accessibilityLabel={accessibilityLabel}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
