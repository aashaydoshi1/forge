import { Platform } from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';

/**
 * Shared keyboard offset for Forge screens with a navigation header.
 * iOS needs the header height for KeyboardAvoidingView.
 * Android IME clearance is handled by useAndroidKeyboardBottomInset instead.
 */
export function useKeyboardVerticalOffset(extraOffset = 0): number {
  const headerHeight = useHeaderHeight();

  if (Platform.OS === 'ios') {
    return headerHeight + extraOffset;
  }

  return extraOffset;
}
