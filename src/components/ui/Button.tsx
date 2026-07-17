import { ActivityIndicator, Pressable, Text, type PressableProps } from 'react-native';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps extends PressableProps {
  title: string;
  variant?: ButtonVariant;
  loading?: boolean;
}

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
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      className={`rounded-xl px-6 py-4 items-center justify-center ${variantClasses[variant]} ${isDisabled ? 'opacity-50' : ''} ${className}`}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'ghost' ? '#d1d1d9' : '#ffffff'} />
      ) : (
        <Text className={textClasses[variant]}>{title}</Text>
      )}
    </Pressable>
  );
}
