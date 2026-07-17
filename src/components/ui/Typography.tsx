import { type ReactNode } from 'react';
import { Text, type TextProps } from 'react-native';

type TypographyVariant = 'title' | 'subtitle' | 'body' | 'caption' | 'label';

interface TypographyProps extends TextProps {
  variant?: TypographyVariant;
  children: ReactNode;
}

const variantClasses: Record<TypographyVariant, string> = {
  title: 'text-3xl font-bold text-white',
  subtitle: 'text-lg font-semibold text-forge-100',
  body: 'text-base text-forge-200',
  caption: 'text-sm text-forge-400',
  label: 'text-sm font-medium text-forge-200',
};

export function Typography({ variant = 'body', className = '', children, ...props }: TypographyProps) {
  return (
    <Text className={`${variantClasses[variant]} ${className}`} {...props}>
      {children}
    </Text>
  );
}
