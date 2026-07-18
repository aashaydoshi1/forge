import {
  ActivityIndicator,
  Pressable,
  Text,
  type GestureResponderEvent,
  type PressableProps,
} from 'react-native';
import Animated from 'react-native-reanimated';

import { usePressScale } from '@/components/motion';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps extends PressableProps {
  title: string;
  variant?: ButtonVariant;
  loading?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-accent active:bg-accent-dark',
  secondary: 'bg-forge-800 active:bg-forge-700',
  ghost: 'bg-transparent active:bg-forge-900',
};

const textClasses: Record<ButtonVariant, string> = {
  primary: 'text-white font-semibold',
  secondary: 'text-white font-semibold',
  ghost: 'text-forge-200 font-medium',
};

export function Button({
  title,
  variant = 'primary',
  disabled,
  loading = false,
  className = '',
  style,
  onPressIn,
  onPressOut,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const { animatedStyle, handlePressIn, handlePressOut } = usePressScale({ disabled: isDisabled });

  return (
    <AnimatedPressable
      style={[animatedStyle, style]}
      className={`rounded-xl px-6 py-4 items-center justify-center ${variantClasses[variant]} ${isDisabled ? 'opacity-50' : ''} ${className}`}
      disabled={isDisabled}
      onPressIn={(event: GestureResponderEvent) => {
        handlePressIn();
        onPressIn?.(event);
      }}
      onPressOut={(event: GestureResponderEvent) => {
        handlePressOut();
        onPressOut?.(event);
      }}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'ghost' ? '#d1d1d9' : '#ffffff'} />
      ) : (
        <Text className={textClasses[variant]}>{title}</Text>
      )}
    </AnimatedPressable>
  );
}
