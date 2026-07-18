import { type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useKeyboardVerticalOffset } from './useKeyboardVerticalOffset';

interface KeyboardAvoidingLayoutProps {
  children: ReactNode;
  /** Sticky bottom content (e.g. chat composer) that lifts with the keyboard. */
  footer?: ReactNode;
  className?: string;
  contentClassName?: string;
  footerClassName?: string;
}

/**
 * Flex layout that keeps a bottom footer above the keyboard.
 * Prefer this for chat-style screens (scrollable body + fixed input).
 */
export function KeyboardAvoidingLayout({
  children,
  footer,
  className = '',
  contentClassName = '',
  footerClassName = '',
}: KeyboardAvoidingLayoutProps) {
  const insets = useSafeAreaInsets();
  const keyboardVerticalOffset = useKeyboardVerticalOffset();

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className={`flex-1 bg-forge-950 ${className}`}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={keyboardVerticalOffset}
        style={{ flex: 1 }}
      >
        <View className={`flex-1 px-6 ${contentClassName}`}>{children}</View>
        {footer ? (
          <View
            className={`border-t border-forge-800 bg-forge-950 px-6 pt-3 ${footerClassName}`}
            style={{ paddingBottom: Math.max(insets.bottom, 12) }}
          >
            {footer}
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
