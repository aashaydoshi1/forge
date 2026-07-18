import { type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, type ScrollViewProps } from 'react-native';

import { Screen } from './Screen';
import { useAndroidKeyboardBottomInset } from './useAndroidKeyboardBottomInset';
import { useKeyboardVerticalOffset } from './useKeyboardVerticalOffset';

interface KeyboardAwareScreenProps {
  children: ReactNode;
  className?: string;
  contentContainerClassName?: string;
  /** Override automatic header-based offset when needed. */
  keyboardVerticalOffset?: number;
  showsVerticalScrollIndicator?: boolean;
  scrollViewProps?: Omit<
    ScrollViewProps,
    'children' | 'contentContainerClassName' | 'showsVerticalScrollIndicator'
  >;
}

/**
 * Screen wrapper that keeps focused inputs visible above the keyboard.
 * Use on form screens. For chat UIs, prefer KeyboardAvoidingLayout.
 */
export function KeyboardAwareScreen({
  children,
  className = '',
  contentContainerClassName = 'pb-32',
  keyboardVerticalOffset,
  showsVerticalScrollIndicator = false,
  scrollViewProps,
}: KeyboardAwareScreenProps) {
  const autoOffset = useKeyboardVerticalOffset();
  const offset = keyboardVerticalOffset ?? autoOffset;
  // Screen already applies bottom safe-area; only pad the remaining IME height on Android.
  const androidKeyboardInset = useAndroidKeyboardBottomInset({ subtractSafeArea: true });

  return (
    <Screen className={className}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
        keyboardVerticalOffset={offset}
        style={androidKeyboardInset > 0 ? { flex: 1, paddingBottom: androidKeyboardInset } : { flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={showsVerticalScrollIndicator}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          // iOS: keep ScrollView inset adjustment. Android: avoid double-counting with IME padding.
          automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
          contentContainerClassName={contentContainerClassName}
          {...scrollViewProps}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
